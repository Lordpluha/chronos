import { z } from 'zod'

// СREATE
export const createTaskListSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
})

// UPDATE
export const updateTaskListSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
})

// GET BY ID
export const taskListParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid task list ID'),
})

// GET ALL
export const getAllTaskListsSchema = z.object({
  populate: z.enum(['true', 'false']).optional(),
})
