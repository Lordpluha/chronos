import mongoose from 'mongoose'

/**
 * @typedef {import('./RegistrationTotp').IRegistrationTotp} IRegistrationTotp
 * @typedef {import('./RegistrationTotp').IRegistrationTotpMethods} IRegistrationTotpMethods
 * @typedef {import('./RegistrationTotp').IRegistrationTotpModel} IRegistrationTotpModel
 */

/**
 * @type {mongoose.Schema<IRegistrationTotp, IRegistrationTotpModel, IRegistrationTotpMethods>}
 */
const registrationTotpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    values: {
      type: [String],
      required: true,
      validate: {
        validator: (values) => values.length > 0 && values.length <= 10,
        message: 'Values array must contain 1-10 items',
      },
    },
    expiration: {
      type: Date,
      required: true,
      expires: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'verified', 'expired', 'failed'],
      default: 'pending',
    },
    time_zone: {
      type: String,
      required: true,
      default: 'UTC',
      trim: true,
    },
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
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {IRegistrationTotpModel}
       */
      findValidByUser(userId) {
        return this.findOne({
          user: userId,
          status: 'pending',
          expiration: { $gt: new Date() },
        }).populate('user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @param {string[]} values
       * @param {number} [expirationMinutes]
       * @param {string} [timeZone]
       * @this {IRegistrationTotpModel}
       */
      createTotp(userId, values, expirationMinutes = 15, timeZone = 'UTC') {
        const expiration = new Date(Date.now() + expirationMinutes * 60 * 1000)

        return this.create({
          user: userId,
          values: values,
          expiration: expiration,
          status: 'pending',
          time_zone: timeZone,
        })
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {IRegistrationTotpModel}
       */
      cleanupExpiredForUser(userId) {
        return this.deleteMany({
          user: userId,
          $or: [
            { expiration: { $lt: new Date() } },
            { status: { $in: ['verified', 'expired', 'failed'] } },
          ],
        })
      },
    },
    methods: {
      isExpired() {
        return this.expiration < new Date()
      },
      isValid() {
        return this.status === 'pending' && this.expiration >= new Date()
      },
      verifyValue(value) {
        if (this.status !== 'pending' || this.expiration < new Date()) {
          return false
        }
        return this.values.includes(value)
      },
      markVerified() {
        this.status = 'verified'
        this.updated = new Date()
      },
      markFailed() {
        this.status = 'failed'
        this.updated = new Date()
      },
      markExpired() {
        this.status = 'expired'
        this.updated = new Date()
      },
      getRemainingTime() {
        const now = new Date()
        const timeDiff = this.expiration.getTime() - now.getTime()
        return timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60)) : 0
      },
    },
  },
)

// Virtual for registration TOTP ID (alias for _id)
registrationTotpSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

/** @type {IRegistrationTotpModel} */
export const RegistrationTotp = mongoose.model(
  'RegistrationTotp',
  registrationTotpSchema,
)
