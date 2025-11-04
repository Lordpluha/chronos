import { z } from 'zod'

// Базовые схемы для повторного использования
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim()

const loginFieldSchema = z
  .string()
  .min(3, 'Login must be at least 3 characters long')
  .max(50, 'Login must be less than 50 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Login can only contain letters, numbers, underscore and dash',
  )
  .trim()

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  )

const codeSchema = z
  .string()
  .length(6, 'Reset code must be exactly 6 characters')

// TOTP схемы
const totpCodeSchema = z
  .string()
  .length(6, 'TOTP code must be exactly 6 digits')
  .regex(/^\d{6}$/, 'TOTP code must contain only digits')

// Схемы для различных операций
export const registerSchema = z.object({
  login: loginFieldSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  login: z
    .string()
    .min(1, 'Login or email is required')
    .max(255, 'Login or email must be less than 255 characters')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
})

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export const passwordResetSchema = z.object({
  password: passwordSchema,
})

export const resetCodeParamSchema = z.object({
  token: codeSchema,
})

// Дополнительные схемы для конкретных случаев
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Схема для обновления профиля (если понадобится)
export const updateProfileSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Full name is required')
      .max(100, 'Full name must be less than 100 characters')
      .trim()
      .optional(),
    email: emailSchema.optional(),
  })
  .strict() // strict() не позволяет передавать дополнительные поля

// 2FA схемы
export const setup2FASchema = z.object({
  password: z
    .string()
    .min(1, 'Current password is required')
    .max(128, 'Password must be less than 128 characters'),
})

export const enable2FASchema = z.object({
  token: totpCodeSchema,
  password: z
    .string()
    .min(1, 'Current password is required')
    .max(128, 'Password must be less than 128 characters'),
})

export const disable2FASchema = z.object({
  password: z
    .string()
    .min(1, 'Current password is required')
    .max(128, 'Password must be less than 128 characters'),
})

export const verify2FASchema = z.object({
  token: totpCodeSchema,
})

export const loginWith2FASchema = z.object({
  login: z
    .string()
    .min(1, 'Login or email is required')
    .max(255, 'Login or email must be less than 255 characters')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
  token: totpCodeSchema.optional(),
})

// Экспорт всех схем для удобства
export const AuthSchemas = {
  register: registerSchema,
  login: loginSchema,
  loginWith2FA: loginWith2FASchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  resetCodeParam: resetCodeParamSchema,
  changePassword: changePasswordSchema,
  updateProfile: updateProfileSchema,
  setup2FA: setup2FASchema,
  enable2FA: enable2FASchema,
  disable2FA: disable2FASchema,
  verify2FA: verify2FASchema,
}
