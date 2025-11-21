import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IAttachment {
  _id: Types.ObjectId
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: Date
}

export interface ITask {
  title: string
  description: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  estimated_duration?: number
  actual_duration?: number
  start: Date | null
  time_zone: string
  attachments: IAttachment[]
  end: Date | null
  created: Date
  updated: Date
  id: string
  isOverdue: boolean
  isDueToday: boolean
  isUpcoming: boolean
  duration: number | null
  attachmentsCount: number
  priorityLevel: number
}

export interface ITaskMethods {
  addTag(tag: string): void
  removeTag(tag: string): void
  updateActualDuration(minutes: number): void
  markCompleted(): void
  markPending(): void
  addAttachment(attachmentData: IAttachment): void
  removeAttachment(attachmentId: Types.ObjectId | string): void
  getAttachment(attachmentId: Types.ObjectId | string): IAttachment | undefined
  hasAttachmentType(mimeType: string): boolean
  getTimeUntilDeadline(): number | null
  toggleCompletion(): void
}

export type ITaskDocument = HydratedDocument<ITask, ITaskMethods>

export interface ITaskStatics {
  findCompleted(options?: { startDate?: Date; endDate?: Date }): Promise<ITaskDocument[]>
  findPending(options?: { dueBefore?: Date; startAfter?: Date }): Promise<ITaskDocument[]>
  findOverdue(): Promise<ITaskDocument[]>
  findDueToday(): Promise<ITaskDocument[]>
  findUpcoming(days?: number): Promise<ITaskDocument[]>
  findByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<ITaskDocument[]>
  findByTags(tags: string[]): Promise<ITaskDocument[]>
  findHighPriorityOverdue(): Promise<ITaskDocument[]>
}

export type ITaskModel = Model<ITask, Record<string, never>, ITaskMethods> & ITaskStatics

declare const Task: ITaskModel
export { Task }
