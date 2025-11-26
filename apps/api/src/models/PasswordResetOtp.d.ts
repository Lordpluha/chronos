import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IPasswordResetOtp {
  user: Types.ObjectId
  code: string
  expires_at: Date
  created: Date
  updated: Date
  id: string
}

export interface IPasswordResetOtpMethods {
  isExpired(): boolean
  isValid(): boolean
  getRemainingTime(): number
}

export type IPasswordResetOtpDocument = HydratedDocument<IPasswordResetOtp, IPasswordResetOtpMethods>

export interface IPasswordResetOtpStatics {
  findValidOtp(userId: Types.ObjectId | string, code: string): ReturnType<Model<IPasswordResetOtp>['findOne']>
  createOtp(userId: Types.ObjectId | string, code: string, expirationMinutes?: number): Promise<IPasswordResetOtpDocument>
  cleanupExpiredForUser(userId: Types.ObjectId | string): Promise<{ deletedCount?: number }>
}

export interface IPasswordResetOtpModel extends Model<IPasswordResetOtp, Record<string, never>, IPasswordResetOtpMethods>, IPasswordResetOtpStatics {}

declare const PasswordResetOtp: IPasswordResetOtpModel
export { PasswordResetOtp }
