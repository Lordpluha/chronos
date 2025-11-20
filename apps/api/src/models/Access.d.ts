import type { Model, Types, HydratedDocument } from 'mongoose'

export interface IAccess {
  user: Types.ObjectId
  controls: 'calendar' | 'event' | 'reminder' | 'task'
  type: 'create' | 'read' | 'update' | 'delete' | 'share'
  entity_id: Types.ObjectId
  name: string
  created: Date
  updated: Date
  id: string
}

// Access model has no instance methods
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type IAccessMethods = {}

export type IAccessDocument = HydratedDocument<IAccess, IAccessMethods>

export interface IAccessStatics {
  findByUser(userId: Types.ObjectId | string): ReturnType<Model<IAccess>['find']>
  findByEntity(entityId: Types.ObjectId | string): ReturnType<Model<IAccess>['find']>
  hasAccess(userId: Types.ObjectId | string, controls: string, type: string, entityId: Types.ObjectId | string): Promise<boolean>
  findByUserAndControls(userId: Types.ObjectId | string, controls: string): ReturnType<Model<IAccess>['find']>
  findByUserAndType(userId: Types.ObjectId | string, type: string): ReturnType<Model<IAccess>['find']>
  findByEntityAndControls(entityId: Types.ObjectId | string, controls: string): ReturnType<Model<IAccess>['find']>
  grantAccess(userId: Types.ObjectId | string, controls: string, type: string, entityId: Types.ObjectId | string, name: string): Promise<IAccessDocument>
  revokeAccess(userId: Types.ObjectId | string, controls: string, type: string, entityId: Types.ObjectId | string): Promise<{ deletedCount?: number }>
  revokeAllAccessesForEntity(entityId: Types.ObjectId | string): Promise<{ deletedCount?: number }>
  revokeAllAccessesForUser(userId: Types.ObjectId | string): Promise<{ deletedCount?: number }>
}

export interface IAccessModel extends Model<IAccess, Record<string, never>, IAccessMethods>, IAccessStatics {}

declare const Access: IAccessModel
export { Access }
