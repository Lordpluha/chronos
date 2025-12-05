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
    // НОВАЯ ЛОГИКА: Загружаем календари из user.calendars (включает shared через Access)
    const user = await User.findById(userId).populate({
      path: 'calendars',
      populate: [
        {
          path: 'owner',
          select: 'email login avatar' // Populate owner with needed fields
        },
        {
          path: 'creator',
          select: 'email login avatar' // Populate creator with needed fields
        },
        {
          path: 'shared_with.user',
          select: 'email login avatar' // Populate users in shared_with array
        }
      ]
    })

    if (!user) {
      return []
    }

    return user.calendars || []
  }  /**
   * Получить календарь по ID
   */
  async getCalendarById(calendarId, userId, allowPublicAccess = true) {
    const calendar = await Calendar.findById(calendarId)
      .populate('owner creator')
      .populate('reminders')
      .populate('events')
      .populate('shared_with.user') // Populate users in shared_with array

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Проверяем доступ
    if (!allowPublicAccess && !calendar.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Логируем доступ для отладки
    console.log(`📋 Calendar access check: ${calendar.title} (${calendarId})`, {
      userId,
      allowPublicAccess,
      hasAccess: calendar.hasAccess(userId)
    });

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

    // Проверяем права: владелец ИЛИ admin с правом 'share'
    const isOwner = calendar.owner.toString() === userId.toString()
    const hasShareAccess = await Access.findOne({
      user: userId,
      controls: 'calendar',
      entity_id: calendarId,
      type: 'share'
    })

    if (!isOwner && !hasShareAccess) {
      const error = new Error('Access denied: no share permission')
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
    // viewer -> read
    // admin -> read, update, delete, share
    // owner -> read, update, delete, share (аналогично admin, но семантически выше)
    const accessTypes = {
      viewer: ['read'],
      admin: ['read', 'update', 'delete', 'share'],
      owner: ['read', 'update', 'delete', 'share'],
      // Поддержка старых названий для обратной совместимости
      read: ['read'],
      write: ['read', 'update'],
    }

    const typesToGrant = accessTypes[permission] || ['read']

    // Проверяем, есть ли у пользователя уже доступ к этому календарю
    const existingAccess = await Access.findOne({
      user: targetUser._id,
      controls: 'calendar',
      entity_id: calendar._id
    })

    const isNewInvitation = !existingAccess

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

    // НЕ добавляем календарь в список пользователя сразу!
    // Пользователь должен принять приглашение через /calendars/:id/accept
    // targetUser.addCalendar(calendar._id)
    // await targetUser.save()

    // Отправляем email ТОЛЬКО если это новое приглашение (не смена роли)
    if (isNewInvitation) {
      // Получаем владельца для email
      const owner = await User.findById(userId)

      try {
        await EmailUtils.sendEmail({
          to: targetUser.email,
          subject: `${owner.login} invited you to join a calendar`,
          html: EmailUtils.generateCalendarShareEmail(
            owner.login,
            calendar.title,
            permission,
            calendar._id.toString()
          ),
        })
        console.log(`✅ Calendar invitation email sent to ${targetUser.email}`)
      } catch (emailError) {
        console.error('❌ Failed to send calendar invitation email:', emailError.message)
        // Не бросаем ошибку, доступы уже созданы
      }
    } else {
      console.log(`📝 Calendar permissions updated for ${targetUser.email} (no email sent)`)
    }

    console.log(`✅ Access records created/updated for ${targetUser.email}: ${typesToGrant.join(', ')}`)

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

    // Проверяем права: владелец ИЛИ admin с правом 'delete'
    const isOwner = calendar.owner.toString() === userId.toString()
    const hasDeleteAccess = await Access.findOne({
      user: userId,
      controls: 'calendar',
      entity_id: calendarId,
      type: 'delete'
    })

    if (!isOwner && !hasDeleteAccess) {
      const error = new Error('Access denied: no delete permission')
      error.status = 403
      throw error
    }

    const targetUser = await User.findByEmail(targetUserEmail)
    if (!targetUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    // Нельзя удалить владельца
    if (targetUser._id.toString() === calendar.owner.toString()) {
      const error = new Error('Cannot remove calendar owner')
      error.status = 400
      throw error
    }

    // Admin не может удалить другого admin
    if (!isOwner) {
      const targetHasDeleteAccess = await Access.findOne({
        user: targetUser._id,
        controls: 'calendar',
        entity_id: calendarId,
        type: 'delete'
      })

      if (targetHasDeleteAccess) {
        const error = new Error('Admin cannot remove another admin')
        error.status = 403
        throw error
      }
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

  /**
   * Обновить права доступа к календарю (через Access модель)
   */
  async updateCalendarAccess(calendarId, userId, updateData) {
    const { userEmail, permission } = updateData

    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Проверяем права: владелец ИЛИ admin с правом 'delete'
    const isOwner = calendar.owner.toString() === userId.toString()
    const hasDeleteAccess = await Access.findOne({
      user: userId,
      controls: 'calendar',
      entity_id: calendarId,
      type: 'delete'
    })

    if (!isOwner && !hasDeleteAccess) {
      const error = new Error('Access denied: no delete permission')
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

    // Нельзя изменять права владельца
    if (targetUser._id.toString() === calendar.owner.toString()) {
      const error = new Error('Cannot change calendar owner permissions')
      error.status = 400
      throw error
    }

    // Admin не может изменить права другого admin
    if (!isOwner) {
      const targetHasDeleteAccess = await Access.findOne({
        user: targetUser._id,
        controls: 'calendar',
        entity_id: calendarId,
        type: 'delete'
      })

      if (targetHasDeleteAccess) {
        const error = new Error('Admin cannot change another admin\'s permissions')
        error.status = 403
        throw error
      }
    }

    // Нельзя изменять права для самого себя
    if (targetUser._id.toString() === userId.toString()) {
      const error = new Error('Cannot update your own permissions')
      error.status = 400
      throw error
    }

    // Сначала удаляем все текущие права
    const allAccessTypes = ['read', 'update', 'delete', 'share']
    for (const type of allAccessTypes) {
      await Access.revokeAccess(
        targetUser._id,
        'calendar',
        type,
        calendar._id
      )
    }

    // Создаем новые Access записи на основе permission
    const accessTypes = {
      viewer: ['read'],
      admin: ['read', 'update', 'delete', 'share'],
      owner: ['read', 'update', 'delete', 'share'],
      // Поддержка старых названий для обратной совместимости
      read: ['read'],
      write: ['read', 'update'],
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

    // Также обновляем в shared_with для обратной совместимости
    calendar.updateSharedPermission(targetUser._id, permission)
    await calendar.save()

    console.log(`✅ Access updated for ${targetUser.email}: ${typesToGrant.join(', ')}`)

    return calendar
  }

  /**
   * Подписаться на календарь через публичную ссылку (self-subscription)
   * Если userEmail не указан - используется текущий userId
   */
  async subscribeToCalendar(calendarId, currentUserId, subscriptionData = {}) {
    const { userEmail, permission = 'read' } = subscriptionData

    console.log('🔗 Calendar subscription request:', { calendarId, currentUserId, userEmail, permission });

    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    // Определяем целевого пользователя
    let targetUser;
    if (userEmail) {
      // Если указан email - ищем по нему
      targetUser = await User.findByEmail(userEmail)
      if (!targetUser) {
        const error = new Error('User not found')
        error.status = 404
        throw error
      }
    } else {
      // Если email не указан - используем текущего пользователя (самоподписка)
      targetUser = await User.findById(currentUserId)
      if (!targetUser) {
        const error = new Error('Current user not found')
        error.status = 404
        throw error
      }
      console.log('👤 Self-subscription for user:', targetUser.email);
    }

    // Проверяем не является ли пользователь уже владельцем
    if (calendar.owner.toString() === targetUser._id.toString()) {
      console.log('⚠️ User is already the owner of this calendar');
      return calendar; // Владелец уже имеет полный доступ
    }

    // Проверяем нет ли уже доступа
    const existingAccess = await Access.hasAccess(targetUser._id, 'calendar', 'read', calendar._id);
    if (existingAccess) {
      console.log('✅ User already has access to this calendar');
      return calendar;
    }

    // Создаем Access записи (только для чтения при самоподписке)
    const accessName = `calendar.read.${new mongoose.Types.ObjectId().toString()}`;
    await Access.grantAccess(
      targetUser._id,
      'calendar',
      'read',
      calendar._id,
      accessName
    );

    // Добавляем в shared_with для обратной совместимости
    calendar.shareWith(targetUser._id, permission);
    await calendar.save();

    // Добавляем календарь в список пользователя
    targetUser.addCalendar(calendar._id);
    await targetUser.save();

    console.log(`✅ User ${targetUser.email} subscribed to calendar "${calendar.title}"`);

    return calendar;
  }

  /**
   * Принять приглашение в календарь
   */
  async acceptCalendarInvitation(calendarId, userId) {
    const calendar = await Calendar.findById(calendarId)

    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    const user = await User.findById(userId)
    if (!user) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    // Проверяем, есть ли у пользователя доступ к этому календарю
    const hasAccess = await Access.hasAccess(userId, 'calendar', 'read', calendarId)
    if (!hasAccess) {
      const error = new Error('No invitation found for this calendar')
      error.status = 403
      throw error
    }

    // Проверяем, не добавлен ли календарь уже
    if (user.calendars.includes(calendarId)) {
      console.log('✅ Calendar already accepted')
      return calendar
    }

    // Добавляем календарь в список пользователя
    user.addCalendar(calendarId)
    await user.save()

    console.log(`✅ User ${user.email} accepted invitation to calendar "${calendar.title}"`)

    return calendar
  }
}

export const calendarsService = new CalendarsService()
