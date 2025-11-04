import rateLimit from 'express-rate-limit'
import nodemailer from 'nodemailer'
import { DateTimeUtils } from '../utils/index.js'
import { logConfiguration } from './logger/ConfigLogger.js'
import { ConfigValidator } from './validator/ConfigValidator.js'

/**
 * Рефакторенный класс конфигурации приложения
 * Использует модульную архитектуру для лучшей читаемости и тестируемости
 */
class AppConfigClass {
  #config
  #validator
  #emailTransporter

  constructor() {
    this.env = process.env.NODE_ENV || 'development'
    this.isProduction = this.env === 'production'
    this.isDevelopment = this.env === 'development'
    this.isTest = this.env === 'test'

    // Инициализируем валидатор
    this.#validator = new ConfigValidator()

    // Загружаем и валидируем конфигурацию
    this.#config = this.#loadAndValidateConfig()

    // Логируем конфигурацию (без секретов)
    if (!this.isTest) {
      logConfiguration(this.#config, this.env)
    }
  }

  /**
   * Загружает и валидирует конфигурацию
   * @private
   */
  #loadAndValidateConfig() {
    const result = this.#validator.validateAll()

    if (!result.success) {
      process.exit(1)
    }

    return result.config
  }

  // =============================================================================
  // СЕКЦИЯ: ПРИЛОЖЕНИЕ
  // =============================================================================

  get PORT() {
    return this.#config.app.BACK_PORT
  }

  get HOST() {
    return this.#config.app.BACK_HOST
  }

  get FRONT_HOST() {
    return this.#config.app.FRONT_HOST
  }

  get FRONT_PORT() {
    return this.#config.app.FRONT_PORT
  }

  get FRONT_URL() {
    const protocol = this.isProduction ? 'https' : 'http'
    return `${protocol}://${this.FRONT_HOST}:${this.FRONT_PORT}`
  }

  get BACK_URL() {
    const protocol = this.isProduction ? 'https' : 'http'
    return `${protocol}://${this.HOST}:${this.PORT}`
  }

  // =============================================================================
  // СЕКЦИЯ: БАЗА ДАННЫХ
  // =============================================================================

  get MONGO_URI() {
    return this.#config.database.MONGODB_URI
  }

  get DB_NAME() {
    return this.#config.database.DB_NAME
  }

  get MONGO_OPTIONS() {
    return {
      maxPoolSize: this.isProduction ? 5 : 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      // TLS for Atlas (correct options for Mongoose 6+)
      tls: true,
    }
  }

  // =============================================================================
  // СЕКЦИЯ: JWT И АУТЕНТИФИКАЦИЯ
  // =============================================================================

  get JWT_SECRET() {
    return this.#config.jwt.JWT_SECRET
  }

  get ACCESS_TOKEN_LIFETIME() {
    return this.#config.jwt.ACCESS_TOKEN_LIFETIME
  }

  get REFRESH_TOKEN_LIFETIME() {
    return this.#config.jwt.REFRESH_TOKEN_LIFETIME
  }

  get ACCESS_TOKEN_NAME() {
    return this.#config.jwt.ACCESS_TOKEN_NAME
  }

  get REFRESH_TOKEN_NAME() {
    return this.#config.jwt.REFRESH_TOKEN_NAME
  }

  // =============================================================================
  // СЕКЦИЯ: EMAIL
  // =============================================================================

  get SMTP_HOST() {
    return this.#config.email.SMTP_HOST
  }

  get SMTP_PORT() {
    return this.#config.email.SMTP_PORT
  }

  get SMTP_USER() {
    return this.#config.email.SMTP_USER
  }

  get SMTP_PASS() {
    return this.#config.email.SMTP_PASS
  }

  get CODE_LIFETIME() {
    return this.#config.email.CODE_LIFETIME
  }

  // =============================================================================
  // СЕКЦИЯ: OAUTH
  // =============================================================================

