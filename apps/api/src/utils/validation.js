import { z } from 'zod'

// Middleware для валидации
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body)
      req.body = validatedData // Заменяем оригинальные данные валидированными
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        const errors = issues.map((err) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message || 'Validation error',
          code: err.code || 'invalid',
        }))

        return res.status(400).json({
          message: 'Validation failed',
          errors: errors,
          details: issues[0]?.message || 'Invalid input data',
        })
      }

      return res.status(500).json({
        message: 'Internal validation error',
        error: error.message,
      })
    }
  }
}
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.params)
      req.params = validatedData
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || []
        const errors = issues.map((err) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message || 'Parameter validation error',
          code: err.code || 'invalid',
        }))

        return res.status(400).json({
          message: 'Invalid URL parameters',
          errors: errors,
          details: issues[0]?.message || 'Invalid parameters',
        })
      }

      return res.status(500).json({
        message: 'Internal validation error',
        error: error.message,
      })
    }
  }
}
