import mongoose from 'mongoose'

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

export const Event = mongoose.model('Event', eventSchema)
