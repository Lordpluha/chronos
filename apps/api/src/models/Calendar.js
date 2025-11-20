import mongoose from 'mongoose'

/**
 * @type {mongoose.Schema<import('./Calendar').ICalendar, import('./Calendar').ICalendarModel, import('./Calendar').ICalendarMethods>}
 */
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
      /**
       * @param {import('mongoose').Types.ObjectId | string} ownerId
       * @this {import('./Calendar').ICalendarModel}
       */
      findByOwner(ownerId) {
        return this.find({ owner: ownerId }).populate('owner creator')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} creatorId
       * @this {import('./Calendar').ICalendarModel}
       */
      findByCreator(creatorId) {
        return this.find({ creator: creatorId }).populate('owner creator')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {import('./Calendar').ICalendarModel}
       */
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

        // Безопасное получение ID владельца и создателя
        const ownerId = this.owner?._id ? this.owner._id.toString() : this.owner.toString()
        const creatorId = this.creator?._id ? this.creator._id.toString() : this.creator.toString()

        if (ownerId === userIdStr || creatorId === userIdStr) {
          return true
        }

        const sharedAccess = this.shared_with.find((share) => {
          const shareUserId = share.user?._id ? share.user._id.toString() : share.user.toString()
          return shareUserId === userIdStr
        })

        if (!sharedAccess) return false

        const permissions = ['read', 'write', 'admin']
        const userPermissionLevel = permissions.indexOf(sharedAccess.permission)
        const requiredPermissionLevel = permissions.indexOf(requiredPermission)

        return userPermissionLevel >= requiredPermissionLevel
      },
      shareWith(userId, permission = 'read') {
        const userIdStr = userId.toString()
        const existingShare = this.shared_with.find((share) => {
          const shareUserId = share.user?._id ? share.user._id.toString() : share.user.toString()
          return shareUserId === userIdStr
        })

        if (existingShare) {
          existingShare.permission = permission
          existingShare.shared_at = new Date()
        } else {
          this.shared_with.push({
            user: /** @type {import('mongoose').Types.ObjectId} */ (userId),
            permission: permission,
            shared_at: new Date(),
          })
        }
      },
      removeSharedAccess(userId) {
        const userIdStr = userId.toString()
        this.shared_with = this.shared_with.filter((share) => {
          const shareUserId = share.user?._id ? share.user._id.toString() : share.user.toString()
          return shareUserId !== userIdStr
        })
      },
      addEvent(eventId) {
        const id = /** @type {import('mongoose').Types.ObjectId} */ (eventId)
        if (!this.events.includes(id)) {
          this.events.push(id)
        }
      },
      removeEvent(eventId) {
        this.events = this.events.filter(
          (event) => event.toString() !== eventId.toString(),
        )
      },
      addReminder(reminderId) {
        const id = /** @type {import('mongoose').Types.ObjectId} */ (reminderId)
        if (!this.reminders.includes(id)) {
          this.reminders.push(id)
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

/** @type {import('./Calendar').ICalendarModel} */
export const Calendar = mongoose.model('Calendar', calendarSchema)
