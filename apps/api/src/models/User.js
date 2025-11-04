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
    },
    calendars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Calendar',
      },
    ],
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

export const User = mongoose.model('User', userSchema)
