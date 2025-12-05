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

    // Проверяем права: owner ИЛИ есть права 'update' (write/admin)
    const isOwner = calendar.owner.toString() === userId.toString()
    const hasUpdateAccess = await Access.findOne({
      user: userId,
      controls: 'calendar',
      entity_id: calendar_id,
      type: 'update'
    })

    if (!isOwner && !hasUpdateAccess) {
      const error = new Error('Access denied: no write permission to calendar')
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

    // Преобразуем userId в ObjectId для правильного сравнения
    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Получаем все календари пользователя (включая shared)
    const user = await User.findById(userId).populate('calendars')
    if (!user) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    const calendarIds = user.calendars.map(cal => cal._id)

    let eventsFromCalendars = []
    let eventsAsAttendee = []

    // 1. Загружаем события из календарей пользователя
    if (calendarIds.length > 0) {
      const queryObj = { calendar: { $in: calendarIds } }

      if (startDate && endDate) {
        queryObj.start = { $gte: new Date(startDate), $lte: new Date(endDate) }
      }

      eventsFromCalendars = await Event.find(queryObj)
        .populate('creator organizer calendar')
        .populate('attendees.user')
        .sort({ start: 1 })
    }

    // 2. Загружаем события где пользователь - attendee С ПРИНЯТЫМ ПРИГЛАШЕНИЕМ (но календарь НЕ в user.calendars)
    const attendeeQuery = {
      attendees: {
        $elemMatch: {
          user: userObjectId,
          status: 'accepted' // Только принятые приглашения!
        }
      }
    }

    // Исключаем календари которые уже в user.calendars (чтобы не было дубликатов)
    if (calendarIds.length > 0) {
      attendeeQuery.calendar = { $nin: calendarIds }
    }

    if (startDate && endDate) {
      attendeeQuery.start = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    eventsAsAttendee = await Event.find(attendeeQuery)
      .populate('creator organizer calendar')
      .populate('attendees.user')
      .sort({ start: 1 })    // Объединяем оба списка
    let events = [...eventsFromCalendars, ...eventsAsAttendee]

    // Удаляем дубликаты по _id
    const uniqueEvents = Array.from(
      new Map(events.map(e => [e._id.toString(), e])).values()
    )

    if (status) {
      events = uniqueEvents.filter((event) => event.status === status)
    } else {
      events = uniqueEvents
    }

    // Добавляем роли к каждому attendee из Access записей
    const eventsWithRoles = await Promise.all(
      events.map(async (event) => {
        const eventObj = event.toObject()

        if (eventObj.attendees && eventObj.attendees.length > 0) {
          const attendeesWithRoles = await Promise.all(
            eventObj.attendees.map(async (attendee) => {
              // Если attendee без user (только email), то viewer (по умолчанию)
              if (!attendee.user) {
                return { ...attendee, role: 'viewer' }
              }

              // Получаем ID пользователя
              const attendeeUserId = typeof attendee.user === 'object' && attendee.user._id
                ? attendee.user._id.toString()
                : attendee.user.toString()

              // Организатор всегда имеет роль owner
              if (attendeeUserId === eventObj.organizer.toString()) {
                return { ...attendee, role: 'owner' }
              }

              // Получаем Access записи для этого пользователя и события
              const accesses = await Access.find({
                user: attendeeUserId,
                controls: 'event',
                entity_id: eventObj._id
              })

              // Если нет Access записей, но есть pending_role - используем его (приглашение не принято)
              if (accesses.length === 0 && attendee.pending_role) {
                return { ...attendee, role: attendee.pending_role }
              }

              // Определяем роль на основе прав доступа
              const permissions = accesses.map(a => a.type)
              let role = 'viewer' // default

              if (permissions.includes('share') && permissions.includes('delete')) {
                role = 'owner'
              } else if (permissions.includes('share') && permissions.includes('update')) {
                role = 'admin'
              } else if (permissions.includes('read') && !permissions.includes('update')) {
                role = 'viewer'
              }

              return { ...attendee, role }
            })
          )

          eventObj.attendees = attendeesWithRoles
        }

        return eventObj
      })
    )

    return eventsWithRoles
  }

  /**
   * Получить событие по ID
   * @param {string} eventId - ID события
   * @param {string} userId - ID пользователя
   * @param {boolean} allowPublicAccess - Разрешить публичный просмотр по ссылке
   */
  async getEventById(eventId, userId, allowPublicAccess = true) {
    const event = await Event.findById(eventId).populate('creator organizer calendar attendees.user')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // НОВОЕ: Разрешаем публичный доступ по прямой ссылке (read-only)
    // Это позволяет любому пользователю с ссылкой просматривать событие
    if (allowPublicAccess) {
      console.log(`🌍 Public link access for event "${event.title}"`)
      return event
    }

    // Проверяем доступ:
    // 1. Через календарь (если у пользователя есть доступ к календарю)
    // 2. Или если пользователь - attendee события
    // 3. Или если пользователь - создатель/организатор

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // Проверяем, является ли пользователь создателем или организатором
    const isCreatorOrOrganizer =
      event.creator.toString() === userId ||
      event.organizer.toString() === userId

    // Проверяем, является ли пользователь attendee С ПРИНЯТЫМ ПРИГЛАШЕНИЕМ
    const isAttendee = event.attendees.some(attendee => {
      if (attendee.user) {
        const attendeeUserId = attendee.user._id || attendee.user
        const isUserMatch = attendeeUserId.toString() === userId
        // Доступ только если приглашение принято (accepted)
        return isUserMatch && attendee.status === 'accepted'
      }
      return false
    })

    // Проверяем доступ через календарь
    let hasCalendarAccess = false
    if (event.calendar && typeof event.calendar !== 'string') {
      hasCalendarAccess = event.calendar.hasAccess(userId)
    }

    if (!isCreatorOrOrganizer && !isAttendee && !hasCalendarAccess) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Добавляем роли к каждому attendee из Access записей
    const eventObj = event.toObject()
    if (eventObj.attendees && eventObj.attendees.length > 0) {
      const attendeesWithRoles = await Promise.all(
        eventObj.attendees.map(async (attendee) => {
          // Если attendee без user (только email), то viewer (по умолчанию)
          if (!attendee.user) {
            return { ...attendee, role: 'viewer' }
          }

          // Получаем ID пользователя
          const attendeeUserId = typeof attendee.user === 'object' && attendee.user._id
            ? attendee.user._id.toString()
            : attendee.user.toString()

          // Организатор всегда имеет роль owner
          if (attendeeUserId === event.organizer.toString()) {
            return { ...attendee, role: 'owner' }
          }

          // Получаем Access записи для этого пользователя и события
          const accesses = await Access.find({
            user: attendeeUserId,
            controls: 'event',
            entity_id: eventId
          })

          // Если нет Access записей, но есть pending_role - используем его (приглашение не принято)
          if (accesses.length === 0 && attendee.pending_role) {
            return { ...attendee, role: attendee.pending_role }
          }

          // Определяем роль на основе прав доступа
          const permissions = accesses.map(a => a.type)
          let role = 'viewer' // default

          if (permissions.includes('share') && permissions.includes('delete')) {
            role = 'owner'
          } else if (permissions.includes('share') && permissions.includes('update')) {
            role = 'admin'
          } else if (permissions.includes('read') && !permissions.includes('update')) {
            role = 'viewer'
          }

          return { ...attendee, role }
        })
      )

      eventObj.attendees = attendeesWithRoles
    }

    return eventObj
  }  /**
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
    // 1. Проверяем через Access записи для события
    const eventAccess = await Access.findOne({
      user: userId,
      controls: 'event',
      entity_id: eventId,
      type: 'update'
    })

    // 2. Проверяем через календарь (если нет прямых прав на событие)
    let hasCalendarWriteAccess = false
    if (event.calendar) {
      const calendarId = event.calendar._id || event.calendar

      // Проверяем через новую систему Access records для календаря
      // Если у пользователя есть 'update' право на календарь - он может редактировать события
      const calendarAccess = await Access.findOne({
        user: userId,
        controls: 'calendar',
        entity_id: calendarId,
        type: 'update'
      })

      if (calendarAccess) {
        hasCalendarWriteAccess = true
      } else if (typeof event.calendar !== 'string') {
        // Fallback на старую систему shared_with
        hasCalendarWriteAccess = event.calendar.hasAccess(userId, 'write')
      }
    }

    // 3. Проверяем, является ли пользователь организатором
    const isOrganizer = event.organizer.toString() === userId

    if (!eventAccess && !hasCalendarWriteAccess && !isOrganizer) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
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

    // Перемещение события в другой календарь
    const currentCalendarId = event.calendar?._id ? event.calendar._id.toString() : event.calendar.toString();

    if (data.calendar_id !== undefined && data.calendar_id !== currentCalendarId) {
      // Проверяем доступ к новому календарю
      const newCalendar = await Calendar.findById(data.calendar_id);
      if (!newCalendar) {
        const error = new Error('Target calendar not found');
        error.status = 404;
        throw error;
      }

      if (!newCalendar.hasAccess(userId, 'write')) {
        const error = new Error('No write access to target calendar');
        error.status = 403;
        throw error;
      }

      // Удаляем событие из старого календаря
      const oldCalendar = await Calendar.findById(currentCalendarId);
      if (oldCalendar) {
        oldCalendar.removeEvent(eventId);
        await oldCalendar.save();
      }

      // Добавляем событие в новый календарь
      newCalendar.addEvent(eventId);
      await newCalendar.save();

      // Обновляем ссылку на календарь в событии
      event.calendar = data.calendar_id;
    }

    await event.save()
    return event
  }  /**
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

    // Проверяем права на удаление
    // 1. Проверяем через Access записи для события
    const eventAccess = await Access.findOne({
      user: userId,
      controls: 'event',
      entity_id: eventId,
      type: 'delete'
    })

    // 2. Проверяем через календарь (если нет прямых прав на событие)
    let hasCalendarDeleteAccess = false
    if (event.calendar) {
      const calendarId = event.calendar._id || event.calendar

      // Проверяем через новую систему Access records для календаря
      // Если у пользователя есть 'delete' право на календарь - он может удалять события
      const calendarAccess = await Access.findOne({
        user: userId,
        controls: 'calendar',
        entity_id: calendarId,
        type: 'delete'
      })

      if (calendarAccess) {
        hasCalendarDeleteAccess = true
      } else if (typeof event.calendar !== 'string') {
        // Fallback на старую систему shared_with
        hasCalendarDeleteAccess = event.calendar.hasAccess(userId, 'write')
      }
    }

    // 3. Проверяем, является ли пользователь организатором
    const isOrganizer = event.organizer.toString() === userId

    if (!eventAccess && !hasCalendarDeleteAccess && !isOrganizer) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Удаляем событие из календаря
    if (event.calendar && typeof event.calendar !== 'string') {
      event.calendar.removeEvent(event._id)
      await event.calendar.save()
    }

    // Удаляем все Access записи для этого события
    await Access.deleteMany({
      controls: 'event',
      entity_id: eventId
    })

    await event.deleteOne()
    return { message: 'Event deleted successfully' }
  }

  /**
   * Добавить участника к событию (через Access модель)
   */
  async addAttendee(eventId, userId, attendeeData) {
    const event = await Event.findById(eventId).populate('calendar').populate('attendees.user')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // НОВОЕ: Разрешаем добавлять себя по публичной ссылке
    // Если не указан email и user_id, добавляем текущего пользователя
    const { user_id, email, role } = attendeeData

    let targetUserId = user_id
    let targetEmail = email

    // Если ничего не передано - добавляем текущего пользователя (self-subscribe)
    if (!user_id && !email) {
      targetUserId = userId
      const currentUser = await User.findById(userId)
      if (currentUser) {
        targetEmail = currentUser.email
      }
    } else {
      // Проверяем права доступа только если добавляем другого пользователя
      // Проверяем через Access записи для события (право 'share')
      const hasShareAccess = await Access.findOne({
        user: userId,
        controls: 'event',
        entity_id: eventId,
        type: 'share'
      })

      // Или через календарь (если нет прямых прав на событие)
      let hasCalendarShareAccess = false
      if (event.calendar) {
        const calendarId = event.calendar._id || event.calendar

        // Проверяем через новую систему Access records для календаря
        // Если у пользователя есть 'share' право на календарь - он может приглашать в события
        const calendarAccess = await Access.findOne({
          user: userId,
          controls: 'calendar',
          entity_id: calendarId,
          type: 'share'
        })

        if (calendarAccess) {
          hasCalendarShareAccess = true
        } else {
          // Fallback на старую систему
          hasCalendarShareAccess = event.hasAccess(userId)
        }
      }

      // Или если пользователь - организатор
      const isOrganizer = event.organizer.toString() === userId

      if (!hasShareAccess && !hasCalendarShareAccess && !isOrganizer) {
        console.log(`❌ Access denied: userId=${userId}, hasShareAccess=${!!hasShareAccess}, hasCalendarShareAccess=${hasCalendarShareAccess}, isOrganizer=${isOrganizer}`)
        const error = new Error('Access denied')
        error.status = 403
        throw error
      }
    }

    // NOTE: role используется для определения прав доступа через Access модель

    // Если передан email, пытаемся найти пользователя
    if (email && !user_id) {
      const targetUser = await User.findByEmail(email)
      if (targetUser) {
        targetUserId = targetUser._id
        targetEmail = targetUser.email
      }
    }

    // Если есть userId, получаем email
    if (user_id && !email && user_id !== userId) {
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
    // owner -> read, update, delete, share (создатель события)
    // admin -> read, update, share (может редактировать и приглашать)
    // viewer -> read (только просмотр)
    const accessRights = {
      owner: ['read', 'update', 'delete', 'share'],
      admin: ['read', 'update', 'share'],
      viewer: ['read']
    }

    const typesToGrant = accessRights[role] || accessRights.viewer

    // НЕ создаем Access записи сразу!
    // Они будут созданы когда пользователь подтвердит участие (примет приглашение)

    // Добавляем участника в событие (или обновляем если уже есть)
    let isNewAttendee = false

    if (targetUserId) {
      // Проверяем, есть ли уже этот участник
      const existingAttendeeIndex = event.attendees.findIndex(a => {
        if (a.user) {
          const attendeeUserId = typeof a.user === 'object' && a.user._id
            ? a.user._id.toString()
            : a.user.toString()
          return attendeeUserId === targetUserId.toString()
        }
        return false
      })

      if (existingAttendeeIndex < 0) {
        // Новый участник, добавляем
        event.addAttendee(new mongoose.Types.ObjectId(targetUserId), true, role)
        isNewAttendee = true
      }
    } else if (targetEmail) {
      // Проверяем есть ли участник с таким email
      const existingEmailAttendee = event.attendees.find(a => a.email === targetEmail)
      if (!existingEmailAttendee) {
        event.addAttendee(targetEmail, false, role)
        isNewAttendee = true
      }
    }

    await event.save()

    // Отправляем email приглашение ТОЛЬКО для новых участников
    if (isNewAttendee) {
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
              role || 'viewer',
              event._id.toString()
            ),
          })
          console.log(`✅ Event invitation email sent to ${targetEmail}`)
        }
      } catch (emailError) {
        console.error('❌ Email error:', emailError.message)
      }
    } else {
      console.log(`📝 Attendee already exists, no email sent`)
    }

    // Добавляем роли к attendees перед возвратом (аналогично getEventById)
    const eventObj = event.toObject()
    if (eventObj.attendees && eventObj.attendees.length > 0) {
      const attendeesWithRoles = await Promise.all(
        eventObj.attendees.map(async (attendee) => {
          // Если attendee без user (только email), то viewer (по умолчанию)
          if (!attendee.user) {
            return { ...attendee, role: 'viewer' }
          }

          // Получаем ID пользователя
          const attendeeUserId = typeof attendee.user === 'object' && attendee.user._id
            ? attendee.user._id.toString()
            : attendee.user.toString()

          // Организатор всегда имеет роль owner
          if (attendeeUserId === event.organizer.toString()) {
            return { ...attendee, role: 'owner' }
          }

          // Получаем Access записи для этого пользователя и события
          const accesses = await Access.find({
            user: attendeeUserId,
            controls: 'event',
            entity_id: event._id
          })

          // Если нет Access записей, но есть pending_role - используем его (приглашение не принято)
          if (accesses.length === 0 && attendee.pending_role) {
            return { ...attendee, role: attendee.pending_role }
          }

          // Определяем роль на основе прав доступа
          const permissions = accesses.map(a => a.type)
          let role = 'viewer' // default

          if (permissions.includes('share') && permissions.includes('delete')) {
            role = 'owner'
          } else if (permissions.includes('share') && permissions.includes('update')) {
            role = 'admin'
          } else if (permissions.includes('read') && !permissions.includes('update')) {
            role = 'viewer'
          }

          return { ...attendee, role }
        })
      )

      eventObj.attendees = attendeesWithRoles
    }

    return eventObj
  }

  /**
   * Обновить статус участника
   */
  async updateAttendeeStatus(eventId, userId, status) {
    const event = await Event.findById(eventId).populate('attendees.user')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // Находим участника
    const attendee = event.attendees.find(a => {
      if (a.user) {
        const attendeeUserId = typeof a.user === 'object' && a.user._id
          ? a.user._id.toString()
          : a.user.toString()
        return attendeeUserId === userId
      }
      return false
    })

    if (!attendee) {
      const error = new Error('You are not an attendee of this event')
      error.status = 404
      throw error
    }

    // Обновляем статус
    event.updateAttendeeStatus(userId, status, true)

    // Если статус = accepted и есть pending_role, создаем Access записи
    if (status === 'accepted' && attendee.pending_role) {
      const accessRights = {
        owner: ['read', 'update', 'delete', 'share'],
        admin: ['read', 'update', 'share'],
        viewer: ['read']
      }

      const typesToGrant = accessRights[attendee.pending_role] || accessRights.viewer

      // Удаляем старые Access записи (если были)
      await Access.deleteMany({
        user: userId,
        controls: 'event',
        entity_id: event._id
      })

      // Создаем новые Access записи
      for (const type of typesToGrant) {
        const accessName = `event.${type}.${new mongoose.Types.ObjectId().toString()}`
        await Access.grantAccess(
          userId,
          'event',
          type,
          event._id,
          accessName
        )
      }

      // Очищаем pending_role после создания Access
      attendee.pending_role = undefined
    }

    await event.save()

    return event
  }

  /**
   * Обновить роль участника события
   */
  async updateAttendeeRole(eventId, userId, attendeeId, newRole) {
    const event = await Event.findById(eventId).populate('calendar').populate('attendees.user')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    console.log('🔄 updateAttendeeRole called:', {
      eventId,
      userId,
      attendeeId,
      newRole,
      attendeesCount: event.attendees.length,
      attendeeIds: event.attendees.map(a => ({ _id: a._id.toString(), user: a.user?._id || a.user, email: a.email }))
    })

    // Проверяем права доступа - организатор или owner могут изменять роли
    const isOrganizer = event.organizer.toString() === userId

    // Проверяем есть ли у пользователя роль owner (права delete + share)
    const hasOwnerRole = await Access.findOne({
      user: userId,
      controls: 'event',
      entity_id: eventId,
      type: 'delete' // Owner имеет delete, admin - нет
    })

    // Проверяем доступ через календарь (admin или owner календаря могут менять роли)
    let hasCalendarOwnerAccess = false
    if (event.calendar) {
      const calendarId = event.calendar._id || event.calendar

      // Проверяем через новую систему Access records для календаря
      const calendarAccess = await Access.findOne({
        user: userId,
        controls: 'calendar',
        entity_id: calendarId,
        type: 'delete' // delete = admin/owner календаря
      })

      if (calendarAccess) {
        hasCalendarOwnerAccess = true
      }
    }

    if (!isOrganizer && !hasOwnerRole && !hasCalendarOwnerAccess) {
      const error = new Error('Only organizer or owner can change attendee roles')
      error.status = 403
      throw error
    }

    // Находим участника по attendeeId (это _id из subdocument, не ObjectId пользователя)
    const attendee = event.attendees.find(a => a._id.toString() === attendeeId)

    if (!attendee || !attendee.user) {
      console.log('❌ Attendee not found. Looking for:', attendeeId)
      console.log('Available attendees:', event.attendees.map(a => ({ _id: a._id.toString(), userId: a.user?._id || a.user })))
      const error = new Error('Attendee not found')
      error.status = 404
      throw error
    }

    // Получаем реальный userId
    const targetUserId = typeof attendee.user === 'object' && attendee.user._id
      ? attendee.user._id.toString()
      : attendee.user.toString()

    // Нельзя изменять роль организатора
    if (targetUserId === event.organizer.toString()) {
      const error = new Error('Cannot change organizer role')
      error.status = 400
      throw error
    }

    // Owner не может менять роль другого owner
    if (!isOrganizer) {
      const targetHasOwnerRole = await Access.findOne({
        user: targetUserId,
        controls: 'event',
        entity_id: eventId,
        type: 'delete'
      })

      if (targetHasOwnerRole) {
        const error = new Error('Owner cannot change another owner\'s role')
        error.status = 403
        throw error
      }
    }

    // Удаляем старые Access записи для этого пользователя
    const allAccessTypes = ['read', 'update', 'delete', 'share']
    for (const type of allAccessTypes) {
      await Access.revokeAccess(
        targetUserId,
        'event',
        type,
        event._id
      )
    }

    // Создаем новые Access записи на основе роли
    const accessRights = {
      owner: ['read', 'update', 'delete', 'share'],
      admin: ['read', 'update', 'share'],
      viewer: ['read']
    }

    const typesToGrant = accessRights[newRole] || accessRights.viewer

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

    // Перезагружаем событие с attendees
    const updatedEvent = await Event.findById(eventId).populate('attendees.user')

    // Добавляем роли к attendees перед возвратом
    const eventObj = updatedEvent.toObject()
    if (eventObj.attendees && eventObj.attendees.length > 0) {
      const attendeesWithRoles = await Promise.all(
        eventObj.attendees.map(async (attendee) => {
          // Если attendee без user (только email), то viewer (по умолчанию)
          if (!attendee.user) {
            return { ...attendee, role: 'viewer' }
          }

          // Получаем ID пользователя
          const attendeeUserId = typeof attendee.user === 'object' && attendee.user._id
            ? attendee.user._id.toString()
            : attendee.user.toString()

          // Организатор всегда имеет роль owner
          if (attendeeUserId === updatedEvent.organizer.toString()) {
            return { ...attendee, role: 'owner' }
          }

          // Получаем Access записи для этого пользователя и события
          const accesses = await Access.find({
            user: attendeeUserId,
            controls: 'event',
            entity_id: eventId
          })

          // Определяем роль на основе прав доступа
          const permissions = accesses.map(a => a.type)
          let role = 'viewer' // default

          if (permissions.includes('share') && permissions.includes('delete')) {
            role = 'owner'
          } else if (permissions.includes('share') && permissions.includes('update')) {
            role = 'admin'
          } else if (permissions.includes('read') && !permissions.includes('update')) {
            role = 'viewer'
          }

          return { ...attendee, role }
        })
      )

      eventObj.attendees = attendeesWithRoles
    }

    return eventObj
  }

  /**
   * Удалить участника (и его Access записи)
   */
  async removeAttendee(eventId, userId, attendeeId) {
    console.log(`🗑️ removeAttendee: eventId=${eventId}, userId=${userId}, attendeeId=${attendeeId}`)
    const event = await Event.findById(eventId).populate('calendar').populate('attendees.user')

    if (!event) {
      const error = new Error('Event not found')
      error.status = 404
      throw error
    }

    // Проверяем права: организатор, owner (delete право) или доступ через календарь
    const isOrganizer = event.organizer.toString() === userId

    // Проверяем есть ли у пользователя роль owner (права delete)
    const hasOwnerRole = await Access.findOne({
      user: userId,
      controls: 'event',
      entity_id: eventId,
      type: 'delete' // Owner имеет delete, admin - нет
    })

    // Проверяем доступ через календарь
    let hasCalendarDeleteAccess = false
    if (event.calendar) {
      const calendarId = event.calendar._id || event.calendar

      // Проверяем через новую систему Access records для календаря
      const calendarAccess = await Access.findOne({
        user: userId,
        controls: 'calendar',
        entity_id: calendarId,
        type: 'delete'
      })

      if (calendarAccess) {
        hasCalendarDeleteAccess = true
      } else {
        // Fallback на старую систему
        hasCalendarDeleteAccess = event.hasAccess(userId)
      }
    }

    if (!isOrganizer && !hasCalendarDeleteAccess && !hasOwnerRole) {
      console.log(`❌ Access denied: userId=${userId}, organizer=${event.organizer}, hasCalendarDeleteAccess=${hasCalendarDeleteAccess}, hasOwnerRole=${!!hasOwnerRole}`)
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Находим участника в массиве
    const attendee = event.attendees.find(a => a._id && a._id.toString() === attendeeId)

    if (!attendee) {
      console.log(`❌ Attendee not found: attendeeId=${attendeeId}`)
      console.log(`Available attendees:`, event.attendees.map(a => ({ _id: a._id, user: a.user })))
      const error = new Error('Attendee not found')
      error.status = 404
      throw error
    }

    console.log(`✅ Found attendee to remove:`, { _id: attendee._id, user: attendee.user, email: attendee.email })

    // Если у участника есть user, удаляем Access записи
    if (attendee.user) {
      const targetUserId = typeof attendee.user === 'object' && attendee.user._id
        ? attendee.user._id.toString()
        : attendee.user.toString()

      // Нельзя удалить организатора
      if (targetUserId === event.organizer.toString()) {
        const error = new Error('Cannot remove organizer')
        error.status = 400
        throw error
      }

      // Owner не может удалить другого owner
      if (!isOrganizer) {
        const targetHasOwnerRole = await Access.findOne({
          user: targetUserId,
          controls: 'event',
          entity_id: eventId,
          type: 'delete'
        })

        if (targetHasOwnerRole) {
          const error = new Error('Owner cannot remove another owner')
          error.status = 403
          throw error
        }
      }

      console.log(`🔐 Revoking access for user: ${targetUserId}`)
      const accessTypes = ['read', 'update', 'delete', 'share']
      for (const type of accessTypes) {
        await Access.revokeAccess(
          targetUserId,
          'event',
          type,
          event._id
        )
      }

      // Удаляем участника по userId (не attendeeId!)
      event.removeAttendee(targetUserId, true)
    } else if (attendee.email) {
      // Если участник только по email (без user)
      event.removeAttendee(attendee.email, false)
    }

    await event.save()
    console.log(`✅ Attendee removed successfully`)

    return event
  }
}

export const eventsService = new EventsService()
