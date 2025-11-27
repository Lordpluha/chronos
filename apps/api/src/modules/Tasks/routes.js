import express from 'express'
import { requireAccessToken } from '../../middleware/accesses.js'
import {
  createTask,
  getTasksByTaskList,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  addTagToTask,
  removeTagFromTask,
  getOverdueTasks,
  getTodayTasks,
  getUpcomingTasks,
} from './Tasks.controller.js'

export const tasksRouter = express.Router()
tasksRouter.use(requireAccessToken)

// GET
tasksRouter.get('/overdue', getOverdueTasks)

tasksRouter.get('/today', getTodayTasks)

tasksRouter.get('/upcoming', getUpcomingTasks)

// POST
tasksRouter.post('/:taskListId', createTask)

// GET
tasksRouter.get('/:taskListId', getTasksByTaskList)

tasksRouter.get('/:taskListId/:taskId', getTaskById)

// PATCH/PUT
tasksRouter.patch('/:taskListId/:taskId', updateTask)
tasksRouter.put('/:taskListId/:taskId', updateTask)

// PATCH
tasksRouter.patch('/:taskListId/:taskId/toggle', toggleTaskCompletion)

tasksRouter.patch('/:taskListId/:taskId/tags/add', addTagToTask)

tasksRouter.patch('/:taskListId/:taskId/tags/remove', removeTagFromTask)

// DELETE
tasksRouter.delete('/:taskListId/:taskId', deleteTask)

export default tasksRouter
