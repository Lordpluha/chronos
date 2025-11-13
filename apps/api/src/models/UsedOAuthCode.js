import mongoose from 'mongoose'

const usedOAuthCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
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
    statics: {
      async isCodeUsed(code) {
        const existingCode = await this.findOne({ code })
        return !!existingCode
      },
      async markAsUsed(code, expiresInMinutes = 10) {
        const expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000)

        return await this.create({
          code,
          expires_at,
        })
      },
    },
  },
)

export const UsedOAuthCode = mongoose.model('UsedOAuthCode', usedOAuthCodeSchema)
