import { Task } from '../../models/Task.js'
import { TaskList } from '../../models/TaskList.js'

// CREATE
export const createTask = async (req, res) => {
  try 
  {
    const { taskListId } = req.params
    const {
      title,
      description,
      priority = 'medium',
      tags = [],
      start,
      end,
      estimated_duration,
    } = req.body

    const taskList = await TaskList.findOne({
      _id: taskListId,
      creator: req.userId,
    })

    if(!taskList) return res.status(404).json({ message: 'Task list not found' })

    const newTask = new Task({
      title,
      description,
      priority,
      tags,
      start: start ? new Date(start) : null,
      end: end ? new Date(end) : null,
      estimated_duration,
      completed: false,
      attachments: [],
    })

    await newTask.save()

    if(!taskList.tasks.includes(newTask._id)) taskList.tasks.push(newTask._id)

    await taskList.save()

    res.status(201).json({
      message: 'Task created successfully',
      data: newTask,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error creating task',
      error: error.message,
    })
  }
}

export const getTasksByTaskList = async (req, res) => {
  try 
  {
    const { taskListId } = req.params
    const { sort = '-created', filter } = req.query

    const taskList = await TaskList.findOne({
      _id: taskListId,
      creator: req.userId,
    })

    if(!taskList) return res.status(404).json({ message: 'Task list not found' })

    let query = Task.find({ _id: { $in: taskList.tasks } })

    if(filter === 'completed') query = query.where('completed', true)
    else if(filter === 'pending') query = query.where('completed', false)

    const tasks = await query.sort(sort)

    res.status(200).json({
      message: 'Tasks retrieved successfully',
      data: tasks,
      count: tasks.length,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving tasks',
      error: error.message,
    })
  }
}

// READ
export const getTaskById = async (req, res) => {
  try 
  {
    const { taskId } = req.params

    const task = await Task.findById(taskId)

    if(!task) return res.status(404).json({ message: 'Task not found' })

    res.status(200).json({
      message: 'Task retrieved successfully',
      data: task,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving task',
      error: error.message,
    })
  }
}

// UPDATE
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const {
      title,
      description,
      priority,
      tags,
      start,
      end,
      estimated_duration,
      actual_duration,
      completed,
    } = req.body

    const task = await Task.findById(taskId)

    if(!task) return res.status(404).json({ message: 'Task not found' })

    const updates = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(priority && { priority }),
      ...(tags && { tags }),
      ...(start && { start: new Date(start) }),
      ...(end && { end: new Date(end) }),
      ...(estimated_duration !== undefined && { estimated_duration }),
      ...(actual_duration !== undefined && { actual_duration }),
      ...(completed !== undefined && { completed }),
      updated: new Date(),
    }

    Object.assign(task, updates)
    await task.save()

    res.status(200).json({
      message: 'Task updated successfully',
      data: task,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error updating task',
      error: error.message,
    })
  }
}

// DELETE
export const deleteTask = async (req, res) => {
  try 
  {
    const { taskListId, taskId } = req.params

    const taskList = await TaskList.findOne({
      _id: taskListId,
      creator: req.userId,
    })

    if(!taskList) return res.status(404).json({ message: 'Task list not found' })

    const task = await Task.findById(taskId)

    if(!task) return res.status(404).json({ message: 'Task not found' })

    taskList.tasks = taskList.tasks.filter(
      (task) => task.toString() !== taskId.toString()
    )
    await taskList.save()

    await Task.deleteOne({ _id: taskId })

    res.status(200).json({
      message: 'Task deleted successfully',
      data: { id: taskId },
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error deleting task',
      error: error.message,
    })
  }
}

// PATCH
export const toggleTaskCompletion = async (req, res) => {
  try 
  {
    const { taskId } = req.params

    const task = await Task.findById(taskId)

    if(!task) return res.status(404).json({ message: 'Task not found' })

    task.completed = !task.completed
    task.updated = new Date()
    await task.save()

    res.status(200).json({
      message: 'Task completion toggled successfully',
      data: task,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error toggling task completion',
      error: error.message,
    })
  }
}

// PATCH
export const addTagToTask = async (req, res) => {
  try 
  {
    const { taskId } = req.params
    const { tag } = req.body

    const task = await Task.findById(taskId)

    if(!task) return res.status(404).json({ message: 'Task not found' })

    if(!task.tags.includes(tag)) task.tags.push(tag)

    await task.save()

    res.status(200).json({
      message: 'Tag added successfully',
      data: task,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error adding tag',
      error: error.message,
    })
  }
}

// PATCH
export const removeTagFromTask = async (req, res) => {
  try 
  {
    const { taskId } = req.params
    const { tag } = req.body

    const task = await Task.findById(taskId)

    if(!task) return res.status(404).json({ message: 'Task not found' })

    task.tags = task.tags.filter((t) => t !== tag)
    await task.save()

    res.status(200).json({
      message: 'Tag removed successfully',
      data: task,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error removing tag',
      error: error.message,
    })
  }
}

// GET
export const getOverdueTasks = async (req, res) => {
  try 
  {
    const tasks = await Task.find({
      completed: false,
      end: { $lt: new Date() },
    }).sort({ end: 1 })

    res.status(200).json({
      message: 'Overdue tasks retrieved successfully',
      data: tasks,
      count: tasks.length,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving overdue tasks',
      error: error.message,
    })
  }
}

// GET
export const getTodayTasks = async (req, res) => {
  try 
  {
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

    res.status(200).json({
      message: 'Today\'s tasks retrieved successfully',
      data: tasks,
      count: tasks.length,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving today\'s tasks',
      error: error.message,
    })
  }
}

// GET
export const getUpcomingTasks = async (req, res) => {
  try 
  {
    const { days = 7 } = req.query
    const now = new Date()
    const future = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000)

    const tasks = await Task.find({
      completed: false,
      end: { $gte: now, $lte: future },
    }).sort({ end: 1 })

    res.status(200).json({
      message: 'Upcoming tasks retrieved successfully',
      data: tasks,
      count: tasks.length,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving upcoming tasks',
      error: error.message,
    })
  }
}