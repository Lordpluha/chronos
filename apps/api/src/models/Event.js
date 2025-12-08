import mongoose from 'mongoose'

/**
 * @type {mongoose.Schema<import('./Event').IEvent, import('./Event').IEventModel, import('./Event').IEventMethods>}
 */
const eventSchema = new mongoose.Schema(
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
      maxlength: 2000,
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
    time_zone: {
      type: String,
      required: true,
      default: 'UTC',
      trim: true,
    },
    start: {
      type: Date,
      required: true,
      index: true,
    },
    end: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.start
        },
        message: 'End date must be after start date',
      },
    },
    location: {
      type: {
        name: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        address: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        coordinates: {
          longitude: {
            type: Number,
            min: -180,
            max: 180,
          },
          latitude: {
            type: Number,
            min: -90,
            max: 90,
          },
        },
        url: {
          type: String,
          trim: true,
          maxlength: 1000,
          validate: {
            validator: (value) => !value || /^https?:\/\/.+/.test(value),
            message: 'Invalid URL format',
          },
        },
      },
      default: null,
    },
    is_all_day: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'tentative', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          index: true,
        },
        email: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ['invited', 'accepted', 'declined', 'maybe'],
          default: 'invited',
        },
        invited_at: {
          type: Date,
          default: Date.now,
        },
        responded_at: {
          type: Date,
        },
        pending_role: {
          type: String,
          enum: ['owner', 'admin', 'viewer'],
        },
      },
    ],
    label: {
      type: String,
      enum: ['indigo', 'gray', 'green', 'blue', 'red', 'purple'],
      default: 'indigo',
      trim: true,
    },
    recurrence: {
      type: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
          required: true,
        },
        interval: {
          type: Number,
          min: 1,
          default: 1,
        },
        byWeekday: [
          {
            type: String,
            enum: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
          },
        ],
        byMonthDay: [
          {
            type: Number,
            min: 1,
            max: 31,
          },
        ],
        byMonth: [
          {
            type: Number,
            min: 1,
            max: 12,
          },
        ],
        count: {
          type: Number,
          min: 1,
        },
        until: {
          type: Date,
        },
      },
      default: null,
    },
    recurrence_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    is_recurring: {
      type: Boolean,
      default: false,
      index: true,
    },
    original_start: {
      type: Date,
      default: null,
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
      [{ start: 1, end: 1 }],
      [{ title: 'text', description: 'text' }],
      [{ calendar: 1, start: 1 }],
      [{ calendar: 1, status: 1 }],
      [{ organizer: 1, start: 1 }],
      [{ is_all_day: 1, start: 1 }],
    ],
    statics: {
      /**
       * @param {import('mongoose').Types.ObjectId | string} calendarId
       * @param {{ startDate?: Date, endDate?: Date }} [options]
       * @this {import('./Event').IEventModel}
       */
      findByCalendar(calendarId, options = {}) {
        const query = this.find({ calendar: calendarId })

        if (options.startDate || options.endDate) {
          const dateFilter = {}
          if (options.startDate) dateFilter.$gte = options.startDate
          if (options.endDate) dateFilter.$lte = options.endDate
          query.where('start', dateFilter)
        }

        return query
          .populate('creator organizer calendar')
          .populate('attendees.user')
      },

      /**
       * @param {import('mongoose').Types.ObjectId | string} creatorId
       * @this {import('./Event').IEventModel}
       */
      findByCreator(creatorId) {
        return this.find({ creator: creatorId })
          .populate('creator organizer calendar')
          .populate('attendees.user')
      },

      /**
       * @param {import('mongoose').Types.ObjectId | string} organizerId
       * @this {import('./Event').IEventModel}
       */
      findByOrganizer(organizerId) {
        return this.find({ organizer: organizerId })
          .populate('creator organizer calendar')
          .populate('attendees.user')
      },

      /**
       * @param {Date} startDate
       * @param {Date} endDate
       * @param {{ calendarId?: import('mongoose').Types.ObjectId | string }} [options]
       * @this {import('./Event').IEventModel}
       */
      findInDateRange(startDate, endDate, options = {}) {
        const query = this.find({
          $or: [
            { start: { $gte: startDate, $lte: endDate } },
            { end: { $gte: startDate, $lte: endDate } },
            { start: { $lte: startDate }, end: { $gte: endDate } },
          ],
        })

        if (options.calendarId) {
          query.where('calendar', options.calendarId)
        }

        return query.populate('creator organizer calendar')
      },

      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {import('./Event').IEventModel}
       */
      findByAttendee(userId) {
        return this.find({
          $or: [
            { creator: userId },
            { organizer: userId },
            { 'attendees.user': userId },
          ],
        }).populate('creator organizer calendar attendees.user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} recurrenceId
       * @this {import('./Event').IEventModel}
       */
      findRecurrenceInstances(recurrenceId) {
        return this.find({ recurrence_id: recurrenceId }).sort({ start: 1 })
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} calendarId
       * @param {Date} startDate
       * @param {Date} endDate
       * @this {import('./Event').IEventModel}
       */
      async findWithRecurrence(calendarId, startDate, endDate) {
        const events = await this.find({
          calendar: calendarId,
          recurrence_id: null,
          $or: [
            { is_recurring: false, start: { $gte: startDate, $lte: endDate } },
            { is_recurring: true, start: { $lte: endDate } },
          ],
        }).populate('creator organizer calendar')

        return events
      },
    },
    methods: {
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       */
      hasAccess(userId) {
        const userIdStr = userId.toString()

        const creatorId = this.creator?._id ? this.creator._id.toString() : this.creator.toString()
        const organizerId = this.organizer?._id ? this.organizer._id.toString() : this.organizer.toString()

        return creatorId === userIdStr || organizerId === userIdStr
      },

      isActive() {
        const now = new Date()
        return this.start <= now && this.end >= now
      },

      isUpcoming() {
        return this.start > new Date()
      },

      isPast() {
        return this.end < new Date()
      },

      /**
       * @param {import('mongoose').Types.ObjectId | string} userIdOrEmail
       * @param {boolean} [isUser=true]
       * @param {string} [role='participant'] - Role не сохраняется в attendees (управляется через Access)
       */
      addAttendee(userIdOrEmail, isUser = true, role = 'participant') {
        const existingIndex = this.attendees.findIndex((attendee) => {
          if (isUser && attendee.user) {
            const attendeeUser = attendee.user
            const attendeeUserId = (attendeeUser && typeof attendeeUser === 'object' && '_id' in attendeeUser)
              ? attendeeUser._id.toString()
              : attendeeUser.toString()
            return attendeeUserId === userIdOrEmail.toString()
          }
          return attendee.email === userIdOrEmail
        })

        if (existingIndex === -1) {
          /** @type {import('./Event').IAttendee} */
          let attendeeData

          if (isUser) {
            attendeeData = { user: userIdOrEmail, status: 'invited', invited_at: new Date(), pending_role: role }
          } else {
            attendeeData = { email: /** @type {string} */ (userIdOrEmail), status: 'invited', invited_at: new Date(), pending_role: role }
          }

          this.attendees.push(attendeeData)
        }
      },

      /**
       * @param {import('mongoose').Types.ObjectId | string} userIdOrEmail
       * @param {'invited' | 'accepted' | 'declined' | 'maybe'} status
       * @param {boolean} [isUser=true]
       * @returns {void}
       */
      updateAttendeeStatus(userIdOrEmail, status, isUser = true) {
        const attendeeIndex = this.attendees.findIndex((attendee) => {
          if (isUser && attendee.user) {
            const attendeeUser = attendee.user
            const attendeeUserId = (attendeeUser && typeof attendeeUser === 'object' && '_id' in attendeeUser)
              ? attendeeUser._id.toString()
              : attendeeUser.toString()
            return attendeeUserId === userIdOrEmail.toString()
          }
          return attendee.email === userIdOrEmail
        })

        if (attendeeIndex >= 0) {
          this.attendees[attendeeIndex].status = status
          this.attendees[attendeeIndex].responded_at = new Date()
        }
      },

      /**
       * @param {import('mongoose').Types.ObjectId | string} userIdOrEmail
       * @param {boolean} [isUser=true]
       * @returns {void}
       */
      removeAttendee(userIdOrEmail, isUser = true) {
        this.attendees = this.attendees.filter((attendee) => {
          if (isUser && attendee.user) {
            const attendeeUser = attendee.user
            const attendeeUserId = (attendeeUser && typeof attendeeUser === 'object' && '_id' in attendeeUser)
              ? attendeeUser._id.toString()
              : attendeeUser.toString()
            return attendeeUserId !== userIdOrEmail.toString()
          }
          return attendee.email !== userIdOrEmail
        })
      },
      /**
       * Генерирует даты повторений
       * @param {Date} rangeStart
       * @param {Date} rangeEnd
       * @param {number} [maxOccurrences=100]
       * @returns {Date[]}
       */
      generateOccurrences(rangeStart, rangeEnd, maxOccurrences = 100) {
        if (!this.is_recurring || !this.recurrence) {
          return [this.start]
        }

        const occurrences = []
        const { frequency, interval, byWeekday, byMonthDay, count, until } = this.recurrence

        let current = new Date(this.start)
        let occurrenceCount = 0
        const maxDate = until ? new Date(Math.min(until.getTime(), rangeEnd.getTime())) : rangeEnd
        const weekdayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

        while (current <= maxDate && occurrenceCount < (count || maxOccurrences)) {
          if (current >= rangeStart) {
            occurrences.push(new Date(current))
            occurrenceCount++
          }

          switch (frequency) {
            case 'daily':
              current.setDate(current.getDate() + interval)
              break
            case 'weekly':
              if (byWeekday && byWeekday.length > 0) {
                let found = false
                for (let i = 1; i <= 7; i++) {
                  const nextDay = new Date(current)
                  nextDay.setDate(current.getDate() + i)
                  const dayName = /** @type {'MO'|'TU'|'WE'|'TH'|'FR'|'SA'|'SU'} */ (weekdayNames[nextDay.getDay()])
                  if (byWeekday.includes(dayName)) {
                    current = nextDay
                    found = true
                    break
                  }
                }
                if (!found) {
                  current.setDate(current.getDate() + 7 * interval)
                }
              } else {
                current.setDate(current.getDate() + 7 * interval)
              }
              break
            case 'monthly':
              if (byMonthDay && byMonthDay.length > 0) {
                current.setMonth(current.getMonth() + interval)
                current.setDate(Math.min(...byMonthDay))
              } else {
                current.setMonth(current.getMonth() + interval)
              }
              break
            case 'yearly':
              current.setFullYear(current.getFullYear() + interval)
              break
          }

          if (occurrenceCount > maxOccurrences) break
        }

        return occurrences
      },
      /**
       * @returns {boolean}
       */
      isMasterEvent() {
        return this.is_recurring && !this.recurrence_id
      },
      /**
       * @returns {boolean}
       */
      isRecurrenceInstance() {
        return !!this.recurrence_id
      },
    },
  },
)

// Virtual for event ID (alias for _id)
eventSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Virtual for event duration in minutes
eventSchema.virtual('duration').get(function () {
  return Math.round((this.end.getTime() - this.start.getTime()) / (1000 * 60))
})

/** @type {import('./Event').IEventModel} */
export const Event = mongoose.model('Event', eventSchema)
