import type { z } from 'zod'
import type { AllSchemas } from '../schemas/ConfigSchemas'
import type { Configuration } from '../index'

// =============================================================================
// ТИПЫ РЕЗУЛЬТАТОВ ВАЛИДАЦИИ
// =============================================================================

/**
 * Результат валидации одной категории конфигурации
 *
 * @template T - Тип данных валидированной конфигурации
 */
export interface CategoryValidationResult<T = unknown> {
  /** Успешность валидации */
  success: boolean

  /** Валидированные данные (null при ошибке) */
  data: T | null

  /** Массив сообщений об ошибках */
  errors: string[]
}

/**
 * Результат валидации всей конфигурации приложения
 */
export interface ValidationResult {
  /** Успешность валидации всех категорий */
  success: boolean

  /** Полная валидированная конфигурация (null при ошибках) */
  config: Configuration | null

  /** Массив всех сообщений об ошибках из всех категорий */
  errors: string[]
}

// =============================================================================
// КЛАСС ВАЛИДАТОРА
// =============================================================================

/**
 * Валидатор конфигурации приложения
 *
 * Использует Zod схемы для валидации переменных окружения.
 * Проверяет все категории конфигурации: app, database, jwt, email, oauth.
 *
 * @example
 * Базовое использование:
 * ```typescript
 * import { ConfigValidator } from './validator/ConfigValidator'
 *
 * const validator = new ConfigValidator()
 * const result = validator.validateAll()
 *
 * if (!result.success) {
 *   console.error('Validation errors:', result.errors)
 *   process.exit(1)
 * }
 *
 * // Использование валидированной конфигурации
 * const config = result.config
 * console.log('Database:', config.database.MONGODB_URI)
 * ```
 *
 * @example
 * Валидация с кастомными переменными окружения:
 * ```typescript
 * const customEnv = {
 *   NODE_ENV: 'production',
 *   BACK_PORT: '8080',
 *   MONGODB_URI: 'mongodb://localhost:27017'
 * }
 *
 * const validator = new ConfigValidator()
 * const result = validator.validateAll(customEnv)
 * ```
 *
 * @example
 * Валидация отдельной категории:
 * ```typescript
 * import { getAppSchema } from '../schemas/ConfigSchemas'
 *
 * const validator = new ConfigValidator()
 * const result = validator.validateCategory('app', getAppSchema())
 *
 * if (result.success) {
 *   console.log('App config:', result.data)
 * }
 * ```
 */
export declare class ConfigValidator {
  /** Схемы валидации для всех категорий конфигурации */
  readonly schemas: AllSchemas

  /**
   * Создает экземпляр валидатора конфигурации
   *
   * @param schemas - Схемы валидации (по умолчанию используются все схемы из getAllSchemas())
   *
   * @example
   * ```typescript
   * // С дефолтными схемами
   * const validator = new ConfigValidator()
   *
   * // С кастомными схемами
   * import { getAllSchemas } from '../schemas/ConfigSchemas'
   * const customSchemas = {
   *   ...getAllSchemas(),
   *   app: myCustomAppSchema
   * }
   * const validator = new ConfigValidator(customSchemas)
   * ```
   */
  constructor(schemas?: AllSchemas)

  /**
   * Форматирует ошибки валидации Zod в читаемый формат
   *
   * @param category - Категория конфигурации (app, database, jwt, email, oauth)
   * @param zodError - Ошибка валидации Zod
   * @returns Массив отформатированных сообщений об ошибках
   *
   * @example
   * ```typescript
   * try {
   *   schema.parse(data)
   * } catch (error) {
   *   if (error instanceof z.ZodError) {
   *     const errors = validator.formatValidationErrors('app', error)
   *     // errors: ['[APP] BACK_PORT: Port must be between 1000 and 65535']
   *   }
   * }
   * ```
   */
  formatValidationErrors(category: string, zodError: z.ZodError): string[]

