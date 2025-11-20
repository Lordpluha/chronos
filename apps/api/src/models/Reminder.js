import mongoose from 'mongoose'

/**
 * @type {mongoose.Schema<import('./Reminder').IReminder, import('./Reminder').IReminderModel, import('./Reminder').IReminderMethods>}
 */
const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    calendar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calendar',
      required: true,
      index: true,
    },
    start: {
      type: Date,
      required: true,
      index: true,
    },
    time_zone: {
      type: String,
      required: true,
      default: 'UTC',
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated',
    },
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    indexes: [
      [{ title: 'text', description: 'text' }],
      [{ calendar: 1, start: 1 }],
      [{ creator: 1, start: 1 }],
      [{ organizer: 1, start: 1 }],
    ],
    statics: {
      /**
       * @param {import('mongoose').Types.ObjectId | string} calendarId
       * @param {{ startDate?: Date; endDate?: Date }} [options]
       * @this {import('./Reminder').IReminderModel}
       */
      findByCalendar(calendarId, options = {}) {
        const query = this.find({ calendar: calendarId })

        if (options.startDate || options.endDate) {
          const dateFilter = {}
          if (options.startDate) dateFilter.$gte = options.startDate
          if (options.endDate) dateFilter.$lte = options.endDate
          query.where('start', dateFilter)
        }

        return query.populate('creator organizer calendar')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} creatorId
       * @this {import('./Reminder').IReminderModel}
       */
      findByCreator(creatorId) {
        return this.find({ creator: creatorId }).populate(
          'creator organizer calendar',
        )
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} organizerId
       * @this {import('./Reminder').IReminderModel}
       */
      findByOrganizer(organizerId) {
        return this.find({ organizer: organizerId }).populate(
          'creator organizer calendar',
        )
      },
      /**
       * @param {{ calendarId?: import('mongoose').Types.ObjectId | string; userId?: import('mongoose').Types.ObjectId | string }} [options]
       * @this {import('./Reminder').IReminderModel}
       */
      findOverdue(options = {}) {
        const query = this.find({ start: { $lt: new Date() } })

        if (options.calendarId) {
          query.where('calendar', options.calendarId)
        }

        if (options.userId) {
          query.where({
            $or: [{ creator: options.userId }, { organizer: options.userId }],
          })
        }

        return query.populate('creator organizer calendar')
      },
      /**
       * @param {number} [hours]
       * @param {{ calendarId?: import('mongoose').Types.ObjectId | string; userId?: import('mongoose').Types.ObjectId | string }} [options]
       * @this {import('./Reminder').IReminderModel}
       */
      findUpcoming(hours = 24, options = {}) {
        const now = new Date()
        const future = new Date(now.getTime() + hours * 60 * 60 * 1000)

        const query = this.find({
          start: { $gte: now, $lte: future },
        })

        if (options.calendarId) {
          query.where('calendar', options.calendarId)
        }

        if (options.userId) {
          query.where({
            $or: [{ creator: options.userId }, { organizer: options.userId }],
          })
        }

        return query.populate('creator organizer calendar').sort({ start: 1 })
      },
      /**
       * @param {Date} startDate
       * @param {Date} endDate
       * @param {{ calendarId?: import('mongoose').Types.ObjectId | string }} [options]
       * @this {import('./Reminder').IReminderModel}
       */
      findInDateRange(startDate, endDate, options = {}) {
        const query = this.find({
          start: { $gte: startDate, $lte: endDate },
        })

        if (options.calendarId) {
          query.where('calendar', options.calendarId)
        }

        return query.populate('creator organizer calendar')
      },
    },
    methods: {
      hasAccess(userId) {
        const userIdStr = userId.toString()
        
        // Безопасное получение ID создателя и организатора
        const creatorId = this.creator?._id ? this.creator._id.toString() : this.creator.toString()
        const organizerId = this.organizer?._id ? this.organizer._id.toString() : this.organizer.toString()
        
        return creatorId === userIdStr || organizerId === userIdStr
      },
      shouldTrigger(minutesBefore = 0) {
        const now = new Date()
        const triggerTime = new Date(
          this.start.getTime() - minutesBefore * 60 * 1000,
        )
        return now >= triggerTime && now <= this.start
      },
      getTimeUntil() {
        const now = new Date()
        const timeDiff = this.start.getTime() - now.getTime()
        return timeDiff > 0 ? timeDiff : 0
      },
    },
  },
)

// Virtual for reminder ID (alias for _id)
reminderSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Virtual to check if reminder is overdue
reminderSchema.virtual('isOverdue').get(function () {
  return this.start < new Date()
})

// Virtual to check if reminder is upcoming (within next 24 hours)
reminderSchema.virtual('isUpcoming').get(function () {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return this.start > now && this.start <= tomorrow
})

/** @type {import('./Reminder').IReminderModel} */
export const Reminder = mongoose.model('Reminder', reminderSchema)
