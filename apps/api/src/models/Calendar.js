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
      index: true,
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
      index: true,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shared_with: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          index: true,
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
    statics: {
      findByOwner(ownerId) {
        return this.find({ owner: ownerId }).populate('owner creator')
      },
      findByCreator(creatorId) {
        return this.find({ creator: creatorId }).populate('owner creator')
      },
      findAccessibleByUser(userId) {
        return this.find({
          $or: [
            { owner: userId },
            { creator: userId },
            { 'shared_with.user': userId },
          ],
        }).populate('owner creator')
      },
    },
    methods: {
      hasAccess(userId, requiredPermission = 'read') {
        const userIdStr = userId.toString()

        if (
          this.owner.toString() === userIdStr ||
          this.creator.toString() === userIdStr
        ) {
          return true
        }

        const sharedAccess = this.shared_with.find(
          (share) => share.user.toString() === userIdStr,
        )

        if (!sharedAccess) return false

        const permissions = ['read', 'write', 'admin']
        const userPermissionLevel = permissions.indexOf(sharedAccess.permission)
        const requiredPermissionLevel = permissions.indexOf(requiredPermission)

        return userPermissionLevel >= requiredPermissionLevel
      },
      shareWith(userId, permission = 'read') {
        const existingShare = this.shared_with.find(
          (share) => share.user.toString() === userId.toString(),
        )

        if (existingShare) {
          existingShare.permission = permission
          existingShare.shared_at = new Date()
        } else {
          this.shared_with.push({
            user: userId,
            permission: permission,
            shared_at: new Date(),
          })
        }
      },
      removeSharedAccess(userId) {
        this.shared_with = this.shared_with.filter(
          (share) => share.user.toString() !== userId.toString(),
        )
      },
      addEvent(eventId) {
        if (!this.events.includes(eventId)) {
          this.events.push(eventId)
        }
      },
      removeEvent(eventId) {
        this.events = this.events.filter(
          (event) => event.toString() !== eventId.toString(),
        )
      },
      addReminder(reminderId) {
        if (!this.reminders.includes(reminderId)) {
          this.reminders.push(reminderId)
        }
      },
      removeReminder(reminderId) {
        this.reminders = this.reminders.filter(
          (reminder) => reminder.toString() !== reminderId.toString(),
        )
      },
    },
  },
)

// Virtual for calendar ID (alias for _id)
calendarSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

export const Calendar = mongoose.model('Calendar', calendarSchema)
