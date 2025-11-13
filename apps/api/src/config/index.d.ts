import type { Request, Response, NextFunction } from 'express'
import type { RateLimitRequestHandler } from 'express-rate-limit'
import type { Transporter } from 'nodemailer'

// =============================================================================
// БАЗОВЫЕ ТИПЫ
// =============================================================================

/**
 * Окружение выполнения приложения
 */
export type Environment = 'development' | 'production' | 'test'

// =============================================================================
// КОНФИГУРАЦИИ ПО КАТЕГОРИЯМ
// =============================================================================

/**
 * Конфигурация приложения
 * Содержит настройки серверов и окружения
 */
export interface AppConfiguration {
  /** Окружение выполнения */
  NODE_ENV: Environment
  /** Порт backend сервера */
  BACK_PORT: number
  /** Хост backend сервера */
  BACK_HOST: string
  /** Хост frontend приложения */
  FRONT_HOST: string
  /** Порт frontend приложения */
  FRONT_PORT: number
}

/**
 * Конфигурация базы данных
 * Настройки подключения к MongoDB
 */
export interface DatabaseConfiguration {
  /** URI подключения к MongoDB */
  MONGODB_URI: string
  /** Имя базы данных */
  DB_NAME: string
}

/**
 * Конфигурация JWT токенов
 * Настройки для аутентификации и авторизации
 */
export interface JwtConfiguration {
  /** Секретный ключ для подписи токенов */
  JWT_SECRET: string
  /** Время жизни access токена (например, "15m") */
  ACCESS_TOKEN_LIFETIME: string
  /** Время жизни refresh токена (например, "7d") */
  REFRESH_TOKEN_LIFETIME: string
  /** Имя cookie для access токена */
  ACCESS_TOKEN_NAME: string
  /** Имя cookie для refresh токена */
  REFRESH_TOKEN_NAME: string
}

/**
 * Конфигурация Email
 * Настройки SMTP для отправки писем
 */
export interface EmailConfiguration {
  /** Хост SMTP сервера */
  SMTP_HOST: string
  /** Порт SMTP сервера */
  SMTP_PORT: number
  /** Имя пользователя SMTP */
  SMTP_USER: string
  /** Пароль SMTP */
  SMTP_PASS: string
  /** Время жизни кода подтверждения (например, "15m") */
  CODE_LIFETIME: string
}

/**
 * Конфигурация OAuth
 * Настройки для аутентификации через Google
 */
export interface OAuthConfiguration {
  /** Google OAuth Client ID */
  OAUTH_CLIENT_ID: string
  /** Google OAuth Client Secret */
  OAUTH_CLIENT_SECRET: string
  /** URL для callback Google OAuth */
  GOOGLE_CALLBACK_URL: string
}

/**
 * Полная конфигурация приложения
 * Объединяет все категории конфигурации
 */
export interface Configuration {
  app: AppConfiguration
  database: DatabaseConfiguration
  jwt: JwtConfiguration
  email: EmailConfiguration
  oauth: OAuthConfiguration
}

// =============================================================================
// ТИПЫ ДЛЯ COOKIE
// =============================================================================

/**
 * Настройки cookie для токенов
 */
export interface CookieOptions {
  /** HTTP-only флаг (для защиты от XSS) */
  httpOnly: boolean
  /** Secure флаг (только HTTPS) */
  secure: boolean
  /** SameSite политика */
  sameSite: 'lax' | 'strict' | 'none'
  /** Время жизни cookie в миллисекундах */
  maxAge: number
}

// =============================================================================
// ТИПЫ ДЛЯ RATE LIMITING
// =============================================================================

/**
 * Сообщение об ошибке rate limit
 */
export interface RateLimitMessage {
  /** Тип ошибки */
  error: string
  /** Сообщение пользователю */
  message: string
  /** Через сколько можно повторить запрос */
  retryAfter: string
}

/**
 * Конфигурация одного rate limiter
 */
export interface RateLimitConfiguration {
  /** Временное окно в миллисекундах */
  windowMs: number
  /** Максимальное количество запросов в окне */
  max: number
  /** Сообщение об ошибке */
  message: RateLimitMessage
  /** Использовать стандартные заголовки */
  standardHeaders: boolean
  /** Использовать legacy заголовки */
  legacyHeaders: boolean
  /** Не учитывать успешные запросы */
  skipSuccessfulRequests?: boolean
}

