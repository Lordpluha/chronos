import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IReminder {
  title: string
  description: string | null
  creator: Types.ObjectId
  organizer: Types.ObjectId
  calendar: Types.ObjectId
  start: Date
  time_zone: string
  created: Date
  updated: Date
  id: string
  isOverdue: boolean
  isUpcoming: boolean
}

export interface IReminderMethods {
  hasAccess(userId: Types.ObjectId | string): boolean
  shouldTrigger(minutesBefore?: number): boolean
  getTimeUntil(): number
}

export type IReminderDocument = HydratedDocument<IReminder, IReminderMethods>

export interface IReminderStatics {
  findByCalendar(calendarId: Types.ObjectId | string, options?: { startDate?: Date; endDate?: Date }): ReturnType<Model<IReminder>['find']>
  findByCreator(creatorId: Types.ObjectId | string): ReturnType<Model<IReminder>['find']>
  findByOrganizer(organizerId: Types.ObjectId | string): ReturnType<Model<IReminder>['find']>
  findOverdue(options?: { calendarId?: Types.ObjectId | string; userId?: Types.ObjectId | string }): ReturnType<Model<IReminder>['find']>
  findUpcoming(hours?: number, options?: { calendarId?: Types.ObjectId | string; userId?: Types.ObjectId | string }): ReturnType<Model<IReminder>['find']>
  findInDateRange(startDate: Date, endDate: Date, options?: { calendarId?: Types.ObjectId | string }): ReturnType<Model<IReminder>['find']>
}

export interface IReminderModel extends Model<IReminder, Record<string, never>, IReminderMethods>, IReminderStatics {}

declare const Reminder: IReminderModel
export { Reminder }
