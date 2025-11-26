import mongoose from 'mongoose'
import { locationSchema } from './Location.js'

/**
 * @typedef {import('./Session').ISession} ISession
 * @typedef {import('./Session').ISessionMethods} ISessionMethods
 * @typedef {import('./Session').ISessionModel} ISessionModel
 */

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
    userAgent: {
      type: String,
      required: false,
      maxlength: 500,
    },
  },
  { _id: false },
)

/**
 * @type {mongoose.Schema<ISession, ISessionModel, ISessionMethods>}
 */
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
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @returns {Promise<import('./Session').ISessionDocument[]>}
       * @this {import('./Session').ISessionModel}
       */
      findByUser(userId) {
        return this.find({ user: userId }).populate('user')
      },
      /**
       * @param {string} accessToken
       * @returns {Promise<import('./Session').ISessionDocument | null>}
       * @this {import('./Session').ISessionModel}
       */
      findByAccessToken(accessToken) {
        return this.findOne({ access_token: accessToken }).populate('user')
      },
      /**
       * @param {string} refreshToken
       * @returns {Promise<import('./Session').ISessionDocument | null>}
       * @this {import('./Session').ISessionModel}
       */
      findByRefreshToken(refreshToken) {
        return this.findOne({ refresh_token: refreshToken }).populate('user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {import('./Session').ISessionModel}
       */
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
        const currentDevice = this.device || {}
        this.device = {
          ...currentDevice,
          ...deviceInfo,
        }
      },
      /**
       * @returns {number}
       */
      getAgeInDays() {
        const now = new Date()
        /** @type {Date} */
        const createdDate = this.get('created')
        const ageInMs = now.getTime() - createdDate.getTime()
        return Math.floor(ageInMs / (1000 * 60 * 60 * 24))
      },
    },
  },
)

// Virtual for session ID (alias for _id)
sessionSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

/** @type {import('./Session').ISessionModel} */
export const Session = mongoose.model('Session', sessionSchema)
