import { Router } from 'express'
import { requireAccessToken } from '../../middleware/index.js'
import { validateBody } from '../../utils/index.js'
import { tasksService } from './Tasks.service.js'
import {
  createTaskSchema,
  updateTaskSchema,
  tagSchema,
} from './Tasks.validation.js'

const router = Router()

// GET /tasks/overdue - get overdue tasks
router.get('/tasks/overdue', requireAccessToken, async (req, res) => {
  try {
    const tasks = await tasksService.getOverdueTasks()
    return res.status(200).json({
      message: 'Overdue tasks retrieved successfully',
      data: tasks,
      count: tasks.length,
    })
  } catch (err) {
    console.error('❌ Error getting overdue tasks:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// GET /tasks/today - get today's tasks
router.get('/tasks/today', requireAccessToken, async (req, res) => {
  try {
    const tasks = await tasksService.getTodayTasks()
    return res.status(200).json({
      message: "Today's tasks retrieved successfully",
      data: tasks,
      count: tasks.length,
    })
  } catch (err) {
    console.error('❌ Error getting today tasks:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// GET /tasks/upcoming - get upcoming tasks
router.get('/tasks/upcoming', requireAccessToken, async (req, res) => {
  try {
    const { days = 7 } = req.query
    const tasks = await tasksService.getUpcomingTasks(days)
    return res.status(200).json({
      message: 'Upcoming tasks retrieved successfully',
      data: tasks,
      count: tasks.length,
    })
  } catch (err) {
    console.error('❌ Error getting upcoming tasks:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// POST /tasks/:taskListId - create a new task
router.post(
  '/tasks/:taskListId',
  requireAccessToken,
  validateBody(createTaskSchema),
  async (req, res) => {
    try {
      const { taskListId } = req.params
      const task = await tasksService.createTask(req.userId, taskListId, req.body)
      return res.status(201).json({
        message: 'Task created successfully',
        data: task,
      })
    } catch (err) {
      console.error('❌ Error creating task:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// GET /tasks/:taskListId - get tasks by task list
router.get('/tasks/:taskListId', requireAccessToken, async (req, res) => {
  try {
    const { taskListId } = req.params
    const tasks = await tasksService.getTasksByTaskList(
      req.userId,
      taskListId,
      req.query,
    )
    return res.status(200).json({
      message: 'Tasks retrieved successfully',
      data: tasks,
      count: tasks.length,
    })
  } catch (err) {
    console.error('❌ Error getting tasks:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// GET /tasks/:taskListId/:taskId - get task by ID
router.get('/tasks/:taskListId/:taskId', requireAccessToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const task = await tasksService.getTaskById(taskId)
    return res.status(200).json({
      message: 'Task retrieved successfully',
      data: task,
    })
  } catch (err) {
    console.error('❌ Error getting task:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// PATCH /tasks/:taskListId/:taskId - update task
router.patch(
  '/tasks/:taskListId/:taskId',
  requireAccessToken,
  validateBody(updateTaskSchema),
  async (req, res) => {
    try {
      const { taskId } = req.params
      const task = await tasksService.updateTask(taskId, req.body)
      return res.status(200).json({
        message: 'Task updated successfully',
        data: task,
      })
    } catch (err) {
      console.error('❌ Error updating task:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// PUT /tasks/:taskListId/:taskId - update task (alias)
router.put(
  '/tasks/:taskListId/:taskId',
  requireAccessToken,
  validateBody(updateTaskSchema),
  async (req, res) => {
    try {
      const { taskId } = req.params
      const task = await tasksService.updateTask(taskId, req.body)
      return res.status(200).json({
        message: 'Task updated successfully',
        data: task,
      })
    } catch (err) {
      console.error('❌ Error updating task:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// PATCH /tasks/:taskListId/:taskId/toggle - toggle task completion
router.patch('/tasks/:taskListId/:taskId/toggle', requireAccessToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const task = await tasksService.toggleTaskCompletion(taskId)
    return res.status(200).json({
      message: 'Task completion toggled successfully',
      data: task,
    })
  } catch (err) {
    console.error('❌ Error toggling task completion:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

// PATCH /tasks/:taskListId/:taskId/tags/add - add tag to task
router.patch(
  '/tasks/:taskListId/:taskId/tags/add',
  requireAccessToken,
  validateBody(tagSchema),
  async (req, res) => {
    try {
      const { taskId } = req.params
      const { tag } = req.body
      const task = await tasksService.addTagToTask(taskId, tag)
      return res.status(200).json({
        message: 'Tag added successfully',
        data: task,
      })
    } catch (err) {
      console.error('❌ Error adding tag:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// PATCH /tasks/:taskListId/:taskId/tags/remove - remove tag from task
router.patch(
  '/tasks/:taskListId/:taskId/tags/remove',
  requireAccessToken,
  validateBody(tagSchema),
  async (req, res) => {
    try {
      const { taskId } = req.params
      const { tag } = req.body
      const task = await tasksService.removeTagFromTask(taskId, tag)
      return res.status(200).json({
        message: 'Tag removed successfully',
        data: task,
      })
    } catch (err) {
      console.error('❌ Error removing tag:', err)
      return res.status(err.status || 500).json({ message: err.message })
    }
  },
)

// DELETE /tasks/:taskListId/:taskId - delete task
router.delete('/tasks/:taskListId/:taskId', requireAccessToken, async (req, res) => {
  try {
    const { taskListId, taskId } = req.params
    const result = await tasksService.deleteTask(req.userId, taskListId, taskId)
    return res.status(200).json({
      message: 'Task deleted successfully',
      data: result,
    })
  } catch (err) {
    console.error('❌ Error deleting task:', err)
    return res.status(err.status || 500).json({ message: err.message })
  }
})

export { router as TasksRouter }
