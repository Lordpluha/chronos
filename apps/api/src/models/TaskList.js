import mongoose from 'mongoose'

/**
 * @type {mongoose.Schema<import('./TaskList').ITaskList, import('./TaskList').ITaskListModel, import('./TaskList').ITaskListMethods>}
 */
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
    indexes: [[{ name: 'text', description: 'text' }]],
    statics: {
      /**
       * @param {import('mongoose').Types.ObjectId | string} creatorId
       * @param {{ populateTasks?: boolean }} [options]
       * @this {import('./TaskList').ITaskListModel}
       */
      findByCreator(creatorId, options = {}) {
        const query = this.find({ creator: creatorId })

        if (options.populateTasks) {
          query.populate('tasks')
        }

        return query.populate('creator')
      },
      /**
       * @param {Record<string, unknown>} [filter]
       * @this {import('./TaskList').ITaskListModel}
       */
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
      reorderTasks(taskIds) {
        // Validate that all task IDs belong to this list
        const currentTaskIds = this.tasks.map((id) => id.toString())
        const validIds = taskIds.filter((id) =>
          currentTaskIds.includes(id.toString()),
        )

        if (validIds.length === currentTaskIds.length) {
          this.tasks = validIds.map(id => new mongoose.Types.ObjectId(id))
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


/** @type {import('./TaskList').ITaskListModel} */
export const TaskList = mongoose.model('TaskList', taskListSchema)