  get OAUTH_CLIENT_ID() {
    return this.#config.oauth.OAUTH_CLIENT_ID
  }

  get OAUTH_CLIENT_SECRET() {
    return this.#config.oauth.OAUTH_CLIENT_SECRET
  }

  get GOOGLE_CALLBACK_URL() {
    return this.#config.oauth.GOOGLE_CALLBACK_URL
  }

  // =============================================================================
  // СЕРВИСЫ И ФАБРИКИ
  // =============================================================================

  /**
   * Получает настроенный email транспорт (lazy initialization)
   */
  get emailTransporter() {
    if (!this.#emailTransporter) {
      this.#emailTransporter = nodemailer.createTransport({
        host: this.SMTP_HOST,
        port: this.SMTP_PORT,
        auth: {
          user: this.SMTP_USER,
          pass: this.SMTP_PASS,
        },
      })
    }
    return this.#emailTransporter
  }

  get emailFrom() {
    return '"Chronos" <support@chronos.com>'
  }

  /**
   * Вычисляет время жизни cookie для токенов
   */
  get cookieAccessMaxAge() {
    return DateTimeUtils.parseDurationToMs(this.ACCESS_TOKEN_LIFETIME)
  }

  get cookieRefreshMaxAge() {
    return DateTimeUtils.parseDurationToMs(this.REFRESH_TOKEN_LIFETIME)
  }

  /**
   * Генерирует настройки cookie для токенов
   */
  getCookieOptions(type) {
    return {
      httpOnly: type !== 'access',
      secure: this.env === 'production',
      sameSite: 'lax',
      maxAge:
        type === 'access' ? this.cookieAccessMaxAge : this.cookieRefreshMaxAge,
    }
  }

  // =============================================================================
  // СЕКЦИЯ: RATE LIMITING
  // =============================================================================

  /**
   * Конфигурации Rate Limiting
   */
  get rateLimitConfig() {
    return {
      // Общий лимит для всех запросов
      general: {
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 10000, // максимум 100 запросов с одного IP за окно
        message: {
          error: 'Too many requests from this IP',
          message: 'Please try again later',
          retryAfter: '15 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
      },

      // Лимит для аутентификации
      auth: {
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 10, // максимум 10 попыток аутентификации с одного IP за окно
        message: {
          error: 'Too many authentication attempts',
          message: 'Please try again later',
          retryAfter: '15 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Не засчитывать успешные запросы
      },

      // Лимит для операций создания
      create: {
        windowMs: 60 * 60 * 1000, // 1 час
        max: 20, // максимум 20 операций создания с одного IP за час
        message: {
          error: 'Too many create operations',
          message: 'Please try again later',
          retryAfter: '1 hour',
        },
        standardHeaders: true,
        legacyHeaders: false,
      },

      // Лимит для сброса пароля
      passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 час
        max: 3, // максимум 3 запроса на сброс пароля с одного IP за час
        message: {
          error: 'Too many password reset attempts',
          message: 'Please try again later',
          retryAfter: '1 hour',
        },
        standardHeaders: true,
        legacyHeaders: false,
      },

      // Лимит для загрузки файлов
      upload: {
        windowMs: 60 * 60 * 1000, // 1 час
        max: 10, // максимум 10 загрузок с одного IP за час
        message: {
          error: 'Too many file uploads',
          message: 'Please try again later',
          retryAfter: '1 hour',
        },
        standardHeaders: true,
        legacyHeaders: false,
      },

      // Лимит для поиска
      search: {
        windowMs: 5 * 60 * 1000, // 5 минут
        max: 30, // максимум 30 поисковых запросов с одного IP за 5 минут
        message: {
          error: 'Too many search requests',
          message: 'Please try again later',
          retryAfter: '5 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
      },

      // Строгий лимит для критичных операций
      strict: {
        windowMs: 24 * 60 * 60 * 1000, // 24 часа
        max: 5, // максимум 5 запросов с одного IP за день
        message: {
          error: 'Daily limit exceeded for this operation',
          message: 'Please try again tomorrow',
          retryAfter: '24 hours',
        },
        standardHeaders: true,
        legacyHeaders: false,
      },
    }
  }

  /**
   * Создает rate limiter для указанного типа
   */
  createRateLimiter(type) {
    const config = this.rateLimitConfig[type]
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`)
    }
    return rateLimit(config)
  }

  /**
   * Фабричные методы для создания лимитеров
   */
  get limiters() {
    return {
      general: () => this.createRateLimiter('general'),
      auth: () => this.createRateLimiter('auth'),
      create: () => this.createRateLimiter('create'),
      passwordReset: () => this.createRateLimiter('passwordReset'),
      upload: () => this.createRateLimiter('upload'),
      search: () => this.createRateLimiter('search'),
      strict: () => this.createRateLimiter('strict'),
    }
  }

  // Legacy методы для обратной совместимости
  createGeneralLimiter() {
    return this.createRateLimiter('general')
  }

  createAuthLimiter() {
    return this.createRateLimiter('auth')
  }

  createCreateLimiter() {
    return this.createRateLimiter('create')
  }

  createPasswordResetLimiter() {
    return this.createRateLimiter('passwordReset')
  }

  createUploadLimiter() {
    return this.createRateLimiter('upload')
  }

  createSearchLimiter() {
    return this.createRateLimiter('search')
  }

  createStrictLimiter() {
    return this.createRateLimiter('strict')
  }

  /**
   * Middleware для условного применения лимитов
   */
  conditionalLimiter(limiter, condition) {
    return (req, res, next) => {
      if (condition(req)) {
        return limiter(req, res, next)
      }
      next()
    }
  }

  /**
   * Кастомный обработчик для логирования превышений лимитов
   */
  rateLimitLogger(req, res, next) {
    const originalSend = res.send

    res.send = function (data) {
      // Проверяем, является ли ответ rate limit ошибкой
      if (res.statusCode === 429) {
        console.warn(
          `[RATE_LIMIT] ${new Date().toISOString()} - IP: ${req.ip} - ${req.method} ${req.path} - User-Agent: ${req.get('User-Agent')}`,
        )
      }

      return originalSend.call(this, data)
    }

    next()
  }

  // =============================================================================
  // УТИЛИТНЫЕ МЕТОДЫ И ВАЛИДАЦИЯ
  // =============================================================================

  /**
   * Валидирует конкретную переменную окружения
   */
  validateEnvVar(name, value, schema) {
    return this.#validator.validateEnvVar(name, value, schema)
  }

  /**
   * Валидирует обязательные переменные окружения
   */
  validateRequired(requiredVars) {
    const missing = requiredVars.filter((varName) => !process.env[varName])
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      )
    }
  }

  /**
   * Проверяет наличие переменной окружения
   */
  hasEnv(name) {
    return process.env[name] !== undefined && process.env[name] !== ''
  }

  /**
   * Возвращает сводку конфигурации (для отладки)
   */
  getSummary() {
    return {
      environment: this.env,
      backend: `${this.HOST}:${this.PORT}`,
      frontend: `${this.FRONT_HOST}:${this.FRONT_PORT}`,
      database: this.DB_NAME,
      hasJwtSecret: !!this.JWT_SECRET,
      hasSmtpConfig: !!(this.SMTP_HOST && this.SMTP_USER),
      hasOauthConfig: !!(this.OAUTH_CLIENT_ID && this.OAUTH_CLIENT_SECRET),
    }
  }

  /**
   * Возвращает конфигурацию для конкретного окружения
   */
  getEnvironmentConfig() {
    return {
      enableCors: !this.isProduction,
      enableSwagger: this.isDevelopment,
      rateLimitEnabled: this.isProduction,
    }
  }
}

export const AppConfig = new AppConfigClass()