/**
 * Типы rate limiters
 */
export type RateLimitType =
  | 'general'      // Общий лимит для всех запросов
  | 'auth'         // Лимит для аутентификации
  | 'create'       // Лимит для операций создания
  | 'passwordReset' // Лимит для сброса пароля
  | 'upload'       // Лимит для загрузки файлов
  | 'search'       // Лимит для поиска
  | 'strict'       // Строгий лимит для критичных операций

/**
 * Все конфигурации rate limiters
 * Record, содержащий конфигурацию для каждого типа лимитера
 */
export type RateLimitConfigurations = Record<
  RateLimitType,
  RateLimitConfiguration
>

/**
 * Фабрики для создания rate limiters
 * Предоставляет удобный API для создания лимитеров
 */
export interface RateLimitersFactory {
  general: () => RateLimitRequestHandler
  auth: () => RateLimitRequestHandler
  create: () => RateLimitRequestHandler
  passwordReset: () => RateLimitRequestHandler
  upload: () => RateLimitRequestHandler
  search: () => RateLimitRequestHandler
  strict: () => RateLimitRequestHandler
}

// =============================================================================
// УТИЛИТНЫЕ ТИПЫ
// =============================================================================

/**
 * Краткая сводка конфигурации для отладки
 */
export interface ConfigurationSummary {
  environment: Environment
  backend: string
  frontend: string
  database: string
  hasJwtSecret: boolean
  hasSmtpConfig: boolean
  hasOauthConfig: boolean
}

/**
 * Конфигурация для конкретного окружения
 * Определяет, какие функции включены в текущем окружении
 */
export interface EnvironmentConfig {
  /** Включить CORS */
  enableCors: boolean
  /** Включить Swagger документацию */
  enableSwagger: boolean
  /** Включить rate limiting */
  rateLimitEnabled: boolean
}

/**
 * Класс конфигурации приложения
 * Singleton класс для управления конфигурацией приложения
 */
export declare class AppConfigClass {
  /** Текущее окружение приложения */
  readonly env: Environment

  /** Флаг production окружения */
  readonly isProduction: boolean

  /** Флаг development окружения */
  readonly isDevelopment: boolean

  /** Флаг test окружения */
  readonly isTest: boolean

  // =============================================================================
  // СЕКЦИЯ: ПРИЛОЖЕНИЕ
  // =============================================================================

  /** Порт backend сервера */
  readonly PORT: number

  /** Хост backend сервера */
  readonly HOST: string

  /** Хост frontend приложения */
  readonly FRONT_HOST: string

  /** Порт frontend приложения */
  readonly FRONT_PORT: number

  /** Полный URL frontend приложения */
  readonly FRONT_URL: string

  /** Полный URL backend API */
  readonly BACK_URL: string

  // =============================================================================
  // СЕКЦИЯ: БАЗА ДАННЫХ
  // =============================================================================

  /** URI подключения к MongoDB */
  readonly MONGO_URI: string

  /** Имя базы данных */
  readonly DB_NAME: string

  /** Опции подключения к MongoDB */
  readonly MONGO_OPTIONS: Record<string, unknown>

  // =============================================================================
  // СЕКЦИЯ: JWT И АУТЕНТИФИКАЦИЯ
  // =============================================================================

  /** Секретный ключ для JWT */
  readonly JWT_SECRET: string

  /** Время жизни access токена (например, "15m") */
  readonly ACCESS_TOKEN_LIFETIME: string

  /** Время жизни refresh токена (например, "7d") */
  readonly REFRESH_TOKEN_LIFETIME: string

  /** Имя cookie для access токена */
  readonly ACCESS_TOKEN_NAME: string

  /** Имя cookie для refresh токена */
  readonly REFRESH_TOKEN_NAME: string

  // =============================================================================
  // СЕКЦИЯ: EMAIL
  // =============================================================================

  /** Хост SMTP сервера */
  readonly SMTP_HOST: string

