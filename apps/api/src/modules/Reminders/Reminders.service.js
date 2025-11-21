import { Reminder } from '../../models/Reminder.js'
import { Calendar } from '../../models/Calendar.js'

class RemindersService {
  /**
   * Создать новое напоминание
   */
  async createReminder(userId, data) {
    const { title, description, calendar_id, time_zone, start } = data

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

    const reminder = new Reminder({
      title,
      description,
      creator: userId,
      organizer: userId,
      calendar: calendar_id,
      time_zone: time_zone || calendar.time_zone || 'UTC',
      start: new Date(start),
    })

    await reminder.save()

    // Добавляем напоминание в календарь
    calendar.addReminder(reminder._id)
    await calendar.save()

    return reminder
  }

  /**
   * Получить напоминания календаря
   */
  async getCalendarReminders(calendarId, userId, query = {}) {
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

    const { startDate, endDate } = query
    const options = {}

    if (startDate) options.startDate = new Date(startDate)
    if (endDate) options.endDate = new Date(endDate)

    const reminders = await Reminder.findByCalendar(calendarId, options)
    return reminders
  }

  /**
   * Получить напоминания пользователя
   */
  async getUserReminders(userId, query = {}) {
    const { startDate, endDate, upcoming, overdue } = query

    let reminders

    if (upcoming) {
      const hours = Number.parseInt(upcoming) || 24
      reminders = await Reminder.findUpcoming(hours, { userId })
    } else if (overdue) {
      reminders = await Reminder.findOverdue({ userId })
    } else if (startDate && endDate) {
      reminders = await Reminder.findInDateRange(new Date(startDate), new Date(endDate))
      // Фильтруем по пользователю
      reminders = reminders.filter(
        (r) =>
          r.creator.toString() === userId || r.organizer.toString() === userId,
      )
    } else {
      reminders = await Reminder.findByCreator(userId)
    }

    return reminders
  }

  /**
   * Получить напоминание по ID
   */
  async getReminderById(reminderId, userId) {
    const reminder = await Reminder.findById(reminderId).populate('creator organizer calendar')

    if (!reminder) {
      const error = new Error('Reminder not found')
      error.status = 404
      throw error
    }

    // Проверяем доступ
    if (!reminder.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    return reminder
  }

  /**
   * Обновить напоминание
   */
  async updateReminder(reminderId, userId, data) {
    const reminder = await Reminder.findById(reminderId).populate('calendar')

    if (!reminder) {
      const error = new Error('Reminder not found')
      error.status = 404
      throw error
    }

    // Проверяем доступ
    if (!reminder.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Обновляем поля
    if (data.title !== undefined) reminder.title = data.title
    if (data.description !== undefined) reminder.description = data.description
    if (data.time_zone !== undefined) reminder.time_zone = data.time_zone
    if (data.start !== undefined) reminder.start = new Date(data.start)

    await reminder.save()
    return reminder
  }

  /**
   * Удалить напоминание
   */
  async deleteReminder(reminderId, userId) {
    const reminder = await Reminder.findById(reminderId).populate('calendar')

    if (!reminder) {
      const error = new Error('Reminder not found')
      error.status = 404
      throw error
    }

    // Проверяем доступ
    if (!reminder.hasAccess(userId)) {
      const error = new Error('Access denied')
      error.status = 403
      throw error
    }

    // Удаляем напоминание из календаря
    if (reminder.calendar && typeof reminder.calendar !== 'string') {
      reminder.calendar.removeReminder(reminder._id)
      await reminder.calendar.save()
    }

    await reminder.deleteOne()
    return { message: 'Reminder deleted successfully' }
  }
}

export const remindersService = new RemindersService()
