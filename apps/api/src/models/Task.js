import mongoose from 'mongoose'

/**
 * @type {mongoose.Schema}
 */
const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
)

/**
 * @type {mongoose.Schema<import('./Task').ITask, import('./Task').ITaskModel, import('./Task').ITaskMethods>}
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
        index: true,
      },
    ],
    estimated_duration: {
      type: Number, // in minutes
      min: 0,
    },
    actual_duration: {
      type: Number, // in minutes
      min: 0,
    },
    start: {
      type: Date,
      default: null,
      index: true,
    },
    time_zone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    attachments: [attachmentSchema],
    end: {
      type: Date,
      default: null,
      index: true,
      validate: {
        validator: function (value) {
          if (!value || !this.start) return true
          return value > this.start
        },
        message: 'End date must be after start date',
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
      [{ title: 'text', description: 'text' }],
      [{ completed: 1, start: 1, end: 1 }],
      [{ completed: 1, priority: 1 }],
      [{ completed: 1, end: 1 }],
      [{ priority: 1, end: 1 }],
      [{ completed: 1, priority: 1, end: 1 }],
    ],
    statics: {
      /**
       * @param {{ startDate?: Date; endDate?: Date }} [options]
       * @this {import('./Task').ITaskModel}
       */
      findCompleted(options = {}) {
        const query = this.find({ completed: true })

        if (options.startDate || options.endDate) {
          const dateFilter = {}
          if (options.startDate) dateFilter.$gte = options.startDate
          if (options.endDate) dateFilter.$lte = options.endDate
          query.where('updated', dateFilter)
        }

        return query.sort({ updated: -1 })
      },
      /**
       * @param {{ dueBefore?: Date; startAfter?: Date }} [options]
       * @this {import('./Task').ITaskModel}
       */
      findPending(options = {}) {
        const query = this.find({ completed: false })

        if (options.dueBefore) {
          query.where('end').lte(options.dueBefore)
        }

        if (options.startAfter) {
          query.where('start').gte(options.startAfter)
        }

        return query.sort({ end: 1, start: 1 })
      },
      /**
       * @this {import('./Task').ITaskModel}
       */
      findOverdue() {
        return this.find({
          completed: false,
          end: { $lt: new Date() },
        }).sort({ end: 1 })
      },
      /**
       * @this {import('./Task').ITaskModel}
       */
      findDueToday() {
        const today = new Date()
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        )
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1,
        )

        return this.find({
          completed: false,
          end: { $gte: startOfDay, $lt: endOfDay },
        }).sort({ end: 1 })
      },
      /**
       * @param {number} [days]
       * @this {import('./Task').ITaskModel}
       */
      findUpcoming(days = 7) {
        const now = new Date()
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

        return this.find({
          completed: false,
          end: { $gte: now, $lte: future },
        }).sort({ end: 1 })
      },
      /**
       * @param {'low' | 'medium' | 'high' | 'urgent'} priority
       * @this {import('./Task').ITaskModel}
       */
      findByPriority(priority) {
        return this.find({ priority, completed: false }).sort({ end: 1 })
      },
      /**
       * @param {string[]} tags
       * @this {import('./Task').ITaskModel}
       */
      findByTags(tags) {
        return this.find({ tags: { $in: tags } }).sort({ priority: -1, end: 1 })
      },
      /**
       * @this {import('./Task').ITaskModel}
       */
      findHighPriorityOverdue() {
        return this.find({
          completed: false,
          priority: { $in: ['high', 'urgent'] },
          end: { $lt: new Date() },
        }).sort({ priority: -1, end: 1 })
      },
    },
    methods: {
      addTag(tag) {
        if (!this.tags.includes(tag)) {
          this.tags.push(tag)
        }
      },
      removeTag(tag) {
        this.tags = this.tags.filter((t) => t !== tag)
      },
      updateActualDuration(minutes) {
        this.actual_duration = minutes
      },
      markCompleted() {
        this.completed = true
        this.updated = new Date()
      },
      markPending() {
        this.completed = false
        this.updated = new Date()
      },
      addAttachment(attachmentData) {
        this.attachments.push(attachmentData)
      },
      removeAttachment(attachmentId) {
        this.attachments = this.attachments.filter(
          (attachment) => attachment._id.toString() !== attachmentId.toString(),
        )
      },
      getAttachment(attachmentId) {
        return this.attachments.find(
          (attachment) => attachment._id.toString() === attachmentId.toString(),
        )
      },
      hasAttachmentType(mimeType) {
        return this.attachments.some(
          (attachment) => attachment.mimeType === mimeType,
        )
      },
      getTimeUntilDeadline() {
        if (!this.end) return null
        const now = new Date()
        const timeDiff = this.end.getTime() - now.getTime()
        return timeDiff > 0 ? timeDiff : 0
      },
      toggleCompletion() {
        this.completed = !this.completed
        this.updated = new Date()
      },
    },
  },
)

// Virtual for task ID (alias for _id)
taskSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function () {
  if (this.completed || !this.end) return false
  return this.end < new Date()
})

// Virtual to check if task is due today
taskSchema.virtual('isDueToday').get(function () {
  if (!this.end) return false
  const today = new Date()
  const taskDate = new Date(this.end)
  return today.toDateString() === taskDate.toDateString()
})

// Virtual to check if task is upcoming (due within next 7 days)
taskSchema.virtual('isUpcoming').get(function () {
  if (!this.end || this.completed) return false
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return this.end > now && this.end <= nextWeek
})

// Virtual for task duration in minutes (if both start and end are set)
taskSchema.virtual('duration').get(function () {
  if (!this.start || !this.end) return null
  return Math.round((this.end.getTime() - this.start.getTime()) / (1000 * 60))
})

// Virtual for attachments count
taskSchema.virtual('attachmentsCount').get(function () {
  return this.attachments.length
})

// Virtual to get priority level as number (for sorting)
taskSchema.virtual('priorityLevel').get(function () {
  const levels = { low: 1, medium: 2, high: 3, urgent: 4 }
  return levels[this.priority] || 2
})

/** @type {import('./Task').ITaskModel} */
export const Task = mongoose.model('Task', taskSchema)
