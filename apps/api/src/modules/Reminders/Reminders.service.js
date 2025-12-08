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
      // Фильтруем по пользователю (включая shared)
      reminders = reminders.filter((r) => r.hasAccess(userId))
    } else {
      // Получаем напоминания где пользователь - создатель, организатор или имеет shared доступ
      reminders = await Reminder.find({
        $or: [
          { creator: userId },
          { organizer: userId },
          { 'shared_with.user': userId },
        ],
      }).populate('creator organizer calendar')
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

    // Проверяем доступ на запись
    if (!reminder.hasAccess(userId, 'write')) {
      const error = new Error('Access denied: write permission required')
      error.status = 403
      throw error
    }

    // Обновляем поля
    if (data.title !== undefined) reminder.title = data.title
    if (data.description !== undefined) reminder.description = data.description
    if (data.time_zone !== undefined) reminder.time_zone = data.time_zone
    if (data.start !== undefined) reminder.start = new Date(data.start)
    if (data.completed !== undefined) reminder.completed = data.completed
    if (data.completed_at !== undefined) reminder.completed_at = data.completed_at ? new Date(data.completed_at) : null

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

    // Только создатель или организатор может удалить
    const creatorId = reminder.creator?._id ? reminder.creator._id.toString() : reminder.creator.toString()
    const organizerId = reminder.organizer?._id ? reminder.organizer._id.toString() : reminder.organizer.toString()

    if (creatorId !== userId.toString() && organizerId !== userId.toString()) {
      const error = new Error('Only creator or organizer can delete reminder')
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

  /**
   * Поделиться напоминанием с пользователем
   */
  async shareReminder(reminderId, userId, shareData) {
    const { userEmail, permission } = shareData

    const reminder = await Reminder.findById(reminderId)

    if (!reminder) {
      const error = new Error('Reminder not found')
      error.status = 404
      throw error
    }

    // Только создатель или организатор может делиться
    const creatorId = reminder.creator?._id ? reminder.creator._id.toString() : reminder.creator.toString()
    const organizerId = reminder.organizer?._id ? reminder.organizer._id.toString() : reminder.organizer.toString()

    if (creatorId !== userId.toString() && organizerId !== userId.toString()) {
      const error = new Error('Only creator or organizer can share reminder')
      error.status = 403
      throw error
    }

    // Находим пользователя по email
    const User = (await import('../../models/User.js')).User
    const targetUser = await User.findByEmail(userEmail)
    if (!targetUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    // Нельзя делиться с самим собой
    if (targetUser._id.toString() === userId.toString()) {
      const error = new Error('Cannot share reminder with yourself')
      error.status = 400
      throw error
    }

    reminder.shareWith(targetUser._id, permission)
    await reminder.save()

    return reminder
  }

  /**
   * Удалить доступ к напоминанию
   */
  async removeReminderAccess(reminderId, userId, targetUserEmail) {
    const reminder = await Reminder.findById(reminderId)

    if (!reminder) {
      const error = new Error('Reminder not found')
      error.status = 404
      throw error
    }

    // Только создатель или организатор может удалять доступ
    const creatorId = reminder.creator?._id ? reminder.creator._id.toString() : reminder.creator.toString()
    const organizerId = reminder.organizer?._id ? reminder.organizer._id.toString() : reminder.organizer.toString()

    if (creatorId !== userId.toString() && organizerId !== userId.toString()) {
      const error = new Error('Only creator or organizer can remove access')
      error.status = 403
      throw error
    }

    const User = (await import('../../models/User.js')).User
    const targetUser = await User.findByEmail(targetUserEmail)
    if (!targetUser) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    reminder.removeSharedAccess(targetUser._id)
    await reminder.save()

    return reminder
  }
}

export const remindersService = new RemindersService()
