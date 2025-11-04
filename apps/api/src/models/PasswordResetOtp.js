import mongoose from 'mongoose'

const passwordResetOtpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
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

// Virtual for ID (alias for _id)
passwordResetOtpSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// TTL index for automatic cleanup
passwordResetOtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })

// Static method to find valid OTP by user and code
passwordResetOtpSchema.statics.findValidOtp = function (userId, code) {
  return this.findOne({
    user: userId,
    code: code,
    expires_at: { $gt: new Date() },
  }).populate('user')
}

// Static method to create new OTP
passwordResetOtpSchema.statics.createOtp = function (
  userId,
  code,
  expirationMinutes = 15,
) {
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)

  return this.create({
    user: userId,
    code: code,
    expires_at: expiresAt,
  })
}

// Static method to cleanup expired OTPs for user
passwordResetOtpSchema.statics.cleanupExpiredForUser = function (userId) {
  return this.deleteMany({
    user: userId,
    expires_at: { $lt: new Date() },
  })
}

// Instance method to check if OTP is expired
passwordResetOtpSchema.methods.isExpired = function () {
  return this.expires_at < new Date()
}

// Instance method to check if OTP is valid
passwordResetOtpSchema.methods.isValid = function () {
  return !this.isExpired()
}

// Instance method to get remaining time in minutes
passwordResetOtpSchema.methods.getRemainingTime = function () {
  const now = new Date()
  const timeDiff = this.expires_at - now
  return timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60)) : 0
}

export const PasswordResetOtp = mongoose.model(
  'PasswordResetOtp',
  passwordResetOtpSchema,
)
