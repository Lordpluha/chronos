import { Task } from '../../models/Task.js'
import { TaskList } from '../../models/TaskList.js'

class TasksService {
  /**
   * Create a new task
   * @param {string} userId - User ID
   * @param {string} taskListId - Task list ID
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  async createTask(userId, taskListId, taskData) {
    const {
      title,
      description,
      priority = 'medium',
      tags = [],
      subtasks = [],
      start,
      end,
      estimated_duration,
    } = taskData

    const taskList = await TaskList.findOne({
      _id: taskListId,
      creator: userId,
    })

    if (!taskList) {
      const err = new Error('Task list not found')
      err.status = 404
      throw err
    }

    const newTask = new Task({
      title,
      description,
      priority,
      tags,
      subtasks,
      start: start ? new Date(start) : null,
      end: end ? new Date(end) : null,
      estimated_duration,
      completed: false,
      attachments: [],
    })

    await newTask.save()

    if (!taskList.tasks.includes(newTask._id)) {
      taskList.tasks.push(newTask._id)
    }

    await taskList.save()

    return newTask
  }

  /**
   * Get tasks by task list
   * @param {string} userId - User ID
   * @param {string} taskListId - Task list ID
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} Array of tasks
   */
  async getTasksByTaskList(userId, taskListId, query) {
    const { sort = '-created', filter } = query

    const taskList = await TaskList.findOne({
      _id: taskListId,
      creator: userId,
    })

    if (!taskList) {
      const err = new Error('Task list not found')
      err.status = 404
      throw err
    }

    let taskQuery = Task.find({ _id: { $in: taskList.tasks } })

    if (filter === 'completed') {
      taskQuery = taskQuery.where('completed', true)
    } else if (filter === 'pending') {
      taskQuery = taskQuery.where('completed', false)
    }

    const tasks = await taskQuery.sort(sort)

    return tasks
  }

  /**
   * Get task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task
   */
  async getTaskById(taskId) {
    const task = await Task.findById(taskId)

    if (!task) {
      const err = new Error('Task not found')
      err.status = 404
      throw err
    }

    return task
  }

  /**
   * Update task
   * @param {string} taskId - Task ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(taskId, updateData) {
    const {
      title,
      description,
      priority,
      tags,
      subtasks,
      start,
      end,
      estimated_duration,
      actual_duration,
      completed,
    } = updateData

    const task = await Task.findById(taskId)

    if (!task) {
      const err = new Error('Task not found')
      err.status = 404
      throw err
    }

    const updates = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(priority && { priority }),
      ...(tags && { tags }),
      ...(subtasks !== undefined && { subtasks }),
      ...(start && { start: new Date(start) }),
      ...(end && { end: new Date(end) }),
      ...(estimated_duration !== undefined && { estimated_duration }),
      ...(actual_duration !== undefined && { actual_duration }),
      ...(completed !== undefined && { completed }),
      updated: new Date(),
    }

    Object.assign(task, updates)
    await task.save()

    return task
  }

  /**
   * Delete task
   * @param {string} userId - User ID
   * @param {string} taskListId - Task list ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteTask(userId, taskListId, taskId) {
    const taskList = await TaskList.findOne({
      _id: taskListId,
      creator: userId,
    })

    if (!taskList) {
      const err = new Error('Task list not found')
      err.status = 404
      throw err
    }

    const task = await Task.findById(taskId)

    if (!task) {
      const err = new Error('Task not found')
      err.status = 404
      throw err
    }

    taskList.tasks = taskList.tasks.filter(
      (task) => task.toString() !== taskId.toString(),
    )
    await taskList.save()

    await Task.deleteOne({ _id: taskId })

    return { id: taskId }
  }

  /**
   * Toggle task completion
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Updated task
   */
  async toggleTaskCompletion(taskId) {
    const task = await Task.findById(taskId)

    if (!task) {
      const err = new Error('Task not found')
      err.status = 404
      throw err
    }

    task.completed = !task.completed
    task.updated = new Date()
    await task.save()

    return task
  }

  /**
   * Add tag to task
   * @param {string} taskId - Task ID
   * @param {string} tag - Tag to add
   * @returns {Promise<Object>} Updated task
   */
  async addTagToTask(taskId, tag) {
    const task = await Task.findById(taskId)

    if (!task) {
      const err = new Error('Task not found')
      err.status = 404
      throw err
    }

    if (!task.tags.includes(tag)) {
      task.tags.push(tag)
    }

    await task.save()

    return task
  }

  /**
   * Remove tag from task
   * @param {string} taskId - Task ID
   * @param {string} tag - Tag to remove
   * @returns {Promise<Object>} Updated task
   */
  async removeTagFromTask(taskId, tag) {
    const task = await Task.findById(taskId)

    if (!task) {
      const err = new Error('Task not found')
      err.status = 404
      throw err
    }

    task.tags = task.tags.filter((t) => t !== tag)
    await task.save()

    return task
  }

  /**
   * Get overdue tasks
   * @returns {Promise<Array>} Array of overdue tasks
   */
  async getOverdueTasks() {
    const tasks = await Task.find({
      completed: false,
      end: { $lt: new Date() },
    }).sort({ end: 1 })

    return tasks
  }

  /**
   * Get today's tasks
   * @returns {Promise<Array>} Array of today's tasks
   */
  async getTodayTasks() {
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

    const tasks = await Task.find({
      completed: false,
      end: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ end: 1 })

    return tasks
  }

  /**
   * Get upcoming tasks
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Array of upcoming tasks
   */
  async getUpcomingTasks(days = 7) {
    const now = new Date()
    const future = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000)

    const tasks = await Task.find({
      completed: false,
      end: { $gte: now, $lte: future },
    }).sort({ end: 1 })

    return tasks
  }
}

export const tasksService = new TasksService()
