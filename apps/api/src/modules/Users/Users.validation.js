import { z } from 'zod'

export const updateProfileSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .max(100, 'Full name must not exceed 100 characters')
      .optional(),
    email: z
      .email('Invalid email format')
      .trim()
      .toLowerCase()
      .optional(),
    login: z
      .string()
      .trim()
      .min(3, 'Login must be at least 3 characters long')
      .max(30, 'Login must not exceed 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Login can only contain alphanumeric characters, underscores, and hyphens',
      )
      .optional(),
    avatar: z
      .url('Avatar must be a valid URL')
      .nullable()
      .optional()
      .or(z.literal('')),
    currentPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .optional(),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .optional(),
  })
  .refine(
    (data) => {
      // Если указан новый пароль, требуем текущий пароль
      if (data.newPassword && !data.currentPassword) {
        return false
      }
      return true
    },
    {
      message: 'Current password is required when setting a new password',
      path: ['currentPassword'],
    },
  )
