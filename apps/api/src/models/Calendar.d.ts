import type { Model, Types, HydratedDocument } from 'mongoose'

export interface ISharedWith {
  user: Types.ObjectId | string
  permission: 'read' | 'write' | 'admin'
  shared_at: Date
}

export interface ICalendar {
  title: string
  description: string | null
  time_zone: string
  color: string
  visibility: 'private' | 'public' | 'shared'
  is_default: boolean
  creator: Types.ObjectId
  owner: Types.ObjectId
  shared_with: ISharedWith[]
  reminders: Types.ObjectId[]
  events: Types.ObjectId[]
  created: Date
  updated: Date
  id: string
}

export interface ICalendarMethods {
  hasAccess(userId: Types.ObjectId | string, requiredPermission?: 'read' | 'write' | 'admin'): boolean
  shareWith(userId: Types.ObjectId | string, permission?: 'read' | 'write' | 'admin'): void
  removeSharedAccess(userId: Types.ObjectId | string): void
  addEvent(eventId: Types.ObjectId | string): void
  removeEvent(eventId: Types.ObjectId | string): void
  addReminder(reminderId: Types.ObjectId | string): void
  removeReminder(reminderId: Types.ObjectId | string): void
}

export type ICalendarDocument = HydratedDocument<ICalendar, ICalendarMethods>

export interface ICalendarStatics {
  findByOwner(ownerId: Types.ObjectId | string): ReturnType<Model<ICalendar>['find']>
  findByCreator(creatorId: Types.ObjectId | string): ReturnType<Model<ICalendar>['find']>
  findAccessibleByUser(userId: Types.ObjectId | string): ReturnType<Model<ICalendar>['find']>
}

export interface ICalendarModel extends Model<ICalendar, Record<string, never>, ICalendarMethods>, ICalendarStatics {}

declare const Calendar: ICalendarModel
export { Calendar }
