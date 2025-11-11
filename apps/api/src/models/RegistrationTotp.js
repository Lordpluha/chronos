import mongoose from 'mongoose'

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
  },
)

// Virtual for registration TOTP ID (alias for _id)
registrationTotpSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// TTL index for automatic cleanup
registrationTotpSchema.index({ expiration: 1 }, { expireAfterSeconds: 0 })

// Static method to find valid TOTP by user
registrationTotpSchema.statics.findValidByUser = function (userId) {
  return this.findOne({
    user: userId,
    status: 'pending',
    expiration: { $gt: new Date() },
  }).populate('user')
}

// Static method to create new registration TOTP
registrationTotpSchema.statics.createTotp = function (
  userId,
  values,
  expirationMinutes = 15,
  timeZone = 'UTC',
) {
  const expiration = new Date(Date.now() + expirationMinutes * 60 * 1000)

  return this.create({
    user: userId,
    values: values,
    expiration: expiration,
    status: 'pending',
    time_zone: timeZone,
  })
}

// Static method to cleanup expired TOTPs for user
registrationTotpSchema.statics.cleanupExpiredForUser = function (userId) {
  return this.deleteMany({
    user: userId,
    $or: [
      { expiration: { $lt: new Date() } },
      { status: { $in: ['verified', 'expired', 'failed'] } },
    ],
  })
}

// Instance method to check if TOTP is expired
registrationTotpSchema.methods.isExpired = function () {
  return this.expiration < new Date()
}

// Instance method to check if TOTP is valid
registrationTotpSchema.methods.isValid = function () {
  return this.status === 'pending' && !this.isExpired()
}

// Instance method to verify value
registrationTotpSchema.methods.verifyValue = function (value) {
  if (!this.isValid()) {
    return false
  }
  return this.values.includes(value)
}

// Instance method to mark as verified
registrationTotpSchema.methods.markVerified = function () {
  this.status = 'verified'
  this.updated = new Date()
}

// Instance method to mark as failed
registrationTotpSchema.methods.markFailed = function () {
  this.status = 'failed'
  this.updated = new Date()
}

// Instance method to mark as expired
registrationTotpSchema.methods.markExpired = function () {
  this.status = 'expired'
  this.updated = new Date()
}

// Instance method to get remaining time in minutes
registrationTotpSchema.methods.getRemainingTime = function () {
  const now = new Date()
  const timeDiff = this.expiration - now
  return timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60)) : 0
}

export const RegistrationTotp = mongoose.model(
  'RegistrationTotp',
  registrationTotpSchema,
)
