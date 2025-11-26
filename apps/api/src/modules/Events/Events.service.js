import { Event } from '../../models/Event.js'
import { Calendar } from '../../models/Calendar.js'

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
   * Получить события пользователя
   */
  async getUserEvents(userId, query = {}) {
    const { startDate, endDate, status } = query

    let events

    if (startDate && endDate) {
      events = await Event.findInDateRange(new Date(startDate), new Date(endDate))
    } else {
      events = await Event.findByAttendee(userId)
    }

    // Фильтруем события по доступу пользователя
    events = events.filter((event) => {
      if (event.calendar && typeof event.calendar !== 'string') {
        return event.calendar.hasAccess(userId)
      }
      return false
    })

    if (status) {
      events = events.filter((event) => event.status === status)
    }

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
   * Добавить участника к событию
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

    const { user_id, email } = attendeeData

    if (user_id) {
      event.addAttendee(user_id, true)
    } else if (email) {
      event.addAttendee(email, false)
    } else {
      const error = new Error('Either user_id or email is required')
      error.status = 400
      throw error
    }

    await event.save()
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
   * Удалить участника
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

    event.removeAttendee(attendeeId, true)
    await event.save()

    return event
  }
}

export const eventsService = new EventsService()
