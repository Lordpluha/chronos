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
    color: {
      type: String,
      required: true,
      default: '#3b82f6',
      validate: {
        validator: (value) => /^#[0-9A-F]{6}$/i.test(value),
        message: 'Color must be a valid hex color code',
      },
    },
    visibility: {
      type: String,
      required: true,
      enum: ['private', 'public', 'shared'],
      default: 'private',
    },
    is_default: {
      type: Boolean,
      default: false,
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
    shared_with: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permission: {
          type: String,
          enum: ['read', 'write', 'admin'],
          default: 'read',
        },
        shared_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
calendarSchema.index({ visibility: 1 })
calendarSchema.index({ 'shared_with.user': 1 })
calendarSchema.index({ owner: 1, visibility: 1 })
calendarSchema.index({ creator: 1, visibility: 1 })
calendarSchema.index({ color: 1 })

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
calendarSchema.methods.hasAccess = function (userId, requiredPermission = 'read') {
  if (
    this.owner.toString() === userId.toString() ||
    this.creator.toString() === userId.toString()
  ) {
    return true
  }

  if (this.visibility === 'public' && requiredPermission === 'read') {
    return true
  }

  const sharedEntry = this.shared_with.find(
    (entry) => entry.user.toString() === userId.toString(),
  )

  if (!sharedEntry) return false

  const permissionLevels = { read: 1, write: 2, admin: 3 }
  const userLevel = permissionLevels[sharedEntry.permission]
  const requiredLevel = permissionLevels[requiredPermission]

  return userLevel >= requiredLevel
}

// Instance method to share calendar with user
calendarSchema.methods.shareWith = function (userId, permission = 'read') {
  const existingIndex = this.shared_with.findIndex(
    (entry) => entry.user.toString() === userId.toString(),
  )

  if (existingIndex >= 0) {
    this.shared_with[existingIndex].permission = permission
    this.shared_with[existingIndex].shared_at = new Date()
  } else {
    this.shared_with.push({
      user: userId,
      permission,
      shared_at: new Date(),
    })
  }
}

// Instance method to remove user from shared access
calendarSchema.methods.removeSharedAccess = function (userId) {
  this.shared_with = this.shared_with.filter(
    (entry) => entry.user.toString() !== userId.toString(),
  )
}

// Static method to find calendars accessible by user
calendarSchema.statics.findAccessibleByUser = function (userId) {
  return this.find({
    $or: [
      { owner: userId },
      { creator: userId },
      { visibility: 'public' },
      { 'shared_with.user': userId },
    ],
  }).populate('creator owner shared_with.user')
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
