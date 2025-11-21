import { User } from '../../models/User.js'
import { PasswordUtils } from '../../utils/PasswordUtils.js'

class UsersService {
  /**
   * Обновление профиля пользователя
   * @param {string} userId - ID пользователя
   * @param {Object} updateData - Данные для обновления
   * @param {string} [updateData.full_name] - Полное имя
   * @param {string} [updateData.email] - Email
   * @param {string} [updateData.login] - Login
   * @param {string} [updateData.avatar] - URL аватара
   * @param {string} [updateData.currentPassword] - Текущий пароль (требуется для изменения пароля)
   * @param {string} [updateData.newPassword] - Новый пароль
   * @returns {Promise<Object>} Обновленные данные пользователя
   */
  async updateProfile(userId, updateData) {
    const { full_name, email, login, avatar, currentPassword, newPassword } = updateData

    // Находим пользователя
    const user = await User.findById(userId)
    if (!user) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    // Проверяем, что пользователь не использует Google OAuth (если пытается изменить пароль)
    if (newPassword && user.google_id) {
      const error = new Error('Cannot change password for Google OAuth users')
      error.status = 400
      throw error
    }

    // Если пользователь меняет пароль, проверяем текущий пароль
    if (newPassword) {
      if (!currentPassword) {
        const error = new Error('Current password is required to set a new password')
        error.status = 400
        throw error
      }

      // Проверяем текущий пароль
      const isPasswordValid = await user.checkPassword(currentPassword)
      if (!isPasswordValid) {
        const error = new Error('Current password is incorrect')
        error.status = 401
        throw error
      }

      // Валидируем новый пароль
      const validation = PasswordUtils.validatePasswordStrength(newPassword)
      if (!validation.isValid) {
        const error = new Error(validation.errors.join('. '))
        error.status = 400
        throw error
      }

      // Устанавливаем новый пароль (хеширование произойдет в pre('save') хуке)
      user.password_hash = newPassword
    }

    // Обновляем login, если указан и отличается
    if (login && login !== user.login) {
      // Проверяем уникальность логина
      const existingUser = await User.findByLogin(login)
      if (existingUser && existingUser._id.toString() !== userId) {
        const error = new Error('Login is already taken')
        error.status = 409
        throw error
      }
      user.login = login
    }

    // Обновляем email, если указан и отличается
    if (email && email !== user.email) {
      // Проверяем уникальность email
      const existingUser = await User.findByEmail(email)
      if (existingUser && existingUser._id.toString() !== userId) {
        const error = new Error('Email is already taken')
        error.status = 409
        throw error
      }
      user.email = email
      // При смене email сбрасываем верификацию
      user.is_email_verified = false
    }

    // Обновляем полное имя
    if (full_name !== undefined) {
      user.full_name = full_name
    }

    // Обновляем аватар
    if (avatar !== undefined) {
      user.avatar = avatar
    }

    // Сохраняем изменения
    await user.save()

    // Возвращаем обновленные данные без чувствительной информации
    return {
      id: user._id,
      login: user.login,
      email: user.email,
      full_name: user.full_name,
      avatar: user.avatar,
      is_email_verified: user.is_email_verified,
      google_id: user.google_id,
      twoFactorEnabled: user.twoFactorEnabled,
      created: user.created,
      updated: user.updated,
    }
  }

  /**
   * Получение информации о пользователе по ID
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} Данные пользователя
   */
  async getUserById(userId) {
    const user = await User.findById(userId)
    if (!user) {
      const error = new Error('User not found')
      error.status = 404
      throw error
    }

    return {
      id: user._id,
      login: user.login,
      email: user.email,
      full_name: user.full_name,
      avatar: user.avatar,
      is_email_verified: user.is_email_verified,
      google_id: user.google_id,
      twoFactorEnabled: user.twoFactorEnabled,
      created: user.created,
      updated: user.updated,
      lastLoginAt: user.lastLoginAt,
    }
  }
}

export const usersService = new UsersService()
