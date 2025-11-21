import argon2 from 'argon2'

export class PasswordUtilsClass {
  async comparePasswords(password, hashedPassword) {
    try {
      // Проверяем пароль с помощью argon2id
      const isValid = await argon2.verify(hashedPassword, password)

      if (!isValid) {
        const err = new Error('Invalid username or password')
        err.status = 401
        throw err
      }

      return true
    } catch (error) {
      // Если это не наша ошибка с статусом, то это ошибка argon2
      if (!error.status) {
        const err = new Error('Invalid username or password')
        err.status = 401
        throw err
      }
      throw error
    }
  }

  async hashPassword(password) {
    try {
      // Хешируем пароль с помощью argon2id
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3, // 3 итерации
        parallelism: 4, // 4 потока
        saltLength: 32, // 32 байта соли
      })

      return hash
    } catch (error) {
      const err = new Error('Failed to hash password')
      err.status = 500
      throw err
    }
  }

  // Дополнительная функция для проверки, нужно ли обновить хеш
  needsRehash(hashedPassword) {
    try {
      return argon2.needsRehash(hashedPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 4,
      })
    } catch (error) {
      return true // Если не можем проверить, лучше перехешировать
    }
  }

  // Функция для проверки силы пароля
  validatePasswordStrength(password) {
    const minLength = 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors = []

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`)
    }

    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number')
    }

    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const PasswordUtils = new PasswordUtilsClass()
