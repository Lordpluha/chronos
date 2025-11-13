import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IRegistrationTotp {
  user: Types.ObjectId
  values: string[]
  expiration: Date
  status: 'pending' | 'verified' | 'expired' | 'failed'
  time_zone: string
  created: Date
  updated: Date
  id: string
}

export interface IRegistrationTotpMethods {
  isExpired(): boolean
  isValid(): boolean
  verifyValue(value: string): boolean
  markVerified(): void
  markFailed(): void
  markExpired(): void
  getRemainingTime(): number
}

export type IRegistrationTotpDocument = HydratedDocument<IRegistrationTotp, IRegistrationTotpMethods>

export interface IRegistrationTotpStatics {
  findValidByUser(userId: Types.ObjectId | string): ReturnType<Model<IRegistrationTotp>['findOne']>
  createTotp(userId: Types.ObjectId | string, values: string[], expirationMinutes?: number, timeZone?: string): Promise<IRegistrationTotpDocument>
  cleanupExpiredForUser(userId: Types.ObjectId | string): Promise<{ deletedCount?: number }>
}

export interface IRegistrationTotpModel extends Model<IRegistrationTotp, Record<string, never>, IRegistrationTotpMethods>, IRegistrationTotpStatics {}

declare const RegistrationTotp: IRegistrationTotpModel
export { RegistrationTotp }
