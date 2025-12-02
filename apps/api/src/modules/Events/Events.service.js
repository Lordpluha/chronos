import { Event } from '../../models/Event.js'
import { Calendar } from '../../models/Calendar.js'
import { User } from '../../models/User.js'
import { Access } from '../../models/Access.js'
import { EmailUtils } from '../../utils/EmailUtils.js'
import mongoose from 'mongoose'

class EventsService {
  /**
   * Создать новое событие (включая рекуррентные)
   */
  async createEvent(userId, data) {
    const {
      title,
      description,
      calendar_id,
      time_zone,
      start,
      end,
      location,
      is_all_day,
      status,
      attendees,
      recurrence,
    } = data

    // Проверяем доступ к календарю
    const calendar = await Calendar.findById(calendar_id)
    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    if (!calendar.hasAccess(userId, 'write')) {
      const error = new Error('Access denied to calendar')
      error.status = 403
      throw error
    }

    const event = new Event({
      title,
      description,
      creator: userId,
      organizer: userId,
      calendar: calendar_id,
      time_zone: time_zone || calendar.time_zone || 'UTC',
      start: new Date(start),
      end: new Date(end),
      location,
      is_all_day: is_all_day || false,
      status: status || 'confirmed',
      attendees: attendees || [],
      recurrence: recurrence || null,
      is_recurring: !!recurrence,
    })

    await event.save()

    // Добавляем событие в календарь
    calendar.addEvent(event._id)
    await calendar.save()

    return event
  }

