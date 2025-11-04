import mongoose from 'mongoose'
import { locationSchema } from './Location.js'

const deviceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: false,
    },
    height: {
      type: Number,
      required: false,
    },
    width: {
      type: Number,
      required: false,
    },
    type: {
      type: String,
      required: false,
      enum: ['desktop', 'mobile', 'tablet', 'tv', 'watch', 'unknown'],
      default: 'unknown',
    },
    title: {
      type: String,
      required: false,
      maxlength: 200,
    },
    icon: {
      type: String,
      required: false,
    },
    device: {
      type: String,
      required: false,
      maxlength: 500,
    },
  },
  { _id: false },
)

const sessionSchema = new mongoose.Schema(
  {
    access_token: {
      type: String,
      required: true,
      index: true,
    },
    refresh_token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ip_address: {
      type: String,
      default: null,
    },
    location: {
      type: locationSchema,
      default: null,
    },
    device: {
      type: deviceSchema,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: false, // Только created, без updated
    },
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
)

// Virtual for session ID (alias for _id)
sessionSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Index for automatic cleanup based on created date (30 days)
sessionSchema.index({ created: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

// Static method to find sessions by user
sessionSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).populate('user')
}

// Static method to find session by access token
sessionSchema.statics.findByAccessToken = function (accessToken) {
  return this.findOne({ access_token: accessToken }).populate('user')
}

// Static method to find session by refresh token
sessionSchema.statics.findByRefreshToken = function (refreshToken) {
  return this.findOne({ refresh_token: refreshToken }).populate('user')
}

// Static method to cleanup expired sessions for user
sessionSchema.statics.cleanupExpiredForUser = function (userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return this.deleteMany({
    user: userId,
    created: { $lt: thirtyDaysAgo },
  })
}

// Instance method to check if session belongs to user
sessionSchema.methods.belongsToUser = function (userId) {
  return this.user.toString() === userId.toString()
}

// Instance method to update location
sessionSchema.methods.updateLocation = function (longitude, latitude) {
  this.location = { longitude, latitude }
}

// Instance method to update device info
sessionSchema.methods.updateDevice = function (deviceInfo) {
  this.device = { ...this.device, ...deviceInfo }
}

// Instance method to get session age in days
sessionSchema.methods.getAgeInDays = function () {
  const now = new Date()
  const ageInMs = now - this.created
  return Math.floor(ageInMs / (1000 * 60 * 60 * 24))
}

export const Session = mongoose.model('Session', sessionSchema)
