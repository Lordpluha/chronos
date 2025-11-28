import { TaskList } from '../../models/TaskList.js'
import { Task } from '../../models/Task.js'

class TaskListsService {
  /**
   * Create a new task list
   * @param {string} userId - User ID
   * @param {Object} taskListData - Task list data
   * @returns {Promise<Object>} Created task list
   */
  async createTaskList(userId, taskListData) {
    const { name, description } = taskListData

    const newTaskList = new TaskList({
      name,
      description,
      creator: userId,
      tasks: [],
    })

    await newTaskList.save()
    await newTaskList.populate('creator', 'username email')

    return newTaskList
  }

  /**
   * Get all task lists for a user
   * @param {string} userId - User ID
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} Array of task lists
   */
  async getAllTaskLists(userId, query) {
    const { populate = false } = query

    let taskListQuery = TaskList.find({ creator: userId }).populate(
      'creator',
      'username email',
    )

    if (populate === 'true') {
      taskListQuery = taskListQuery.populate({
        path: 'tasks',
        options: { sort: { created: -1 } },
      })
    }

    const taskLists = await taskListQuery.sort({ created: -1 })

    return taskLists
  }

  /**
   * Get task list by ID
   * @param {string} taskListId - Task list ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Task list
   */
  async getTaskListById(taskListId, userId) {
    const taskList = await TaskList.findOne({ _id: taskListId, creator: userId })
      .populate('creator', 'username email')
      .populate({
        path: 'tasks',
        options: { sort: { created: -1 } },
      })

    if (!taskList) {
      const err = new Error('Task list not found')
      err.status = 404
      throw err
    }

    return taskList
  }

  /**
   * Update task list
   * @param {string} taskListId - Task list ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task list
   */
  async updateTaskList(taskListId, userId, updateData) {
    const { name, description } = updateData

    const taskList = await TaskList.findOne({ _id: taskListId, creator: userId })

    if (!taskList) {
      const err = new Error('Task list not found')
      err.status = 404
      throw err
    }

    if (name) taskList.name = name
    if (description !== undefined) taskList.description = description

    await taskList.save()
    await taskList.populate('creator', 'username email')
    await taskList.populate({
      path: 'tasks',
      options: { sort: { created: -1 } },
    })

    return taskList
  }

  /**
   * Delete task list
   * @param {string} taskListId - Task list ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteTaskList(taskListId, userId) {
    const taskList = await TaskList.findOne({ _id: taskListId, creator: userId })

    if (!taskList) {
      const err = new Error('Task list not found')
      err.status = 404
      throw err
    }

    if (taskList.tasks && taskList.tasks.length > 0) {
      await Task.deleteMany({ _id: { $in: taskList.tasks } })
    }

    await TaskList.deleteOne({ _id: taskListId })

    return { id: taskListId }
  }

  /**
   * Get task list statistics
   * @param {string} taskListId - Task list ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Task list statistics
   */
  async getTaskListStatistics(taskListId, userId) {
    const taskList = await TaskList.findOne({ _id: taskListId, creator: userId }).populate('tasks')

    if (!taskList) {
      const err = new Error('Task list not found')
      err.status = 404
      throw err
    }

    const now = new Date()
    const stats = {
      total: taskList.tasks.length,
      completed: 0,
      pending: 0,
      overdue: 0,
    }

    taskList.tasks.forEach((task) => {
      if (task.completed) {
        stats.completed++
      } else {
        stats.pending++
        if (task.end && task.end < now) {
          stats.overdue++
        }
      }
    })

    return {
      taskListId: taskListId,
      ...stats,
    }
  }
}

export const taskListsService = new TaskListsService()
