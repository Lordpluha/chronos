import { z } from 'zod'

/**
 * Создает общие схемы валидации
 */
function createCommonSchemas() {
  return {
    portSchema: z
      .string()
      .regex(/^\d+$/, 'Port must be a number')
      .transform(Number)
      .refine((port) => port >= 1000 && port <= 65535, {
        message: 'Port must be between 1000 and 65535',
      }),

    lifetimeSchema: z
      .string()
      .regex(/^\d+[smhd]$/, 'Invalid lifetime format (e.g., 15m, 1h, 7d)'),

    urlSchema: z.string().url('Must be a valid URL'),

    emailSchema: z.string().email('Must be a valid email address'),

    secretSchema: z
      .string()
      .min(32, 'Secret must be at least 32 characters long'),
  }
}

/**
 * Схема для настроек приложения
 */
export function getAppSchema() {
  const { portSchema } = createCommonSchemas()

  return z.object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    BACK_PORT: portSchema.default(3001),
    BACK_HOST: z
      .string()
      .min(1, 'Backend host is required')
      .default('localhost'),
    FRONT_HOST: z
      .string()
      .min(1, 'Frontend host is required')
      .default('localhost'),
    FRONT_PORT: portSchema.default(3000),
  })
}

/**
 * Схема для настроек базы данных
 */
export function getDatabaseSchema() {
  const { urlSchema } = createCommonSchemas()

  return z.object({
    MONGODB_URI: urlSchema,
    DB_NAME: z
      .string()
      .min(1, 'Database name is required')
      .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Invalid database name format')
      .default('chronos'),
  })
}

/**
 * Схема для JWT настроек
 */
export function getJwtSchema() {
  const { secretSchema, lifetimeSchema } = createCommonSchemas()

  return z.object({
    JWT_SECRET: secretSchema,
    ACCESS_TOKEN_LIFETIME: lifetimeSchema.default('15m'),
    REFRESH_TOKEN_LIFETIME: lifetimeSchema.default('7d'),
    ACCESS_TOKEN_NAME: z
      .string()
      .min(1, 'Access token name is required')
      .default('access_token'),
    REFRESH_TOKEN_NAME: z
      .string()
      .min(1, 'Refresh token name is required')
      .default('refresh_token'),
  })
}

/**
 * Схема для email настроек
 */
export function getEmailSchema() {
  const { lifetimeSchema } = createCommonSchemas()

  // Специальная схема для SMTP портов (может быть меньше 1000)
  const smtpPortSchema = z
    .string()
    .regex(/^\d+$/, 'SMTP port must be a number')
    .transform(Number)
    .refine((port) => port >= 25 && port <= 65535, {
      message: 'SMTP port must be between 25 and 65535',
    })

  return z.object({
    SMTP_HOST: z.string().min(1, 'SMTP host is required'),
    SMTP_PORT: smtpPortSchema,
    SMTP_USER: z.string().min(1, 'SMTP password is required'),
    SMTP_PASS: z.string().min(1, 'SMTP password is required'),
    CODE_LIFETIME: lifetimeSchema.default('15m'),
  })
}

/**
 * Схема для OAuth настроек
 */
export function getOAuthSchema() {
  const { urlSchema } = createCommonSchemas()

  return z.object({
    OAUTH_CLIENT_ID: z.string().min(1, 'OAuth client ID is required'),
    OAUTH_CLIENT_SECRET: z.string().min(1, 'OAuth client secret is required'),
    GOOGLE_CALLBACK_URL: urlSchema,
  })
}

/**
 * Получает все схемы валидации
 */
export function getAllSchemas() {
  return {
    app: getAppSchema(),
    database: getDatabaseSchema(),
    jwt: getJwtSchema(),
    email: getEmailSchema(),
    oauth: getOAuthSchema(),
  }
}
