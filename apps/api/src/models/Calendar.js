import mongoose from 'mongoose'

const calendarSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    time_zone: {
      type: String,
      required: true,
      default: 'UTC',
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reminders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reminder',
      },
    ],
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
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
calendarSchema.index({ owner: 1 })
calendarSchema.index({ creator: 1 })
calendarSchema.index({ title: 'text', description: 'text' })

// Virtual for calendar ID (alias for _id)
calendarSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Static method to find calendars by owner
calendarSchema.statics.findByOwner = function (ownerId) {
  return this.find({ owner: ownerId }).populate('creator owner')
}

// Static method to find calendars by creator
calendarSchema.statics.findByCreator = function (creatorId) {
  return this.find({ creator: creatorId }).populate('creator owner')
}

// Instance method to check if user has access to calendar
calendarSchema.methods.hasAccess = function (userId) {
  return (
    this.owner.toString() === userId.toString() ||
    this.creator.toString() === userId.toString()
  )
}

// Instance method to add event to calendar
calendarSchema.methods.addEvent = function (eventId) {
  if (!this.events.includes(eventId)) {
    this.events.push(eventId)
  }
}

// Instance method to remove event from calendar
calendarSchema.methods.removeEvent = function (eventId) {
  this.events = this.events.filter(
    (event) => event.toString() !== eventId.toString(),
  )
}

// Instance method to add reminder to calendar
calendarSchema.methods.addReminder = function (reminderId) {
  if (!this.reminders.includes(reminderId)) {
    this.reminders.push(reminderId)
  }
}

// Instance method to remove reminder from calendar
calendarSchema.methods.removeReminder = function (reminderId) {
  this.reminders = this.reminders.filter(
    (reminder) => reminder.toString() !== reminderId.toString(),
  )
}

export const Calendar = mongoose.model('Calendar', calendarSchema)
