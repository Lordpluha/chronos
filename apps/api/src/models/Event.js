import mongoose from 'mongoose'
import { locationSchema } from './Location.js'

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
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    calendar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calendar',
      required: true,
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
    },
    status: {
      type: String,
      enum: ['confirmed', 'tentative', 'cancelled'],
      default: 'confirmed',
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
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
      },
    ],
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
  },
)

// Index for better performance
eventSchema.index({ calendar: 1 })
eventSchema.index({ creator: 1 })
eventSchema.index({ organizer: 1 })
eventSchema.index({ start: 1, end: 1 })
eventSchema.index({ title: 'text', description: 'text' })
eventSchema.index({ status: 1 })
eventSchema.index({ 'attendees.user': 1 })
eventSchema.index({ calendar: 1, start: 1 })
eventSchema.index({ calendar: 1, status: 1 })
eventSchema.index({ organizer: 1, start: 1 })
eventSchema.index({ is_all_day: 1, start: 1 })

// Virtual for event ID (alias for _id)
eventSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Virtual for event duration in minutes
eventSchema.virtual('duration').get(function () {
  return Math.round((this.end - this.start) / (1000 * 60))
})

// Static method to find events by calendar
eventSchema.statics.findByCalendar = function (calendarId, options = {}) {
  const query = this.find({ calendar: calendarId })

  if (options.startDate || options.endDate) {
    const dateFilter = {}
    if (options.startDate) dateFilter.$gte = options.startDate
    if (options.endDate) dateFilter.$lte = options.endDate
    query.where('start', dateFilter)
  }

  return query.populate('creator organizer calendar')
}

// Static method to find events by creator
eventSchema.statics.findByCreator = function (creatorId) {
  return this.find({ creator: creatorId }).populate(
    'creator organizer calendar',
  )
}

// Static method to find events by organizer
eventSchema.statics.findByOrganizer = function (organizerId) {
  return this.find({ organizer: organizerId }).populate(
    'creator organizer calendar',
  )
}

// Static method to find events in date range
eventSchema.statics.findInDateRange = function (
  startDate,
  endDate,
  options = {},
) {
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
}

// Instance method to check if user has access to event
eventSchema.methods.hasAccess = function (userId) {
  return (
    this.creator.toString() === userId.toString() ||
    this.organizer.toString() === userId.toString()
  )
}

// Instance method to check if event is happening now
eventSchema.methods.isActive = function () {
  const now = new Date()
  return this.start <= now && this.end >= now
}

// Instance method to check if event is upcoming
eventSchema.methods.isUpcoming = function () {
  return this.start > new Date()
}

// Instance method to check if event has passed
eventSchema.methods.isPast = function () {
  return this.end < new Date()
}

// Instance method to add attendee
eventSchema.methods.addAttendee = function (userIdOrEmail, isUser = true) {
  const existingIndex = this.attendees.findIndex((attendee) => {
    if (isUser && attendee.user) {
      return attendee.user.toString() === userIdOrEmail.toString()
    }
    return attendee.email === userIdOrEmail
  })

  if (existingIndex === -1) {
    const attendeeData = isUser
      ? { user: userIdOrEmail, status: 'invited' }
      : { email: userIdOrEmail, status: 'invited' }

    this.attendees.push(attendeeData)
  }
}

// Instance method to update attendee status
eventSchema.methods.updateAttendeeStatus = function (userIdOrEmail, status, isUser = true) {
  const attendeeIndex = this.attendees.findIndex((attendee) => {
    if (isUser && attendee.user) {
      return attendee.user.toString() === userIdOrEmail.toString()
    }
    return attendee.email === userIdOrEmail
  })

  if (attendeeIndex >= 0) {
    this.attendees[attendeeIndex].status = status
    this.attendees[attendeeIndex].responded_at = new Date()
  }
}

// Instance method to remove attendee
eventSchema.methods.removeAttendee = function (userIdOrEmail, isUser = true) {
  this.attendees = this.attendees.filter((attendee) => {
    if (isUser && attendee.user) {
      return attendee.user.toString() !== userIdOrEmail.toString()
    }
    return attendee.email !== userIdOrEmail
  })
}

// Static method to find events by attendee
eventSchema.statics.findByAttendee = function (userId) {
  return this.find({
    $or: [
      { creator: userId },
      { organizer: userId },
      { 'attendees.user': userId },
    ],
  }).populate('creator organizer calendar attendees.user')
}

export const Event = mongoose.model('Event', eventSchema)
