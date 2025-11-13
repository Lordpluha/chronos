import mongoose from 'mongoose'

const taskListSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    indexes: [
      [{ name: 'text', description: 'text' }],
    ],
    statics: {
      findByCreator(creatorId, options = {}) {
        const query = this.find({ creator: creatorId })

        if (options.populateTasks) {
          query.populate('tasks')
        }

        return query.populate('creator')
      },
      findWithTasks(filter = {}) {
        return this.find(filter)
          .populate('creator')
          .populate({
            path: 'tasks',
            options: { sort: { created: -1 } },
          })
      },
    },
    methods: {
      addTask(taskId) {
        if (!this.tasks.includes(taskId)) {
          this.tasks.push(taskId)
        }
      },
      removeTask(taskId) {
        this.tasks = this.tasks.filter(
          (task) => task.toString() !== taskId.toString(),
        )
      },
      hasAccess(userId) {
        return this.creator.toString() === userId.toString()
      },
      getStatistics() {
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
      },
      reorderTasks(taskIds) {
        // Validate that all task IDs belong to this list
        const currentTaskIds = this.tasks.map((id) => id.toString())
        const validIds = taskIds.filter((id) =>
          currentTaskIds.includes(id.toString()),
        )

        if (validIds.length === currentTaskIds.length) {
          this.tasks = validIds
        }
      },
    },
  },
)

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

export const TaskList = mongoose.model('TaskList', taskListSchema)
