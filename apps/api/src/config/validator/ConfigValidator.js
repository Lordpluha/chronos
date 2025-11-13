import { z } from 'zod'
import {
  logValidationErrors,
  logValidationSuccess,
} from '../logger/ConfigLogger.js'
import { getAllSchemas } from '../schemas/ConfigSchemas.js'

/**
 * Класс для валидации конфигурации
 */
export class ConfigValidator {
  constructor(schemas = getAllSchemas()) {
    this.schemas = schemas
  }

  /**
   * Форматирует ошибки валидации
   */
  formatValidationErrors(category, zodError) {
    const issues = zodError.issues || []
    return issues.map((error) => {
      const path = error.path?.join('.') || 'unknown'
      return `[${category.toUpperCase()}] ${path}: ${error.message}`
    })
  }

  /**
   * Валидирует одну категорию конфигурации
   */
  validateCategory(category, schema, envVars = process.env) {
    try {
      const result = schema.parse(envVars)
      logValidationSuccess(category)
      return { success: true, data: result, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const categoryErrors = this.formatValidationErrors(category, error)
        return { success: false, data: null, errors: categoryErrors }
      }

      const unexpectedError = `[${category.toUpperCase()}] Unexpected error: ${error.message}`
      return { success: false, data: null, errors: [unexpectedError] }
    }
  }

  /**
   * Валидирует все категории конфигурации
   */
  validateAll(envVars = process.env) {
    const config = {}
    const allErrors = []

    for (const [category, schema] of Object.entries(this.schemas)) {
      const result = this.validateCategory(category, schema, envVars)

      if (result.success) {
        config[category] = result.data
      } else {
        allErrors.push(...result.errors)
      }
    }

    if (allErrors.length > 0) {
      logValidationErrors(allErrors)
      return { success: false, config: null, errors: allErrors }
    }

    return { success: true, config, errors: [] }
  }

  /**
   * Валидирует конкретную переменную окружения
   */
  validateEnvVar(name, value, schema) {
    try {
      return schema.parse({ [name]: value })[name]
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues[0]?.message || 'Validation failed'
        throw new Error(`Environment variable ${name}: ${errorMessage}`)
      }
      throw error
    }
  }

  /**
   * Проверяет все ли обязательные переменные установлены
   */
  validateRequired(requiredVars, envVars = process.env) {
    const missing = requiredVars.filter((name) => !envVars[name])

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      )
    }

    return true
  }
}
