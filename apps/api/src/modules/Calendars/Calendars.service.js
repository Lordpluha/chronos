import { Calendar } from '../../models/Calendar.js'
import { Event } from '../../models/Event.js'
import { Reminder } from '../../models/Reminder.js'
import { User } from '../../models/User.js'
import { Access } from '../../models/Access.js'
import { EmailUtils } from '../../utils/EmailUtils.js'
import mongoose from 'mongoose'

class CalendarsService {
  /**
   * Создать новый календарь
   */
  async createCalendar(userId, data) {
    const { title, description, time_zone, color, visibility, is_default } = data

    const calendar = new Calendar({
      title,
      description,
      time_zone: time_zone || 'UTC',
      color: color || '#3b82f6',
      visibility: visibility || 'private',
      is_default: is_default || false,
      creator: userId,
      owner: userId,
    })

    await calendar.save()

    // Добавляем календарь в список пользователя
    const user = await User.findById(userId)
    if (user) {
      user.addCalendar(calendar._id)
      await user.save()
    }

    return calendar
  }

  /**
   * Получить все календари пользователя
   */
  async getUserCalendars(userId) {
    const calendars = await Calendar.findAccessibleByUser(userId)
    return calendars
  }

  /**
   * Получить календарь по ID
   */
  async getCalendarById(calendarId, userId) {
    const calendar = await Calendar.findById(calendarId)
      .populate('owner creator')
      .populate('reminders')
      .populate('events')

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Проверяем доступ
    if (!calendar.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    return calendar
  }

  /**
   * Обновить календарь
   */
  async updateCalendar(calendarId, userId, data) {
    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Проверяем права на редактирование
    if (!calendar.hasAccess(userId, 'write')) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Обновляем поля
    if (data.title !== undefined) calendar.title = data.title
    if (data.description !== undefined) calendar.description = data.description
    if (data.time_zone !== undefined) calendar.time_zone = data.time_zone
    if (data.color !== undefined) calendar.color = data.color
    if (data.visibility !== undefined) calendar.visibility = data.visibility
    if (data.is_default !== undefined) calendar.is_default = data.is_default

    await calendar.save()
    return calendar
  }

  /**
   * Удалить календарь
   */
  async deleteCalendar(calendarId, userId) {
    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Только владелец может удалить календарь
    const ownerId = calendar.owner?._id ? calendar.owner._id.toString() : calendar.owner.toString()
    if (ownerId !== userId.toString()) {
      const error = new Error('Only owner can delete calendar')
      error.status = 403
      throw error
    }

    // Удаляем все события и напоминания календаря
    await Event.deleteMany({ calendar: calendarId })
    await Reminder.deleteMany({ calendar: calendarId })

    // Удаляем календарь из списка пользователя
    const user = await User.findById(userId)
    if (user) {
      user.removeCalendar(calendarId)
      await user.save()
    }

    await calendar.deleteOne()
    return { message: 'Calendar deleted successfully' }
  }

  /**
   * Поделиться календарем с пользователем (через Access модель)
   */
  async shareCalendar(calendarId, userId, shareData) {
    const { userEmail, permission } = shareData

    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Проверяем что текущий пользователь - владелец
    if (calendar.owner.toString() !== userId.toString()) {
      const error = new Error('Only calendar owner can share')
      error.status = 403
      throw error
    }

    // Находим пользователя по email
    const targetUser = await User.findByEmail(userEmail)
    if (!targetUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    // Нельзя делиться с самим собой
    if (targetUser._id.toString() === userId.toString()) {
      const error = new Error('Cannot share calendar with yourself')
      error.status = 400
      throw error
    }

    // Создаем Access записи на основе permission
    // read -> read
    // write -> read, update
    // admin -> read, update, delete, share
    const accessTypes = {
      read: ['read'],
      write: ['read', 'update'],
      admin: ['read', 'update', 'delete', 'share']
    }

    const typesToGrant = accessTypes[permission] || ['read']

    // Создаем Access записи для каждого типа
    for (const type of typesToGrant) {
      const accessName = `calendar.${type}.${new mongoose.Types.ObjectId().toString()}`
      await Access.grantAccess(
        targetUser._id,
        'calendar',
        type,
        calendar._id,
        accessName
      )
    }

    // Также добавляем в shared_with для обратной совместимости
    calendar.shareWith(targetUser._id, permission)
    await calendar.save()

    // Добавляем календарь в список пользователя
    targetUser.addCalendar(calendar._id)
    await targetUser.save()

    // Получаем владельца для email
    const owner = await User.findById(userId)

    // Отправляем email уведомление
    try {
      await EmailUtils.sendEmail({
        to: targetUser.email,
        subject: `${owner.login} shared a calendar with you`,
        html: EmailUtils.generateCalendarShareEmail(
          owner.login,
          calendar.title,
          permission
        ),
      })
      console.log(`✅ Calendar share email sent to ${targetUser.email}`)
      console.log(`✅ Access records created for ${targetUser.email}: ${typesToGrant.join(', ')}`)
    } catch (emailError) {
      console.error('❌ Failed to send calendar share email:', emailError.message)
      // Не бросаем ошибку, календарь уже расшарен
    }

    return calendar
  }  /**
   * Удалить доступ к календарю (через Access модель)
   */
  async removeCalendarAccess(calendarId, userId, targetUserEmail) {
    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Только владелец может удалять доступ
    if (calendar.owner.toString() !== userId.toString()) {
      const error = new Error('Only calendar owner can remove access')
      error.status = 403
      throw error
    }

    const targetUser = await User.findByEmail(targetUserEmail)
    if (!targetUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    // Удаляем ВСЕ Access записи для этого пользователя и календаря
    const accessTypes = ['read', 'update', 'delete', 'share']
    for (const type of accessTypes) {
      await Access.revokeAccess(
        targetUser._id,
        'calendar',
        type,
        calendar._id
      )
    }

    // Также удаляем из shared_with для обратной совместимости
    calendar.removeSharedAccess(targetUser._id)
    await calendar.save()

    // Удаляем календарь из списка пользователя
    targetUser.removeCalendar(calendar._id)
    await targetUser.save()

    console.log(`✅ All access records removed for ${targetUser.email} on calendar ${calendar.title}`)

    return calendar
  }
}

export const calendarsService = new CalendarsService()
