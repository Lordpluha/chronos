import mongoose from 'mongoose'

const taskListSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
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
taskListSchema.index({ creator: 1 })
taskListSchema.index({ name: 'text', description: 'text' })

// Virtual for task list ID (alias for _id)
taskListSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Virtual for total tasks count
taskListSchema.virtual('totalTasks').get(function () {
  return this.tasks.length
})

// Virtual for completed tasks count (requires populated tasks)
taskListSchema.virtual('completedTasksCount').get(function () {
  if (!this.populated('tasks')) return null
  return this.tasks.filter((task) => task.completed).length
})

// Virtual for progress percentage (requires populated tasks)
taskListSchema.virtual('progressPercentage').get(function () {
  if (!this.populated('tasks') || this.tasks.length === 0) return 0
  const completed = this.tasks.filter((task) => task.completed).length
  return Math.round((completed / this.tasks.length) * 100)
})

// Static method to find task lists by creator
taskListSchema.statics.findByCreator = function (creatorId, options = {}) {
  const query = this.find({ creator: creatorId })

  if (options.populateTasks) {
    query.populate('tasks')
  }

  return query.populate('creator')
}

// Static method to find task lists with populated tasks
taskListSchema.statics.findWithTasks = function (filter = {}) {
  return this.find(filter)
    .populate('creator')
    .populate({
      path: 'tasks',
      options: { sort: { created: -1 } },
    })
}

// Instance method to add task to list
taskListSchema.methods.addTask = function (taskId) {
  if (!this.tasks.includes(taskId)) {
    this.tasks.push(taskId)
  }
}

// Instance method to remove task from list
taskListSchema.methods.removeTask = function (taskId) {
  this.tasks = this.tasks.filter(
    (task) => task.toString() !== taskId.toString(),
  )
}

// Instance method to check if user has access to task list
taskListSchema.methods.hasAccess = function (userId) {
  return this.creator.toString() === userId.toString()
}

// Instance method to get task statistics (requires populated tasks)
taskListSchema.methods.getStatistics = function () {
  if (!this.populated('tasks')) {
    return {
      total: this.tasks.length,
      completed: null,
      pending: null,
      overdue: null,
    }
  }

  const now = new Date()
  const stats = {
    total: this.tasks.length,
    completed: 0,
    pending: 0,
    overdue: 0,
  }

  this.tasks.forEach((task) => {
    if (task.completed) {
      stats.completed++
    } else {
      stats.pending++
      if (task.end && task.end < now) {
        stats.overdue++
      }
    }
  })

  return stats
}

// Instance method to reorder tasks
taskListSchema.methods.reorderTasks = function (taskIds) {
  // Validate that all task IDs belong to this list
  const currentTaskIds = this.tasks.map((id) => id.toString())
  const validIds = taskIds.filter((id) =>
    currentTaskIds.includes(id.toString()),
  )

  if (validIds.length === currentTaskIds.length) {
    this.tasks = validIds
  }
}

export const TaskList = mongoose.model('TaskList', taskListSchema)