  /**
   * Валидирует одну категорию конфигурации
   *
   * @param category - Название категории для логирования
   * @param schema - Zod схема для валидации
   * @param envVars - Переменные окружения (по умолчанию process.env)
   * @returns Результат валидации с данными или ошибками
   *
   * @example
   * ```typescript
   * import { getAppSchema } from '../schemas/ConfigSchemas'
   *
   * const validator = new ConfigValidator()
   * const result = validator.validateCategory('app', getAppSchema())
   *
   * if (result.success) {
   *   console.log('Backend port:', result.data.BACK_PORT)
   * } else {
   *   console.error('Errors:', result.errors)
   * }
   * ```
   */
  validateCategory<T = unknown>(
    category: string,
    schema: z.ZodSchema<T>,
    envVars?: Record<string, string | undefined>,
  ): CategoryValidationResult<T>

  /**
   * Валидирует все категории конфигурации
   *
   * Проходит по всем схемам и валидирует каждую категорию.
   * При наличии ошибок в любой категории возвращает success: false.
   *
   * @param envVars - Переменные окружения (по умолчанию process.env)
   * @returns Результат валидации всех категорий
   *
   * @example
   * Основной сценарий использования:
   * ```typescript
   * const validator = new ConfigValidator()
   * const result = validator.validateAll()
   *
   * if (result.success) {
   *   console.log('Configuration is valid')
   *   console.log('Config:', result.config)
   * } else {
   *   console.error('Validation failed:', result.errors)
   *   process.exit(1)
   * }
   * ```
   *
   * @example
   * Валидация с кастомными переменными:
   * ```typescript
   * const testEnv = { NODE_ENV: 'test', BACK_PORT: '3001' }
   * const result = validator.validateAll(testEnv)
   * ```
   */
  validateAll(
    envVars?: Record<string, string | undefined>,
  ): ValidationResult

  /**
   * Валидирует конкретную переменную окружения
   *
   * Полезно для валидации отдельных переменных вне контекста категорий.
   *
   * @param name - Имя переменной для сообщений об ошибках
   * @param value - Значение переменной
   * @param schema - Zod схема для валидации
   * @returns Валидированное и преобразованное значение
   * @throws Error если валидация не прошла
   *
   * @example
   * ```typescript
   * import { z } from 'zod'
   *
   * const validator = new ConfigValidator()
   *
   * // Валидация порта
   * const portSchema = z.string().regex(/^\d+$/).transform(Number)
   * const port = validator.validateEnvVar('PORT', process.env.PORT, portSchema)
   * // port: number
   *
   * // Валидация с ошибкой
   * try {
   *   const invalid = validator.validateEnvVar('PORT', 'invalid', portSchema)
   * } catch (error) {
   *   console.error(error.message)
   *   // "Environment variable PORT: Validation failed"
   * }
   * ```
   */
  validateEnvVar<T>(
    name: string,
    value: string | undefined,
    schema: z.ZodSchema<T>,
  ): T

  /**
   * Проверяет наличие всех обязательных переменных окружения
   *
   * @param requiredVars - Массив имен обязательных переменных
   * @param envVars - Переменные окружения (по умолчанию process.env)
   * @returns true если все переменные установлены
   * @throws Error если какая-то переменная отсутствует
   *
   * @example
   * ```typescript
   * const validator = new ConfigValidator()
   *
   * // Проверка обязательных переменных
   * try {
   *   validator.validateRequired([
   *     'MONGODB_URI',
   *     'JWT_SECRET',
   *     'SMTP_HOST'
   *   ])
   *   console.log('All required variables are set')
   * } catch (error) {
   *   console.error(error.message)
   *   // "Missing required environment variables: JWT_SECRET, SMTP_HOST"
   *   process.exit(1)
   * }
   * ```
   *
   * @example
   * С кастомными переменными:
   * ```typescript
   * const customEnv = { MONGODB_URI: 'mongodb://localhost' }
   * validator.validateRequired(['MONGODB_URI', 'JWT_SECRET'], customEnv)
   * // Throws: Missing required environment variables: JWT_SECRET
   * ```
   */
  validateRequired(
    requiredVars: string[],
    envVars?: Record<string, string | undefined>,
  ): boolean
}
