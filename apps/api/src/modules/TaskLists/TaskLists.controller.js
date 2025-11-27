import { TaskList } from '../../models/TaskList.js'
import { Task } from '../../models/Task.js'

// CREATE
export const createTaskList = async (req, res) => {
  try 
  {
    const { name, description } = req.body
    const creator = req.userId

    const newTaskList = new TaskList({
      name,
      description,
      creator,
      tasks: [],
    })

    await newTaskList.save()
    await newTaskList.populate('creator', 'username email')

    res.status(201).json({
      message: 'Task list created successfully',
      data: newTaskList,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error creating task list',
      error: error.message,
    })
  }
}

// READ
export const getAllTaskLists = async (req, res) => {
  try 
  {
    const creator = req.userId
    const { populate = false } = req.query

    let query = TaskList.find({ creator }).populate('creator', 'username email')

    if(populate === 'true') 
        {
      query = query.populate({
        path: 'tasks',
        options: { sort: { created: -1 } },
      })
    }

    const taskLists = await query.sort({ created: -1 })

    res.status(200).json({
      message: 'Task lists retrieved successfully',
      data: taskLists,
      count: taskLists.length,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving task lists',
      error: error.message,
    })
  }
}

// READ
export const getTaskListById = async (req, res) => {
  try 
  {
    const { id } = req.params
    const creator = req.userId

    const taskList = await TaskList.findOne({ _id: id, creator })
      .populate('creator', 'username email')
      .populate({
        path: 'tasks',
        options: { sort: { created: -1 } },
      })

    if(!taskList) return res.status(404).json({ message: 'Task list not found' })

    res.status(200).json({
      message: 'Task list retrieved successfully',
      data: taskList,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving task list',
      error: error.message,
    })
  }
}

// UPDATE
export const updateTaskList = async (req, res) => {
  try 
  {
    const { id } = req.params
    const { name, description } = req.body
    const creator = req.userId

    const taskList = await TaskList.findOne({ _id: id, creator })

    if(!taskList) return res.status(404).json({ message: 'Task list not found' })

    if(name) taskList.name = name
    if(description !== undefined) taskList.description = description

    await taskList.save()
    await taskList.populate('creator', 'username email')
    await taskList.populate({
      path: 'tasks',
      options: { sort: { created: -1 } },
    })

    res.status(200).json({
      message: 'Task list updated successfully',
      data: taskList,
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error updating task list',
      error: error.message,
    })
  }
}

// DELETE
export const deleteTaskList = async (req, res) => {
  try 
  {
    const { id } = req.params
    const creator = req.userId

    const taskList = await TaskList.findOne({ _id: id, creator })

    if(!taskList) return res.status(404).json({ message: 'Task list not found' })

    if(taskList.tasks && taskList.tasks.length > 0) await Task.deleteMany({ _id: { $in: taskList.tasks } })

    await TaskList.deleteOne({ _id: id })

    res.status(200).json({
      message: 'Task list deleted successfully',
      data: { id },
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error deleting task list',
      error: error.message,
    })
  }
}

// GET
export const getTaskListStatistics = async (req, res) => {
  try 
  {
    const { id } = req.params
    const creator = req.userId

    const taskList = await TaskList.findOne({ _id: id, creator }).populate('tasks')

    if(!taskList) return res.status(404).json({ message: 'Task list not found' })

    const now = new Date()
    const stats = {
      total: taskList.tasks.length,
      completed: 0,
      pending: 0,
      overdue: 0,
    }

    // @ts-ignore
    taskList.tasks.forEach((task) => {
      // @ts-ignore
      if(task.completed) stats.completed++
      else 
        {
        stats.pending++
        // @ts-ignore
        if(task.end && task.end < now) stats.overdue++
      }
    })

    res.status(200).json({
      message: 'Task list statistics retrieved successfully',
      data: {
        taskListId: id,
        ...stats,
      },
    })
  } catch (error) 
  {
    res.status(500).json({
      message: 'Error retrieving statistics',
      error: error.message,
    })
  }
}