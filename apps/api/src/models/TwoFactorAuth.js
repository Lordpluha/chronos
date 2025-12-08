import mongoose, { Schema, model } from 'mongoose'
import speakeasy from 'speakeasy'

/**
 * @type {mongoose.Schema<import('./TwoFactorAuth').ITwoFactorAuth, import('./TwoFactorAuth').ITwoFactorAuthModel, import('./TwoFactorAuth').ITwoFactorAuthMethods>}
 */
const TwoFactorAuthSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    backupCodes: {
      type: [String],
      default: [],
    },
    enabledAt: {
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
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {import('./TwoFactorAuth').ITwoFactorAuthModel}
       */
      findByUserId(userId) {
        return this.findOne({ userId })
      },
    },
    methods: {
      /**
       * @param {string} token
       */
      verifyToken(token) {
        return speakeasy.totp.verify({
          secret: this.secretKey,
          encoding: 'base32',
          token: token,
          window: 1,
        })
      },
      /**
       * @param {string} code
       */
      async verifyBackupCode(code) {
        const codeIndex = this.backupCodes.indexOf(code)
        if (codeIndex !== -1) {
          // Remove used backup code
          this.backupCodes.splice(codeIndex, 1)
          await this.save()
          return true
        }
        return false
      },
      /**
       * Generate 10 backup codes
       */
      generateBackupCodes() {
        const codes = []
        for (let i = 0; i < 10; i++) {
          // Generate 8-character code
          const code = Math.random().toString(36).substring(2, 10).toUpperCase()
          codes.push(code)
        }
        this.backupCodes = codes
        return codes
      },
    },
  },
)

/** @type {import('./TwoFactorAuth').ITwoFactorAuthModel} */
export const TwoFactorAuth = model('TwoFactorAuth', TwoFactorAuthSchema)
