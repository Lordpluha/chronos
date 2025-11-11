import mongoose from 'mongoose'
import argon2 from 'argon2'

const userSchema = new mongoose.Schema(
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
        message: 'Login can only contain alphanumeric characters, underscores, and hyphens',
      },
    },
    email: {
      type: String,
      required: function () {
        return !this.google_id
      },
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
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
      required: function () {
        // Password is required only if google_id is not present
        return !this.google_id
      },
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
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password_hash
        return ret
      },
    },
  },
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next()

  try {
    this.password_hash = await argon2.hash(this.password_hash)
    next()
  } catch (error) {
    next(error)
  }
})

// Instance method to check password
userSchema.methods.checkPassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password_hash, candidatePassword)
  } catch {
    return false
  }
}

// Static method to find by login
userSchema.statics.findByLogin = function (login) {
  return this.findOne({ login: login })
}

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() })
}

// Static method to find by email or login
userSchema.statics.findByEmailOrUsername = function (loginOrEmail) {
  return this.findOne({
    $or: [
      { login: loginOrEmail },
      { email: loginOrEmail.toLowerCase() }
    ]
  })
}

// Instance method to add calendar
userSchema.methods.addCalendar = function (calendarId) {
  if (!this.calendars.includes(calendarId)) {
    this.calendars.push(calendarId)
  }
}

// Instance method to remove calendar
userSchema.methods.removeCalendar = function (calendarId) {
  this.calendars = this.calendars.filter(
    (calendar) => calendar.toString() !== calendarId.toString(),
  )
}

// Instance method to add task list
userSchema.methods.addTaskList = function (taskListId) {
  if (!this.task_lists.includes(taskListId)) {
    this.task_lists.push(taskListId)
  }
}

// Instance method to remove task list
userSchema.methods.removeTaskList = function (taskListId) {
  this.task_lists = this.task_lists.filter(
    (list) => list.toString() !== taskListId.toString(),
  )
}

export const User = mongoose.model('User', userSchema)