  /**
   * Получить события календаря (включая экземпляры рекуррентных событий)
   */
  async getCalendarEvents(calendarId, userId, query = {}) {
    const calendar = await Calendar.findById(calendarId)
    if (!calendar) {
      const error = new Error('Calendar not found')
      error.status = 404
      throw error
    }

    if (!calendar.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    const { startDate, endDate, status, expand_recurring } = query

    if (startDate && endDate && expand_recurring === 'true') {
      // Используем метод для расширения рекуррентных событий
      let events = await Event.findWithRecurrence(
        calendarId,
        new Date(startDate),
        new Date(endDate)
      )

      if (status) {
        events = events.filter((event) => event.status === status)
      }

      return events
    }

    // Обычный запрос без расширения рекуррентных событий
    const options = {}
    if (startDate) options.startDate = new Date(startDate)
    if (endDate) options.endDate = new Date(endDate)

    let events = await Event.findByCalendar(calendarId, options)

    if (status) {
      events = events.filter((event) => event.status === status)
    }

    return events
  }

  /**
   * Получить события пользователя (включая из shared календарей)
   */
  async getUserEvents(userId, query = {}) {
    const { startDate, endDate, status } = query

    // Получаем все календари пользователя (включая shared)
    const user = await User.findById(userId).populate('calendars')
    if (!user) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    const calendarIds = user.calendars.map(cal => cal._id)

    let events = []

    // Загружаем события из всех календарей пользователя
    if (calendarIds.length > 0) {
      const query = { calendar: { $in: calendarIds } }

      if (startDate && endDate) {
        query.start = { $gte: new Date(startDate), $lte: new Date(endDate) }
      }

      events = await Event.find(query)
        .populate('creator organizer calendar')
        .populate('attendees.user')
        .sort({ start: 1 })
    }

    if (status) {
      events = events.filter((event) => event.status === status)
    }

    console.log(`📊 Loaded ${events.length} events for user from ${calendarIds.length} calendars`)
    return events
  }

  /**
   * Получить событие по ID
   */
  async getEventById(eventId, userId) {
    const event = await Event.findById(eventId).populate('creator organizer calendar attendees.user')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // Проверяем доступ через календарь
    if (event.calendar && typeof event.calendar !== 'string') {
      if (!event.calendar.hasAccess(userId)) {
        const error = new Error('Access denied')
        error.status = 403
        throw error
      }
    }

    return event
  }

  /**
   * Обновить событие
   */
  async updateEvent(eventId, userId, data) {
    const event = await Event.findById(eventId).populate('calendar')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // Проверяем права на редактирование
    if (event.calendar && typeof event.calendar !== 'string') {
      if (!event.calendar.hasAccess(userId, 'write')) {
        const error = new Error('Access denied')
        error.status = 403
        throw error
      }
    }

    // Обновляем поля
    if (data.title !== undefined) event.title = data.title
    if (data.description !== undefined) event.description = data.description
    if (data.time_zone !== undefined) event.time_zone = data.time_zone
    if (data.start !== undefined) event.start = new Date(data.start)
    if (data.end !== undefined) event.end = new Date(data.end)
    if (data.location !== undefined) event.location = data.location
    if (data.is_all_day !== undefined) event.is_all_day = data.is_all_day
    if (data.status !== undefined) event.status = data.status
    if (data.recurrence !== undefined) {
      event.recurrence = data.recurrence
      event.is_recurring = !!data.recurrence
    }

    await event.save()
    return event
  }

  /**
   * Удалить рекуррентное событие
   * @param {string} eventId - ID события
   * @param {string} userId - ID пользователя
   * @param {Object} options - Опции удаления
   * @param {boolean} options.delete_all - Удалить все экземпляры (по умолчанию true для мастер-события)
   * @param {Date} options.occurrence_date - Дата конкретного экземпляра для создания исключения
   */
  async deleteRecurringEvent(eventId, userId, options = {}) {
    const event = await Event.findById(eventId).populate('calendar')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // Проверяем права
    if (event.calendar && typeof event.calendar !== 'string') {
      if (!event.calendar.hasAccess(userId, 'write') && event.organizer.toString() !== userId) {
        const error = new Error('Access denied')
        error.status = 403
        throw error
      }
    }

    // Если это мастер-событие и нужно удалить все экземпляры
    if (event.isMasterEvent() && (options.delete_all === undefined || options.delete_all === true)) {
      // Удаляем все экземпляры
      await Event.deleteMany({ recurrence_id: event._id })

      // Удаляем мастер-событие
      if (event.calendar && typeof event.calendar !== 'string') {
        event.calendar.removeEvent(event._id)
        await event.calendar.save()
      }

      await event.deleteOne()
      return { message: 'All recurring events deleted successfully' }
    }

    // Если это экземпляр рекуррентного события
    if (event.isRecurrenceInstance()) {
      await event.deleteOne()
      return { message: 'Event occurrence deleted successfully' }
    }

    // Обычное удаление одного события
    if (event.calendar && typeof event.calendar !== 'string') {
      event.calendar.removeEvent(event._id)
      await event.calendar.save()
    }

    await event.deleteOne()
    return { message: 'Event deleted successfully' }
  }

  /**
   * Удалить событие
   */
  async deleteEvent(eventId, userId) {
    const event = await Event.findById(eventId).populate('calendar')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // Проверяем права (организатор или доступ к календарю)
    if (event.calendar && typeof event.calendar !== 'string') {
      if (!event.calendar.hasAccess(userId, 'write') && event.organizer.toString() !== userId) {
        const error = new Error('Access denied')
        error.status = 403
        throw error
      }
    }

    // Удаляем событие из календаря
    if (event.calendar && typeof event.calendar !== 'string') {
      event.calendar.removeEvent(event._id)
      await event.calendar.save()
    }

    await event.deleteOne()
    return { message: 'Event deleted successfully' }
  }

  /**
   * Добавить участника к событию (через Access модель)
   */
  async addAttendee(eventId, userId, attendeeData) {
    const event = await Event.findById(eventId).populate('calendar')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    if (!event.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    const { user_id, email, role } = attendeeData
    // NOTE: role используется для определения прав доступа через Access модель

    let targetUserId = user_id
    let targetEmail = email

    // Если передан email, пытаемся найти пользователя
    if (email && !user_id) {
      const targetUser = await User.findByEmail(email)
      if (targetUser) {
        targetUserId = targetUser._id
        targetEmail = targetUser.email
      } else {
        // Пользователь не найден, но можем добавить по email
        console.log(`⚠️ User not found for email: ${email}, adding as external attendee`)
      }
    }

    // Если есть userId, получаем email
    if (user_id && !email) {
      const targetUser = await User.findById(user_id)
      if (targetUser) {
        targetEmail = targetUser.email
      } else {
        const error = new Error('User not found')
        error.status = 404
        throw error
      }
    }

    if (!targetUserId && !targetEmail) {
      const error = new Error('Either user_id or email is required')
      error.status = 400
      throw error
    }

    // Определяем права доступа на основе роли
    // organizer -> read, update, delete, share
    // participant -> read, update (может обновить свой статус)
    // viewer -> read
    const accessRights = {
      organizer: ['read', 'update', 'delete', 'share'],
      participant: ['read', 'update'],
      viewer: ['read']
    }

    const typesToGrant = accessRights[role] || accessRights.participant

    // Создаем Access записи если есть userId
    if (targetUserId) {
      for (const type of typesToGrant) {
        const accessName = `event.${type}.${new mongoose.Types.ObjectId().toString()}`
        await Access.grantAccess(
          targetUserId,
          'event',
          type,
          event._id,
          accessName
        )
      }
      console.log(`✅ Access records created for event attendee: ${typesToGrant.join(', ')}`)

      // Даем доступ к календарю, в котором находится событие
      const targetUser = await User.findById(targetUserId)
      if (targetUser && event.calendar) {
        // Проверяем, есть ли уже доступ к календарю
        if (!targetUser.calendars.includes(event.calendar._id)) {
          // Даем read доступ к календарю через Access
          const calendarAccessName = `calendar.read.${new mongoose.Types.ObjectId().toString()}`
          await Access.grantAccess(
            targetUserId,
            'calendar',
            'read',
            event.calendar._id,
            calendarAccessName
          )

          // Добавляем календарь в список пользователя
          targetUser.addCalendar(event.calendar._id)
          await targetUser.save()
          console.log(`✅ Calendar access granted to: ${targetEmail}`)
        }
      }
    }

    // Добавляем участника в событие
    if (targetUserId) {
      event.addAttendee(targetUserId, true)
    } else if (targetEmail) {
      event.addAttendee(targetEmail, false)
    }

    await event.save()

    // Отправляем email приглашение
    try {
      const organizer = await User.findById(userId)

      if (targetEmail && organizer) {
        await EmailUtils.sendEmail({
          to: targetEmail,
          subject: `You're invited to: ${event.title}`,
          html: EmailUtils.generateEventInviteEmail(
            organizer.login,
            event.title,
            event.start,
            event.end,
            role || 'participant'
          ),
        })
        console.log(`✅ Event invite email sent to ${targetEmail}`)
      }
    } catch (emailError) {
      console.error('❌ Failed to send event invite email:', emailError.message)
      // Не бросаем ошибку, участник уже добавлен
    }

    return event
  }

  /**
   * Обновить статус участника
   */
  async updateAttendeeStatus(eventId, userId, status) {
    const event = await Event.findById(eventId)

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    event.updateAttendeeStatus(userId, status, true)
    await event.save()

    return event
  }

  /**
   * Удалить участника (и его Access записи)
   */
  async removeAttendee(eventId, userId, attendeeId) {
    const event = await Event.findById(eventId).populate('calendar')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    if (!event.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Удаляем ВСЕ Access записи для этого участника и события
    const accessTypes = ['read', 'update', 'delete', 'share']
    for (const type of accessTypes) {
      await Access.revokeAccess(
        attendeeId,
        'event',
        type,
        event._id
      )
    }

    event.removeAttendee(attendeeId, true)
    await event.save()

    console.log(`✅ All access records removed for attendee on event ${event.title}`)

    return event
  }
}

export const eventsService = new EventsService()
