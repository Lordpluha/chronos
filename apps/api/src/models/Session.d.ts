import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IDevice {
  id?: string
  height?: number
  width?: number
  type?: 'desktop' | 'mobile' | 'tablet' | 'tv' | 'watch' | 'unknown'
  title?: string
  icon?: string
  userAgent?: string
}

export interface ILocation {
  longitude: number
  latitude: number
}

export interface ISession {
  access_token: string
  refresh_token: string
  user: Types.ObjectId
  ip_address: string | null
  location: ILocation | null
  device: IDevice | null
  created: Date
  id: string
}

export interface ISessionMethods {
  belongsToUser(userId: Types.ObjectId | string): boolean
  updateLocation(longitude: number, latitude: number): void
  updateDevice(deviceInfo: Partial<IDevice>): void
  getAgeInDays(): number
}

export type ISessionDocument = HydratedDocument<ISession, ISessionMethods>

export interface ISessionStatics {
  findByUser(userId: Types.ObjectId | string): Promise<ISessionDocument[]>
  findByAccessToken(accessToken: string): Promise<ISessionDocument | null>
  findByRefreshToken(refreshToken: string): Promise<ISessionDocument | null>
  cleanupExpiredForUser(userId: Types.ObjectId | string): Promise<{ deletedCount?: number }>
}

export type ISessionModel = Model<ISession, Record<string, never>, ISessionMethods> & ISessionStatics

declare const Session: ISessionModel
export { Session }
