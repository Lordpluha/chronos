import type { Model, Types, HydratedDocument } from 'mongoose'

export interface ITaskList {
  creator: Types.ObjectId
  name: string
  description: string | null
  tasks: Types.ObjectId[]
  created: Date
  updated: Date
  id: string
  totalTasks: number
  completedTasksCount: number | null
  progressPercentage: number
}

export interface ITaskListMethods {
  addTask(taskId: Types.ObjectId): void
  removeTask(taskId: Types.ObjectId | string): void
  hasAccess(userId: Types.ObjectId | string): boolean
  reorderTasks(taskIds: (Types.ObjectId | string)[]): void
}

export type ITaskListDocument = HydratedDocument<ITaskList, ITaskListMethods>

export interface ITaskListStatics {
  findByCreator(creatorId: Types.ObjectId | string, options?: { populateTasks?: boolean }): Promise<ITaskListDocument[]>
  findWithTasks(filter?: Record<string, unknown>): Promise<ITaskListDocument[]>
}

export type ITaskListModel = Model<ITaskList, Record<string, never>, ITaskListMethods> & ITaskListStatics

declare const TaskList: ITaskListModel
export { TaskList }
