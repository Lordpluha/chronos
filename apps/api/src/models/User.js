import mongoose, { Schema, model } from 'mongoose'
import argon2 from 'argon2'

/**
 * @type {mongoose.Schema<import('./User').IUser, import('./User').IUserModel, import('./User').IUserMethods>}
 */
const UserSchema = new Schema(
  {
    login: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      validate: {
        validator: (value) => /^[a-zA-Z0-9_-]+$/.test(value),
        message:
          'Login can only contain alphanumeric characters, underscores, and hyphens',
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) =>
          !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Invalid email format',
      },
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    password_hash: {
      type: String,
      required: false,
      minlength: 6,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    task_lists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskList',
      },
    ],
    google_id: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
      validate: {
        validator: (value) => !value || /^https?:\/\/.+/.test(value),
        message: 'Avatar must be a valid URL',
      },
    },
    calendars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Calendar',
      },
    ],
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated',
    },
    statics: {
      /**
       * @param {string} login
       * @this {import('./User').IUserModel}
       */
      findByLogin(login) {
        return this.findOne({ login: login })
      },
      /**
       * @param {string} email
       * @this {import('./User').IUserModel}
       */
      findByEmail(email) {
        return this.findOne({ email: email.toLowerCase() })
      },
      /**
       * @param {string} loginOrEmail
       * @this {import('./User').IUserModel}
       */
      findByEmailOrUsername(loginOrEmail) {
        return this.findOne({
          $or: [{ login: loginOrEmail }, { email: loginOrEmail.toLowerCase() }],
        })
      },
    },
    methods: {
      /**
       * @param {string} candidatePassword
       */
      async checkPassword(candidatePassword) {
        try {
          return await argon2.verify(this.password_hash, candidatePassword)
        } catch {
          return false
        }
      },
      /**
       * @param {import('mongoose').Types.ObjectId} calendarId
       */
      addCalendar(calendarId) {
        if (!this.calendars.includes(calendarId)) {
          this.calendars.push(calendarId)
        }
      },
      /**
       * @param {import('mongoose').Types.ObjectId} calendarId
       */
      removeCalendar(calendarId) {
        this.calendars = this.calendars.filter(
          (calendar) => calendar.toString() !== calendarId.toString(),
        )
      },
      /**
       * "@param {import('mongoose').Types.ObjectId} taskListId
       */
      addTaskList(taskListId) {
        if (!this.task_lists.includes(taskListId)) {
          this.task_lists.push(taskListId)
        }
      },
      /**
       * @param {import('mongoose').Types.ObjectId} taskListId
       */
      removeTaskList(taskListId) {
        this.task_lists = this.task_lists.filter(
          (list) => list.toString() !== taskListId.toString(),
        )
      },
    },
  },
)

/**
 * Hash password before saving
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next()

  try {
    this.password_hash = await argon2.hash(this.password_hash)
    next()
  } catch (error) {
    next(error)
  }
})

/** @type {import('./User').IUserModel} */
export const User = model('User', UserSchema)
