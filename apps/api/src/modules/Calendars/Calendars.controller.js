import express from 'express'
import { requireAccessToken } from '../../middleware/index.js'
import { validateBody } from '../../utils/index.js'
import { calendarsService } from './Calendars.service.js'
import { eventsService } from '../Events/Events.service.js'
import { remindersService } from '../Reminders/Reminders.service.js'
import {
  createCalendarSchema,
  updateCalendarSchema,
  shareCalendarSchema,
  removeAccessSchema,
  createEventSchema,
  updateEventSchema,
  addAttendeeSchema,
  updateAttendeeStatusSchema,
  createReminderSchema,
  updateReminderSchema,
} from './Calendars.validation.js'

const router = express.Router()

// ============ КАЛЕНДАРИ ============

// GET /calendars - получить все календари пользователя
router.get('/calendars', requireAccessToken, async (req, res) => {
  try {
    const calendars = await calendarsService.getUserCalendars(req.userId)
    return res.json(calendars)
  } catch (err) {
    console.error('❌ Error getting calendars:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// POST /calendars - создать новый календарь
router.post(
  '/calendars',
  requireAccessToken,
  validateBody(createCalendarSchema),
  async (req, res) => {
    try {
      const calendar = await calendarsService.createCalendar(req.userId, req.body)
      return res.status(201).json({
        message: 'Calendar created successfully',
        calendar,
      })
    } catch (err) {
      console.error('❌ Error creating calendar:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// GET /calendars/:calendarId - получить календарь по ID
router.get('/calendars/:calendarId', requireAccessToken, async (req, res) => {
  try {
    const calendar = await calendarsService.getCalendarById(
      req.params.calendarId,
      req.userId,
    )
    return res.json(calendar)
  } catch (err) {
    console.error('❌ Error getting calendar:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// PATCH /calendars/:calendarId - обновить календарь
router.patch(
  '/calendars/:calendarId',
  requireAccessToken,
  validateBody(updateCalendarSchema),
  async (req, res) => {
    try {
      const calendar = await calendarsService.updateCalendar(
        req.params.calendarId,
        req.userId,
        req.body,
      )
      return res.json({
        message: 'Calendar updated successfully',
        calendar,
      })
    } catch (err) {
      console.error('❌ Error updating calendar:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /calendars/:calendarId - удалить календарь
router.delete('/calendars/:calendarId', requireAccessToken, async (req, res) => {
  try {
    const result = await calendarsService.deleteCalendar(
      req.params.calendarId,
      req.userId,
    )
    return res.json(result)
  } catch (err) {
    console.error('❌ Error deleting calendar:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// POST /calendars/:calendarId/share - поделиться календарем
router.post(
  '/calendars/:calendarId/share',
  requireAccessToken,
  validateBody(shareCalendarSchema),
  async (req, res) => {
    try {
      const calendar = await calendarsService.shareCalendar(
        req.params.calendarId,
        req.userId,
        req.body,
      )
      return res.json({
        message: 'Calendar shared successfully',
        calendar,
      })
    } catch (err) {
      console.error('❌ Error sharing calendar:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /calendars/:calendarId/share - удалить доступ к календарю
router.delete(
  '/calendars/:calendarId/share',
  requireAccessToken,
  validateBody(removeAccessSchema),
  async (req, res) => {
    try {
      const calendar = await calendarsService.removeCalendarAccess(
        req.params.calendarId,
        req.userId,
        req.body.userEmail,
      )
      return res.json({
        message: 'Calendar access removed successfully',
        calendar,
      })
    } catch (err) {
      console.error('❌ Error removing calendar access:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// ============ СОБЫТИЯ ============

// GET /calendars/:calendarId/events - получить события календаря
router.get('/calendars/:calendarId/events', requireAccessToken, async (req, res) => {
  try {
    const events = await eventsService.getCalendarEvents(
      req.params.calendarId,
      req.userId,
      req.query,
    )
    return res.json(events)
  } catch (err) {
    console.error('❌ Error getting calendar events:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// GET /events - получить все события пользователя
router.get('/events', requireAccessToken, async (req, res) => {
  try {
    const events = await eventsService.getUserEvents(req.userId, req.query)
    return res.json(events)
  } catch (err) {
    console.error('❌ Error getting user events:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// POST /events - создать новое событие
router.post(
  '/events',
  requireAccessToken,
  validateBody(createEventSchema),
  async (req, res) => {
    try {
      const event = await eventsService.createEvent(req.userId, req.body)
      return res.status(201).json({
        message: 'Event created successfully',
        event,
      })
    } catch (err) {
      console.error('❌ Error creating event:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// GET /events/:eventId - получить событие по ID
router.get('/events/:eventId', requireAccessToken, async (req, res) => {
  try {
    const event = await eventsService.getEventById(req.params.eventId, req.userId)
    return res.json(event)
  } catch (err) {
    console.error('❌ Error getting event:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// PATCH /events/:eventId - обновить событие
router.patch(
  '/events/:eventId',
  requireAccessToken,
  validateBody(updateEventSchema),
  async (req, res) => {
    try {
      const event = await eventsService.updateEvent(
        req.params.eventId,
        req.userId,
        req.body,
      )
      return res.json({
        message: 'Event updated successfully',
        event,
      })
    } catch (err) {
      console.error('❌ Error updating event:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /events/:eventId - удалить событие
router.delete('/events/:eventId', requireAccessToken, async (req, res) => {
  try {
    const result = await eventsService.deleteEvent(req.params.eventId, req.userId)
    return res.json(result)
  } catch (err) {
    console.error('❌ Error deleting event:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// POST /events/:eventId/attendees - добавить участника
router.post(
  '/events/:eventId/attendees',
  requireAccessToken,
  validateBody(addAttendeeSchema),
  async (req, res) => {
    try {
      const event = await eventsService.addAttendee(
        req.params.eventId,
        req.userId,
        req.body,
      )
      return res.json({
        message: 'Attendee added successfully',
        event,
      })
    } catch (err) {
      console.error('❌ Error adding attendee:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// PATCH /events/:eventId/attendees/me - обновить свой статус участия
router.patch(
  '/events/:eventId/attendees/me',
  requireAccessToken,
  validateBody(updateAttendeeStatusSchema),
  async (req, res) => {
    try {
      const event = await eventsService.updateAttendeeStatus(
        req.params.eventId,
        req.userId,
        req.body.status,
      )
      return res.json({
        message: 'Attendee status updated successfully',
        event,
      })
    } catch (err) {
      console.error('❌ Error updating attendee status:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /events/:eventId/attendees/:attendeeId - удалить участника
router.delete('/events/:eventId/attendees/:attendeeId', requireAccessToken, async (req, res) => {
  try {
    const event = await eventsService.removeAttendee(
      req.params.eventId,
      req.userId,
      req.params.attendeeId,
    )
    return res.json({
      message: 'Attendee removed successfully',
      event,
    })
  } catch (err) {
    console.error('❌ Error removing attendee:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// ============ НАПОМИНАНИЯ ============

// GET /calendars/:calendarId/reminders - получить напоминания календаря
router.get('/calendars/:calendarId/reminders', requireAccessToken, async (req, res) => {
  try {
    const reminders = await remindersService.getCalendarReminders(
      req.params.calendarId,
      req.userId,
      req.query,
    )
    return res.json(reminders)
  } catch (err) {
    console.error('❌ Error getting calendar reminders:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// GET /reminders - получить все напоминания пользователя
router.get('/reminders', requireAccessToken, async (req, res) => {
  try {
    const reminders = await remindersService.getUserReminders(req.userId, req.query)
    return res.json(reminders)
  } catch (err) {
    console.error('❌ Error getting user reminders:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// POST /reminders - создать новое напоминание
router.post(
  '/reminders',
  requireAccessToken,
  validateBody(createReminderSchema),
  async (req, res) => {
    try {
      const reminder = await remindersService.createReminder(req.userId, req.body)
      return res.status(201).json({
        message: 'Reminder created successfully',
        reminder,
      })
    } catch (err) {
      console.error('❌ Error creating reminder:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// GET /reminders/:reminderId - получить напоминание по ID
router.get('/reminders/:reminderId', requireAccessToken, async (req, res) => {
  try {
    const reminder = await remindersService.getReminderById(
      req.params.reminderId,
      req.userId,
    )
    return res.json(reminder)
  } catch (err) {
    console.error('❌ Error getting reminder:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// PATCH /reminders/:reminderId - обновить напоминание
router.patch(
  '/reminders/:reminderId',
  requireAccessToken,
  validateBody(updateReminderSchema),
  async (req, res) => {
    try {
      const reminder = await remindersService.updateReminder(
        req.params.reminderId,
        req.userId,
        req.body,
      )
      return res.json({
        message: 'Reminder updated successfully',
        reminder,
      })
    } catch (err) {
      console.error('❌ Error updating reminder:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /reminders/:reminderId - удалить напоминание
router.delete('/reminders/:reminderId', requireAccessToken, async (req, res) => {
  try {
    const result = await remindersService.deleteReminder(
      req.params.reminderId,
      req.userId,
    )
    return res.json(result)
  } catch (err) {
    console.error('❌ Error deleting reminder:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

export { router as CalendarsRouter }
