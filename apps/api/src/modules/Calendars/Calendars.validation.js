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
  permission: z.enum(['viewer', 'admin', 'owner', 'read', 'write']).default('viewer'), // Поддержка старых и новых значений
})

export const removeAccessSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
})

export const updateAccessSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
  permission: z.enum(['viewer', 'admin', 'owner', 'read', 'write']), // Поддержка старых и новых значений
})

// Валидация для событий
export const recurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(999).default(1),
  byWeekday: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
  byMonthDay: z.array(z.number().int().min(-31).max(31).refine(val => val !== 0)).optional(),
  byMonth: z.array(z.number().int().min(1).max(12)).optional(),
  count: z.number().int().min(1).max(999).optional(),
  until: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
}).refine((data) => {
  // Either count or until must be specified, but not both
  if (data.count && data.until) return false
  return true
}, {
  message: 'Specify either count or until, not both',
}).refine((data) => {
  // byWeekday is only valid for weekly frequency
  if (data.byWeekday && data.frequency !== 'weekly') return false
  return true
}, {
  message: 'byWeekday can only be used with weekly frequency',
}).refine((data) => {
  // byMonthDay is only valid for monthly/yearly frequency
  if (data.byMonthDay && !['monthly', 'yearly'].includes(data.frequency)) return false
  return true
}, {
  message: 'byMonthDay can only be used with monthly or yearly frequency',
})

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(300, 'Title must not exceed 300 characters'),
  description: z.string().trim().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
  calendar_id: z.string().min(1, 'Calendar ID is required'),
  time_zone: z.string().trim().optional(),
  start: z.string().or(z.date()).transform((val) => new Date(val)),
  end: z.string().or(z.date()).transform((val) => new Date(val)),
  label: z.enum(['indigo', 'gray', 'green', 'blue', 'red', 'purple']).default('indigo'),
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
  recurrence: recurrenceSchema.optional().nullable(),
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
  label: z.enum(['indigo', 'gray', 'green', 'blue', 'red', 'purple']).optional(),
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
  recurrence: recurrenceSchema.optional().nullable(),
  calendar_id: z.string().optional(), // Для перемещения события в другой календарь
})

export const addAttendeeSchema = z.object({
  user_id: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['owner', 'admin', 'viewer']).optional().default('viewer'),
})
// Removed refine - allow self-subscription when neither user_id nor email provided

export const updateAttendeeStatusSchema = z.object({
  status: z.enum(['invited', 'accepted', 'declined', 'maybe']),
})

export const updateAttendeeRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'viewer']),
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

export const shareReminderSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
  permission: z.enum(['read', 'write']).default('read'),
})

export const removeReminderAccessSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
})

