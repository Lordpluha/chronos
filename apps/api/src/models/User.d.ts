import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IUser {
  login: string
  email: string
  full_name: string
  password_hash?: string
  is_email_verified: boolean
  task_lists: Types.ObjectId[]
  google_id?: string
  avatar: string | null
  calendars: Types.ObjectId[]
  twoFactorEnabled: boolean
  lastLoginAt: Date | null
  created: Date
  updated: Date
}

export interface IUserMethods {
  checkPassword(candidatePassword: string): Promise<boolean>
  addCalendar(calendarId: Types.ObjectId): void
  removeCalendar(calendarId: Types.ObjectId): void
  addTaskList(taskListId: Types.ObjectId): void
  removeTaskList(taskListId: Types.ObjectId): void
}

export type IUserDocument = HydratedDocument<IUser, IUserMethods>

export interface IUserStatics {
  findByLogin(login: string): Promise<IUserDocument | null>
  findByEmail(email: string): Promise<IUserDocument | null>
  findByEmailOrUsername(loginOrEmail: string): Promise<IUserDocument | null>
}

export type IUserModel = Model<IUser, Record<string, never>, IUserMethods> &
  IUserStatics

declare const User: IUserModel
export { User }
