import { Calendar } from '../../models/Calendar.js'
import { Event } from '../../models/Event.js'
import { Reminder } from '../../models/Reminder.js'
import { User } from '../../models/User.js'

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
    const calendar = await Calendar.findById(calendarId).populate('owner creator')

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
   * Поделиться календарем с пользователем
   */
  async shareCalendar(calendarId, userId, shareData) {
    const { userEmail, permission } = shareData

    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Только владелец или администратор может делиться
    if (!calendar.hasAccess(userId, 'admin')) {
      const error = new Error('Access denied')
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

    calendar.shareWith(targetUser._id, permission)
    await calendar.save()

    // Добавляем календарь в список пользователя
    targetUser.addCalendar(calendar._id)
    await targetUser.save()

    return calendar
  }

  /**
   * Удалить доступ к календарю
   */
  async removeCalendarAccess(calendarId, userId, targetUserEmail) {
    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Только владелец или администратор может удалять доступ
    if (!calendar.hasAccess(userId, 'admin')) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    const targetUser = await User.findByEmail(targetUserEmail)
    if (!targetUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    calendar.removeSharedAccess(targetUser._id)
    await calendar.save()

    // Удаляем календарь из списка пользователя
    targetUser.removeCalendar(calendar._id)
    await targetUser.save()

    return calendar
  }
}

export const calendarsService = new CalendarsService()
