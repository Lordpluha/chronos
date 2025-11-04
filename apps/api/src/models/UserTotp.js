import mongoose from 'mongoose'

const userTotpSchema = new mongoose.Schema(
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
    timestamps: true,
  },
)

export const UserTotp = mongoose.model('UserTotp', userTotpSchema)
