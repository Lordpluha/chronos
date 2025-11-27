import express from 'express'
import { requireAccessToken } from '../../middleware/accesses.js'
import {
  createTaskList,
  getAllTaskLists,
  getTaskListById,
  updateTaskList,
  deleteTaskList,
  getTaskListStatistics,
} from './TaskLists.controller.js'

export const taskListsRouter = express.Router()

taskListsRouter.use(requireAccessToken)

// POST
taskListsRouter.post('/', createTaskList)

// GET
taskListsRouter.get('/', getAllTaskLists)

taskListsRouter.get('/:id', getTaskListById)

taskListsRouter.get('/:id/statistics', getTaskListStatistics)

// PATCH/PUT
taskListsRouter.patch('/:id', updateTaskList)
taskListsRouter.put('/:id', updateTaskList)

// DELETE
taskListsRouter.delete('/:id', deleteTaskList)

export default taskListsRouter
