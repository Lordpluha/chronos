import mongoose from 'mongoose'

/**
 * @type {mongoose.Schema<import('./Access').IAccess, import('./Access').IAccessModel, import('./Access').IAccessMethods>}
 */
const accessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    controls: {
      type: String,
      required: true,
      enum: ['calendar', 'event', 'reminder', 'task'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['create', 'read', 'update', 'delete', 'share'],
      index: true,
    },
    entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (value) => {
          // Format: {controls}.{type}.{uuid}
          const pattern =
            /^(calendar|event|reminder|task)\.(create|read|update|delete|share)\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          return pattern.test(value)
        },
        message: 'Name must follow format: {controls}.{type}.{uuid}',
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated',
    },
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    indexes: [
      [{ user: 1, entity_id: 1 }],
      [{ user: 1, controls: 1, type: 1 }],
      [{ entity_id: 1, controls: 1 }],
    ],
    statics: {
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {import('./Access').IAccessModel}
       */
      findByUser(userId) {
        return this.find({ user: userId }).populate('user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} entityId
       * @this {import('./Access').IAccessModel}
       */
      findByEntity(entityId) {
        return this.find({ entity_id: entityId }).populate('user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @param {string} controls
       * @param {string} type
       * @param {import('mongoose').Types.ObjectId | string} entityId
       * @this {import('./Access').IAccessModel}
       */
      async hasAccess(userId, controls, type, entityId) {
        const access = await this.findOne({
          user: userId,
          controls,
          type,
          entity_id: entityId,
        })
        return !!access
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @param {string} controls
       * @this {import('./Access').IAccessModel}
       */
      findByUserAndControls(userId, controls) {
        return this.find({ user: userId, controls }).populate('user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @param {string} type
       * @this {import('./Access').IAccessModel}
       */
      findByUserAndType(userId, type) {
        return this.find({ user: userId, type }).populate('user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} entityId
       * @param {string} controls
       * @this {import('./Access').IAccessModel}
       */
      findByEntityAndControls(entityId, controls) {
        return this.find({ entity_id: entityId, controls }).populate('user')
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @param {string} controls
       * @param {string} type
       * @param {import('mongoose').Types.ObjectId | string} entityId
       * @param {string} name
       * @this {import('./Access').IAccessModel}
       */
      async grantAccess(userId, controls, type, entityId, name) {
        const existingAccess = await this.findOne({
          user: userId,
          controls,
          type,
          entity_id: entityId,
        })

        if (existingAccess) {
          return existingAccess
        }

        return this.create({
          user: userId,
          controls,
          type,
          entity_id: entityId,
          name,
        })
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @param {string} controls
       * @param {string} type
       * @param {import('mongoose').Types.ObjectId | string} entityId
       * @this {import('./Access').IAccessModel}
       */
      async revokeAccess(userId, controls, type, entityId) {
        return this.deleteOne({
          user: userId,
          controls,
          type,
          entity_id: entityId,
        })
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} entityId
       * @this {import('./Access').IAccessModel}
       */
      async revokeAllAccessesForEntity(entityId) {
        return this.deleteMany({ entity_id: entityId })
      },
      /**
       * @param {import('mongoose').Types.ObjectId | string} userId
       * @this {import('./Access').IAccessModel}
       */
      async revokeAllAccessesForUser(userId) {
        return this.deleteMany({ user: userId })
      },
    },
  },
)

// Virtual for access ID (alias for _id)
accessSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

/** @type {import('./Access').IAccessModel} */
export const Access = mongoose.model('Access', accessSchema)
