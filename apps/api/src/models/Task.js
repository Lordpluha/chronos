import mongoose from 'mongoose'

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
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
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
  },
)

// Index for better performance
taskSchema.index({ completed: 1 })
taskSchema.index({ start: 1 })
taskSchema.index({ end: 1 })
taskSchema.index({ title: 'text', description: 'text' })
taskSchema.index({ completed: 1, start: 1, end: 1 })
taskSchema.index({ priority: 1 })
taskSchema.index({ tags: 1 })
taskSchema.index({ completed: 1, priority: 1 })
taskSchema.index({ completed: 1, end: 1 })
taskSchema.index({ priority: 1, end: 1 })
taskSchema.index({ completed: 1, priority: 1, end: 1 })

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
  return Math.round((this.end - this.start) / (1000 * 60))
})

// Virtual for attachments count
taskSchema.virtual('attachmentsCount').get(function () {
  return this.attachments.length
})

// Static method to find completed tasks
taskSchema.statics.findCompleted = function (options = {}) {
  const query = this.find({ completed: true })

  if (options.startDate || options.endDate) {
    const dateFilter = {}
    if (options.startDate) dateFilter.$gte = options.startDate
    if (options.endDate) dateFilter.$lte = options.endDate
    query.where('updated', dateFilter)
  }

  return query.sort({ updated: -1 })
}

// Static method to find pending tasks
taskSchema.statics.findPending = function (options = {}) {
  const query = this.find({ completed: false })

  if (options.dueBefore) {
    query.where('end').lte(options.dueBefore)
  }

  if (options.startAfter) {
    query.where('start').gte(options.startAfter)
  }

  return query.sort({ end: 1, start: 1 })
}

// Static method to find overdue tasks
taskSchema.statics.findOverdue = function () {
  return this.find({
    completed: false,
    end: { $lt: new Date() },
  }).sort({ end: 1 })
}

// Static method to find tasks due today
taskSchema.statics.findDueToday = function () {
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
}

// Static method to find upcoming tasks
taskSchema.statics.findUpcoming = function (days = 7) {
  const now = new Date()
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  return this.find({
    completed: false,
    end: { $gte: now, $lte: future },
  }).sort({ end: 1 })
}

// Static method to find tasks by priority
taskSchema.statics.findByPriority = function (priority) {
  return this.find({ priority, completed: false }).sort({ end: 1 })
}

// Static method to find tasks by tags
taskSchema.statics.findByTags = function (tags) {
  return this.find({ tags: { $in: tags } }).sort({ priority: -1, end: 1 })
}

// Static method to find high priority overdue tasks
taskSchema.statics.findHighPriorityOverdue = function () {
  return this.find({
    completed: false,
    priority: { $in: ['high', 'urgent'] },
    end: { $lt: new Date() },
  }).sort({ priority: -1, end: 1 })
}

// Instance method to add tag
taskSchema.methods.addTag = function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag)
  }
}

// Instance method to remove tag
taskSchema.methods.removeTag = function (tag) {
  this.tags = this.tags.filter((t) => t !== tag)
}

// Instance method to update duration tracking
taskSchema.methods.updateActualDuration = function (minutes) {
  this.actual_duration = minutes
}

// Virtual to get priority level as number (for sorting)
taskSchema.virtual('priorityLevel').get(function () {
  const levels = { low: 1, medium: 2, high: 3, urgent: 4 }
  return levels[this.priority] || 2
})

// Instance method to mark as completed
taskSchema.methods.markCompleted = function () {
  this.completed = true
  this.updated = new Date()
}

// Instance method to mark as pending
taskSchema.methods.markPending = function () {
  this.completed = false
  this.updated = new Date()
}

// Instance method to add attachment
taskSchema.methods.addAttachment = function (attachmentData) {
  this.attachments.push(attachmentData)
}

// Instance method to remove attachment
taskSchema.methods.removeAttachment = function (attachmentId) {
  this.attachments = this.attachments.filter(
    (attachment) => attachment._id.toString() !== attachmentId.toString(),
  )
}

// Instance method to get attachment by ID
taskSchema.methods.getAttachment = function (attachmentId) {
  return this.attachments.find(
    (attachment) => attachment._id.toString() === attachmentId.toString(),
  )
}

// Instance method to check if task has specific attachment type
taskSchema.methods.hasAttachmentType = function (mimeType) {
  return this.attachments.some((attachment) => attachment.mimeType === mimeType)
}

// Instance method to get time until deadline
taskSchema.methods.getTimeUntilDeadline = function () {
  if (!this.end) return null
  const now = new Date()
  const timeDiff = this.end - now
  return timeDiff > 0 ? timeDiff : 0
}

// Instance method to toggle completion status
taskSchema.methods.toggleCompletion = function () {
  this.completed = !this.completed
  this.updated = new Date()
}

export const Task = mongoose.model('Task', taskSchema)
