import { z } from 'zod'

// Валидация для календаря
export const createCalendarSchema = z.object({
  title: z.string().trim().min(1).max(200, 'Title must not exceed 200 characters'),
  description: z.string().trim().max(1000, 'Description must not exceed 1000 characters').optional().nullable(),
  time_zone: z.string().trim().default('UTC'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code').default('#3b82f6'),
  visibility: z.enum(['private', 'public', 'shared']).default('private'),
  is_default: z.boolean().default(false),
})

export const updateCalendarSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  time_zone: z.string().trim().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  visibility: z.enum(['private', 'public', 'shared']).optional(),
  is_default: z.boolean().optional(),
})

export const shareCalendarSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
  permission: z.enum(['read', 'write', 'admin']).default('read'),
})

export const removeAccessSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
})

// Валидация для событий
export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(300, 'Title must not exceed 300 characters'),
  description: z.string().trim().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
  calendar_id: z.string().min(1, 'Calendar ID is required'),
  time_zone: z.string().trim().optional(),
  start: z.string().or(z.date()).transform((val) => new Date(val)),
  end: z.string().or(z.date()).transform((val) => new Date(val)),
  location: z.object({
    name: z.string().trim().max(500).optional(),
    address: z.string().trim().max(500).optional(),
    coordinates: z.object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
    }).optional(),
    url: z.string().url().max(1000).optional(),
  }).optional().nullable(),
  is_all_day: z.boolean().default(false),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  attendees: z.array(z.object({
    user: z.string().optional(),
    email: z.string().email().optional(),
    status: z.enum(['invited', 'accepted', 'declined', 'maybe']).default('invited'),
  })).optional(),
}).refine((data) => new Date(data.end) > new Date(data.start), {
  message: 'End date must be after start date',
  path: ['end'],
})

export const updateEventSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  time_zone: z.string().trim().optional(),
  start: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  end: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  location: z.object({
    name: z.string().trim().max(500).optional(),
    address: z.string().trim().max(500).optional(),
    coordinates: z.object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
    }).optional(),
    url: z.string().url().max(1000).optional(),
  }).optional().nullable(),
  is_all_day: z.boolean().optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
})

export const addAttendeeSchema = z.object({
  user_id: z.string().optional(),
  email: z.string().email().optional(),
}).refine((data) => data.user_id || data.email, {
  message: 'Either user_id or email is required',
  path: ['user_id'],
})

export const updateAttendeeStatusSchema = z.object({
  status: z.enum(['invited', 'accepted', 'declined', 'maybe']),
})

// Валидация для напоминаний
export const createReminderSchema = z.object({
  title: z.string().trim().min(1).max(300, 'Title must not exceed 300 characters'),
  description: z.string().trim().max(1000, 'Description must not exceed 1000 characters').optional().nullable(),
  calendar_id: z.string().min(1, 'Calendar ID is required'),
  time_zone: z.string().trim().optional(),
  start: z.string().or(z.date()).transform((val) => new Date(val)),
})

export const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  time_zone: z.string().trim().optional(),
  start: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
})