  /** Порт SMTP сервера */
  readonly SMTP_PORT: number

  /** Имя пользователя SMTP */
  readonly SMTP_USER: string

  /** Пароль SMTP */
  readonly SMTP_PASS: string

  /** Время жизни кода подтверждения (например, "15m") */
  readonly CODE_LIFETIME: string

  // =============================================================================
  // СЕКЦИЯ: OAUTH
  // =============================================================================

  /** Google OAuth Client ID */
  readonly OAUTH_CLIENT_ID: string

  /** Google OAuth Client Secret */
  readonly OAUTH_CLIENT_SECRET: string

  /** URL для callback Google OAuth */
  readonly GOOGLE_CALLBACK_URL: string

  // =============================================================================
  // СЕРВИСЫ И ФАБРИКИ
  // =============================================================================

  /** Транспорт для отправки email (nodemailer) */
  readonly emailTransporter: Transporter

  /** Email адрес отправителя */
  readonly emailFrom: string

  /** Время жизни access cookie в миллисекундах */
  readonly cookieAccessMaxAge: number

  /** Время жизни refresh cookie в миллисекундах */
  readonly cookieRefreshMaxAge: number

  /**
   * Получает настройки cookie для токенов
   * @param type - Тип токена ('access' или 'refresh')
   */
  getCookieOptions(type: 'access' | 'refresh'): CookieOptions

  // =============================================================================
  // СЕКЦИЯ: RATE LIMITING
  // =============================================================================

  /** Все конфигурации rate limiters */
  readonly rateLimitConfig: RateLimitConfigurations

  /**
   * Создает rate limiter для указанного типа
   * @param type - Тип rate limiter
   */
  createRateLimiter(type: RateLimitType): RateLimitRequestHandler

  /** Фабрики для создания различных типов rate limiters */
  readonly limiters: RateLimitersFactory

  // Legacy методы для обратной совместимости
  createGeneralLimiter(): RateLimitRequestHandler
  createAuthLimiter(): RateLimitRequestHandler
  createCreateLimiter(): RateLimitRequestHandler
  createPasswordResetLimiter(): RateLimitRequestHandler
  createUploadLimiter(): RateLimitRequestHandler
  createSearchLimiter(): RateLimitRequestHandler
  createStrictLimiter(): RateLimitRequestHandler

  /**
   * Middleware для условного применения лимитов
   * @param limiter - Rate limiter middleware
   * @param condition - Функция условия, которая определяет, применять ли limiter
   */
  conditionalLimiter(
    limiter: RateLimitRequestHandler,
    condition: (req: Request) => boolean,
  ): (req: Request, res: Response, next: NextFunction) => void

  /**
   * Middleware для логирования превышений лимитов
   */
  rateLimitLogger(req: Request, res: Response, next: NextFunction): void

  // =============================================================================
  // УТИЛИТНЫЕ МЕТОДЫ И ВАЛИДАЦИЯ
  // =============================================================================

  /**
   * Валидирует обязательные переменные окружения
   * @param requiredVars - Массив имен обязательных переменных
   * @throws Error если какая-то переменная отсутствует
   */
  validateRequired(requiredVars: string[]): void

  /**
   * Проверяет наличие переменной окружения
   * @param name - Имя переменной
   */
  hasEnv(name: string): boolean

  /**
   * Возвращает краткую сводку конфигурации
   */
  getSummary(): ConfigurationSummary

  /**
   * Возвращает конфигурацию для конкретного окружения
   */
  getEnvironmentConfig(): EnvironmentConfig
}

/**
 * Singleton экземпляр конфигурации приложения
 * Используется во всем приложении для доступа к настройкам
 *
 * @example
 * ```typescript
 * import { AppConfig } from './config'
 *
 * // Использование конфигурации
 * const port = AppConfig.PORT
 * const mongoUri = AppConfig.MONGO_URI
 *
 * // Создание rate limiter
 * const authLimiter = AppConfig.limiters.auth()
 *
 * // Отправка email
 * await AppConfig.emailTransporter.sendMail({
 *   to: 'user@example.com',
 *   subject: 'Test',
 *   text: 'Hello'
 * })
 * ```
 */
export declare const AppConfig: AppConfigClass
