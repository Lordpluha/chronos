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
      index: { unique: true, sparse: true },
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
    expires: '30d',
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    statics: {
      findByUser(userId) {
        return this.find({ user: userId }).populate('user')
      },
      findByAccessToken(accessToken) {
        return this.findOne({ access_token: accessToken }).populate('user')
      },
      findByRefreshToken(refreshToken) {
        return this.findOne({ refresh_token: refreshToken }).populate('user')
      },
      cleanupExpiredForUser(userId) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return this.deleteMany({
          user: userId,
          created: { $lt: thirtyDaysAgo },
        })
      },
    },
    methods: {
      belongsToUser(userId) {
        return this.user.toString() === userId.toString()
      },
      updateLocation(longitude, latitude) {
        this.location = { longitude, latitude }
      },
      updateDevice(deviceInfo) {
        this.device = { ...this.device, ...deviceInfo }
      },
      getAgeInDays() {
        const now = new Date()
        const ageInMs = now - this.created
        return Math.floor(ageInMs / (1000 * 60 * 60 * 24))
      },
    },
  },
)

// Virtual for session ID (alias for _id)
sessionSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

export const Session = mongoose.model('Session', sessionSchema)
