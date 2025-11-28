import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must be at most 300 characters'),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .nullable(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium'),
  tags: z
    .array(z.string().max(50, 'Tag must be at most 50 characters'))
    .default([]),
  start: z.string().datetime().optional().nullable(),
  end: z.string().datetime().optional().nullable(),
  estimated_duration: z
    .number()
    .min(0, 'Estimated duration must be positive')
    .optional(),
})

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must be at most 300 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .nullable(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be at most 50 characters'))
    .optional(),
  start: z.string().datetime().optional().nullable(),
  end: z.string().datetime().optional().nullable(),
  estimated_duration: z
    .number()
    .min(0, 'Estimated duration must be positive')
    .optional(),
  actual_duration: z
    .number()
    .min(0, 'Actual duration must be positive')
    .optional(),
  completed: z.boolean().optional(),
})

export const taskParamsSchema = z.object({
  taskId: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid task ID'),
  taskListId: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid task list ID'),
})

export const getTasksSchema = z.object({
  sort: z.string().default('-created'),
  filter: z.enum(['completed', 'pending']).optional(),
})

export const tagSchema = z.object({
  tag: z
    .string()
    .min(1, 'Tag is required')
    .max(50, 'Tag must be at most 50 characters'),
})

export const upcomingTasksSchema = z.object({
  days: z.string().default('7').transform(Number),
})
