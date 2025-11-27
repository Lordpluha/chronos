import { Router } from 'express'
import { AuthRouter } from './Auth/Auth.controller.js'
import { UsersRouter } from './Users/Users.controller.js'
import { taskListsRouter } from './TaskLists/routes.js'
import { tasksRouter } from './Tasks/routes.js'
import { CalendarsRouter } from './Calendars/Calendars.controller.js'

export const router = Router()

router.use('/', AuthRouter)
router.use('/', UsersRouter)
router.use('/task-lists', taskListsRouter)
router.use('/tasks', tasksRouter)
router.use('/', CalendarsRouter)
