import type { Model, Types, HydratedDocument } from 'mongoose'

export interface ITwoFactorAuth {
  userId: Types.ObjectId
  secretKey: string
  isEnabled: boolean
  backupCodes: string[]
  enabledAt: Date | null
  created: Date
  updated: Date
}

export interface ITwoFactorAuthMethods {
  verifyToken(token: string): boolean
  verifyBackupCode(code: string): Promise<boolean>
  generateBackupCodes(): string[]
}

export type ITwoFactorAuthDocument = HydratedDocument<ITwoFactorAuth, ITwoFactorAuthMethods>

export interface ITwoFactorAuthStatics {
  findByUserId(userId: Types.ObjectId | string): Promise<ITwoFactorAuthDocument | null>
}

export type ITwoFactorAuthModel = Model<ITwoFactorAuth, Record<string, never>, ITwoFactorAuthMethods> & ITwoFactorAuthStatics

declare const TwoFactorAuth: ITwoFactorAuthModel
export { TwoFactorAuth }
