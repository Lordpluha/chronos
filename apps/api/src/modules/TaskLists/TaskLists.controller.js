import { Router } from 'express'
import { requireAccessToken } from '../../middleware/index.js'
import { validateBody } from '../../utils/index.js'
import { taskListsService } from './TaskLists.service.js'
import {
  createTaskListSchema,
  updateTaskListSchema,
} from './TaskLists.validation.js'

const router = Router()

// POST /task-lists - create a new task list
router.post(
  '/task-lists',
  requireAccessToken,
  validateBody(createTaskListSchema),
  async (req, res) => {
    try {
      const taskList = await taskListsService.createTaskList(req.userId, req.body)
      return res.status(201).json({
        message: 'Task list created successfully',
        data: taskList,
      })
    } catch (err) {
      console.error('❌ Error creating task list:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// GET /task-lists - get all task lists
router.get('/task-lists', requireAccessToken, async (req, res) => {
  try {
    const taskLists = await taskListsService.getAllTaskLists(req.userId, req.query)
    return res.status(200).json({
      message: 'Task lists retrieved successfully',
      data: taskLists,
      count: taskLists.length,
    })
  } catch (err) {
    console.error('❌ Error getting task lists:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// GET /task-lists/:id - get task list by ID
router.get('/task-lists/:id', requireAccessToken, async (req, res) => {
  try {
    const { id } = req.params
    const taskList = await taskListsService.getTaskListById(id, req.userId)
    return res.status(200).json({
      message: 'Task list retrieved successfully',
      data: taskList,
    })
  } catch (err) {
    console.error('❌ Error getting task list:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// GET /task-lists/:id/statistics - get task list statistics
router.get('/task-lists/:id/statistics', requireAccessToken, async (req, res) => {
  try {
    const { id } = req.params
    const stats = await taskListsService.getTaskListStatistics(id, req.userId)
    return res.status(200).json({
      message: 'Task list statistics retrieved successfully',
      data: stats,
    })
  } catch (err) {
    console.error('❌ Error getting task list statistics:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// PATCH /task-lists/:id - update task list
router.patch(
  '/task-lists/:id',
  requireAccessToken,
  validateBody(updateTaskListSchema),
  async (req, res) => {
    try {
      const { id } = req.params
      const taskList = await taskListsService.updateTaskList(id, req.userId, req.body)
      return res.status(200).json({
        message: 'Task list updated successfully',
        data: taskList,
      })
    } catch (err) {
      console.error('❌ Error updating task list:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// PUT /task-lists/:id - update task list (alias)
router.put(
  '/task-lists/:id',
  requireAccessToken,
  validateBody(updateTaskListSchema),
  async (req, res) => {
    try {
      const { id } = req.params
      const taskList = await taskListsService.updateTaskList(id, req.userId, req.body)
      return res.status(200).json({
        message: 'Task list updated successfully',
        data: taskList,
      })
    } catch (err) {
      console.error('❌ Error updating task list:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /task-lists/:id - delete task list
router.delete('/task-lists/:id', requireAccessToken, async (req, res) => {
  try {
    const { id } = req.params
    const result = await taskListsService.deleteTaskList(id, req.userId)
    return res.status(200).json({
      message: 'Task list deleted successfully',
      data: result,
    })
  } catch (err) {
    console.error('❌ Error deleting task list:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

export { router as TaskListsRouter }
