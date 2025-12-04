import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IEventLocation {
  name?: string
  address?: string
  coordinates?: {
    longitude: number
    latitude: number
  }
  url?: string
}

export interface IAttendee {
  user?: Types.ObjectId | string
  email?: string
  status: 'invited' | 'accepted' | 'declined' | 'maybe'
  invited_at: Date
  responded_at?: Date
  pending_role?: 'owner' | 'admin' | 'viewer' // Role до подтверждения
}

export interface IRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  byWeekday?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[]
  byMonthDay?: number[]
  byMonth?: number[]
  count?: number
  until?: Date
}

export interface IEvent {
  title: string
  description: string | null
  creator: Types.ObjectId
  organizer: Types.ObjectId
  calendar: Types.ObjectId
  time_zone: string
  start: Date
  end: Date
  location: IEventLocation | null
  is_all_day: boolean
  status: 'confirmed' | 'tentative' | 'cancelled'
  attendees: IAttendee[]
  label: 'indigo' | 'gray' | 'green' | 'blue' | 'red' | 'purple'
  created: Date
  updated: Date
  id: string
  duration: number
}

export interface IEventMethods {
  hasAccess(userId: Types.ObjectId | string): boolean
  isActive(): boolean
  isUpcoming(): boolean
  isPast(): boolean
  addAttendee(userIdOrEmail: Types.ObjectId | string, isUser?: boolean, role?: string): void
  updateAttendeeStatus(userIdOrEmail: Types.ObjectId | string, status: 'invited' | 'accepted' | 'declined' | 'maybe', isUser?: boolean): void
  removeAttendee(userIdOrEmail: Types.ObjectId | string, isUser?: boolean): void
  generateOccurrences(rangeStart: Date, rangeEnd: Date, maxOccurrences?: number): Date[]
  isMasterEvent(): boolean
  isRecurrenceInstance(): boolean
}

export type IEventDocument = HydratedDocument<IEvent, IEventMethods>

export interface IEventStatics {
  findByCalendar(calendarId: Types.ObjectId | string, options?: { startDate?: Date; endDate?: Date }): ReturnType<Model<IEvent>['find']>
  findByCreator(creatorId: Types.ObjectId | string): ReturnType<Model<IEvent>['find']>
  findByOrganizer(organizerId: Types.ObjectId | string): ReturnType<Model<IEvent>['find']>
  findInDateRange(startDate: Date, endDate: Date, options?: { calendarId?: Types.ObjectId | string }): ReturnType<Model<IEvent>['find']>
  findByAttendee(userId: Types.ObjectId | string): ReturnType<Model<IEvent>['find']>
  findRecurrenceInstances(recurrenceId: Types.ObjectId | string): ReturnType<Model<IEvent>['find']>
  findWithRecurrence(calendarId: Types.ObjectId | string, startDate: Date, endDate: Date): Promise<IEvent[]>
}

export interface IEventModel extends Model<IEvent, Record<string, never>, IEventMethods>, IEventStatics {}

declare const Event: IEventModel
export { Event }
