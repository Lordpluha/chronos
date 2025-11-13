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
      expires: 0,
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
      findValidOtp(userId, code) {
        return this.findOne({
          user: userId,
          code: code,
          expires_at: { $gt: new Date() },
        }).populate('user')
      },
      createOtp(userId, code, expirationMinutes = 15) {
        const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)

        return this.create({
          user: userId,
          code: code,
          expires_at: expiresAt,
        })
      },
      cleanupExpiredForUser(userId) {
        return this.deleteMany({
          user: userId,
          expires_at: { $lt: new Date() },
        })
      },
    },
    methods: {
      isExpired() {
        return this.expires_at < new Date()
      },
      isValid() {
        return !this.isExpired()
      },
      getRemainingTime() {
        const now = new Date()
        const timeDiff = this.expires_at - now
        return timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60)) : 0
      },
    },
  },
)

// Virtual for ID (alias for _id)
passwordResetOtpSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

export const PasswordResetOtp = mongoose.model(
  'PasswordResetOtp',
  passwordResetOtpSchema,
)
