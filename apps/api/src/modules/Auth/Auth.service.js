import QRCode from 'qrcode'
import speakeasy from 'speakeasy'
import { AppConfig } from '../../config/index.js'
import { User } from '../../models/User.js'
import { Session } from '../../models/Session.js'
import { PasswordResetOtp } from '../../models/PasswordResetOtp.js'
import { TwoFactorAuth } from '../../models/TwoFactorAuth.js'
import {
  INVALID_OR_EXPIRED_CODE,
  INVALID_USERNAME_OR_PASSWORD,
  REFRESH_TOKEN_MISSING,
	USER_ALREADY_EXISTS,
} from '../../messages/index.js'
import {
  DateTimeUtils,
  EmailUtils,
  JWTUtils,
  generateCode,
} from '../../utils/index.js'
import { googleAuthService } from './Auth.google.service.js'

class AuthService {
  async register({ login, password, email, full_name }) {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ login: login }, { email: email }],
    })

    if (existingUser) {
      const err = new Error(USER_ALREADY_EXISTS)
      throw err
    }

    // Create new user
    const user = new User({
      login: login,
      email: email,
      password_hash: password, // Will be hashed by the pre-save hook
      full_name: full_name,
    })

    await user.save()
    return
  }

  /**
   * @param {Object} param0
   * @param {string} param0.login
   * @param {string} param0.password
   * @param {string} param0.token
   * @param {string|undefined} ipAddress
   * @param {Object|undefined} deviceInfo
   */
  async login({ login, password, token }, ipAddress, deviceInfo) {
    // Find user by username or email
    const user = await User.findByEmailOrUsername(login)

    if (!user) {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD)
      throw err
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password)
    if (!isPasswordValid) {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD)
      throw err
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const err = new Error('2FA verification required')
      err.requires2FA = true
      err.userId = user._id.toString()
      throw err
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Generate tokens
    const access_token = JWTUtils.generateAccessToken(user._id.toString(), user.login)
    const refresh_token = JWTUtils.generateRefreshToken(user._id.toString(), user.login)

    // Create session with IP address and device info
    const session = new Session({
      user: user._id,
      access_token: access_token,
      refresh_token: refresh_token,
      ip_address: ipAddress,
      device: deviceInfo,
    })

    await session.save()

    return { access_token, refresh_token }
  }

  /**
   * Login with 2FA verification
   * @param {string} login
   * @param {string} password
   * @param {string} token
   * @param {string|undefined} ipAddress
   * @param {Object|undefined} deviceInfo
   */
  async loginWith2FA(login, password, token, ipAddress, deviceInfo) {
    // Find user by username or email
    const user = await User.findByEmailOrUsername(login)

    if (!user) {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD)
      throw err
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password)
    if (!isPasswordValid) {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD)
      throw err
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      const err = new Error('2FA is not enabled for this user')
      err.status = 400
      throw err
    }

    // Verify 2FA token
    const isValidToken = await this.verify2FAToken(user._id.toString(), token)
    if (!isValidToken) {
      const err = new Error('Invalid 2FA token')
      err.status = 400
      throw err
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Generate tokens
    const access_token = JWTUtils.generateAccessToken(user._id.toString(), user.login)
    const refresh_token = JWTUtils.generateRefreshToken(user._id.toString(), user.login)

    // Create session with IP address and device info
    const session = new Session({
      user: user._id,
      access_token: access_token,
      refresh_token: refresh_token,
      ip_address: ipAddress,
      device: deviceInfo,
    })

    await session.save()

    return { access_token, refresh_token }
  }

  async logout(access_token) {
    // Delete only the current session by access token
    await Session.deleteOne({ access_token: access_token })
  }

  async refresh(old_refresh_token) {
    if (!old_refresh_token) {
      const err = new Error(REFRESH_TOKEN_MISSING)
      throw err
    }

    // Find session with the refresh token
    const session = await Session.findOne({ refresh_token: old_refresh_token })
    if (!session) {
      const err = new Error('Invalid refresh token')
      throw err
    }

    // Check if session is expired (TTL is 30 days, managed by MongoDB)
    // The Session model has automatic expiration via TTL index

    // Verify token
    const { userId, login } = JWTUtils.verifyToken(old_refresh_token)

    // Generate new tokens
    const access_token = JWTUtils.generateAccessToken(userId, login)
    const refresh_token = JWTUtils.generateRefreshToken(userId, login)

    // Delete old session and create new one to avoid duplicate key errors
    await Session.deleteOne({ _id: session._id })

    const newSession = new Session({
      user: userId,
      access_token: access_token,
      refresh_token: refresh_token,
    })
    await newSession.save()

    return {
      access: access_token,
      refresh: refresh_token,
    }
  }

  /**
   * Отправить код сброса пароля
   * @param {string} _access_token - Токен доступа (не используется)
   * @param {Object} body - Уже валидированные данные
   * @param {string} body.email
   */
  async sendCode(_access_token, body) {
    // Find user by email
    const user = await User.findOne({ email: body.email })
    if (!user) {
      const err = new Error('User with this email not found')
      throw err
    }

    const code = generateCode()


    try {
      await EmailUtils.sendEmail({
        to: body.email,
        subject: 'Chronos Password Reset Code',
        text: `Your password reset code is: ${code}`,
        html: EmailUtils.generateEmail(code),
      })
    } catch (err) {
      err.status = 400
      throw err
    }

    const expiresAt = new Date(
      Date.now() + DateTimeUtils.parseDurationToMs(AppConfig.CODE_LIFETIME),
    )

    // Create password reset record
    const passwordReset = new PasswordResetOtp({
      user: user._id,
      code: code,
      expires_at: expiresAt,
    })

    await passwordReset.save()
  }

  /**
   * Сброс пароля по коду
   * @param {string} code - Уже валидированный код (6 цифр)
   * @param {Object} body - Уже валидированные данные
   * @param {string} body.password - Новый пароль
   */
  async resetPassword(code, { password }) {
    // Find valid password reset record
    const resetRecord = await PasswordResetOtp.findOne({
      code: code,
      expires_at: { $gt: new Date() },
    }).populate('user')

    if (!resetRecord) {
      const err = new Error(INVALID_OR_EXPIRED_CODE)
      throw err
    }

    const user = resetRecord.user
    if (!user) {
      const err = new Error('User not found')
      throw err
    }

    // Update password (will be hashed by pre-save hook)
    user.password_hash = password
    await user.save()

    // Delete the used reset code
    await PasswordResetOtp.deleteOne({ _id: resetRecord._id })
  }

  /**
   * Поиск или создание пользователя через Google OAuth
   * @param {Object} googleUser - Данные пользователя от Google
   * @param {string} ipAddress - IP адрес пользователя
   * @param {Object} deviceInfo - Информация о устройстве
   * @returns {Promise<Object>} Токены доступа или информация о необходимости 2FA
   */
  async loginOrCreateGoogleUser(googleUser, ipAddress = null, deviceInfo = null) {
    const { googleId, email, name, given_name, family_name, picture } =
      googleUser

    // Find user by Google ID first
    let user = await User.findOne({ google_id: googleId })

    if (!user) {
      // If no user with Google ID, find by email
      user = await User.findOne({ email: email })

      if (user) {
        // Link Google ID to existing user
        user.google_id = googleId
        if (picture) user.avatar = picture
        await user.save()
      } else {
        // Create new user
        const username = email.split('@')[0]
        let uniqueUsername = username
        let counter = 1

        // Ensure username uniqueness
        while (await User.findOne({ login: uniqueUsername })) {
          uniqueUsername = `${username}${counter}`
          counter++
        }

        const fullName =
          name || `${given_name || ''} ${family_name || ''}`.trim()

        user = new User({
          login: uniqueUsername,
          email: email,
          google_id: googleId,
          full_name: fullName || uniqueUsername,
          avatar: picture,
          is_email_verified: true,
        })

        await user.save()
      }
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate temporary tokens for 2FA verification
      const temp_access_token = JWTUtils.generateAccessToken(user._id.toString(), user.login)

      return {
        requires2FA: true,
        temp_token: temp_access_token,
        user_id: user._id.toString()
      }
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Generate tokens
    const access_token = JWTUtils.generateAccessToken(user._id.toString(), user.login)
    const refresh_token = JWTUtils.generateRefreshToken(user._id.toString(), user.login)

    // Create session with IP address and device info
    const session = new Session({
      user: user._id,
      access_token: access_token,
      refresh_token: refresh_token,
      ip_address: ipAddress,
      device: deviceInfo,
    })

    await session.save()

    return { access_token, refresh_token }
  }

  /**
   * Получает URL для авторизации через Google
   * @param {string} state - CSRF state параметр
   * @returns {string} URL для авторизации
   */
  getGoogleAuthUrl(state = null) {
    return googleAuthService.getAuthUrl(state)
  }

  /**
   * Обрабатывает callback от Google OAuth
   * @param {string} code - Код авторизации
   * @param {string} _state - State параметр для проверки CSRF (не используется)
   * @param {string} ipAddress - IP адрес пользователя
   * @param {Object} deviceInfo - Информация о устройстве
   * @returns {Promise<Object>} Токены доступа
   */
  async handleGoogleCallback(code, _state = null, ipAddress = null, deviceInfo = null) {
    try {
      // Получаем токены от Google
      const tokens = await googleAuthService.getTokens(code)

      // Получаем информацию о пользователе из Google
      const googleUser = await googleAuthService.getUserInfo(
        tokens.access_token,
      )

      // Проверяем, что email подтвержден
      if (!googleUser.verified_email) {
        const err = new Error('Email not verified by Google')
        err.status = 400
        throw err
      }

      // Создаем или находим пользователя
      return await this.loginOrCreateGoogleUser(googleUser, ipAddress, deviceInfo)
    } catch (error) {
      console.error('Google OAuth error:', error)
      throw error
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password')
      return user
    } catch (err) {
      console.error('Error getting user by ID:', err)
      throw err
    }
  }

  /**
   * Настройка 2FA - генерация секретного ключа
   * @param {string} userId - ID пользователя
   * @param {string} password - Текущий пароль для подтверждения (опционально для OAuth)
   * @returns {Promise<Object>} Объект с секретным ключом и QR кодом
   */
  async setup2FA(userId, password = null) {
    // Find user
    const user = await User.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      throw err
    }

    // Check password only if user has password_hash (not OAuth user)
    if (user.password_hash) {
      if (!password) {
        const err = new Error('Password is required')
        throw err
      }
      const isPasswordValid = await user.checkPassword(password)
      if (!isPasswordValid) {
        const err = new Error('Invalid password')
        throw err
      }
    }

    // Generate secret key
    const secret = speakeasy.generateSecret({
      name: 'Chronos API',
      issuer: 'Chronos',
    })

    // Save or update 2FA record (but don't enable yet)
    await TwoFactorAuth.findOneAndUpdate(
      { userId },
      {
        secretKey: secret.base32,
        isEnabled: false,
      },
      { upsert: true },
    )

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    }
  }

  /**
   * Включение 2FA после верификации токена
   * @param {string} userId - ID пользователя
   * @param {string} token - TOTP токен для верификации
   * @param {string} password - Текущий пароль для подтверждения (опционально для OAuth)
   * @returns {Promise<Array>} Массив backup кодов
   */
  async enable2FA(userId, token, password = null) {
    // Find user
    const user = await User.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      throw err
    }

    // Check password only if user has password_hash (not OAuth user)
    if (user.password_hash) {
      if (!password) {
        const err = new Error('Password is required')
        throw err
      }
      const isPasswordValid = await user.checkPassword(password)
      if (!isPasswordValid) {
        const err = new Error('Invalid password')
        throw err
      }
    }

    // Get 2FA record
    const twoFactorRecord = await TwoFactorAuth.findByUserId(userId)
    if (!twoFactorRecord) {
      const err = new Error('2FA not set up. Please run setup first.')
      throw err
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFactorRecord.secretKey,
      encoding: 'base32',
      token: token,
      window: 1,
    })

    if (!verified) {
      const err = new Error('Invalid 2FA token')
      throw err
    }

    // Generate backup codes
    const backupCodes = twoFactorRecord.generateBackupCodes()

    // Enable 2FA
    twoFactorRecord.isEnabled = true
    twoFactorRecord.enabledAt = new Date()
    await twoFactorRecord.save()

    // Update user record
    user.twoFactorEnabled = true
    await user.save()

    return backupCodes
  }

  /**
   * Отключение 2FA
   * @param {string} userId - ID пользователя
   * @param {string} password - Текущий пароль для подтверждения (опционально для OAuth)
   */
  async disable2FA(userId, password = null) {
    // Find user
    const user = await User.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      throw err
    }

    // Check password only if user has password_hash (not OAuth user)
    if (user.password_hash) {
      if (!password) {
        const err = new Error('Password is required')
        throw err
      }
      const isPasswordValid = await user.checkPassword(password)
      if (!isPasswordValid) {
        const err = new Error('Invalid password')
        throw err
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false
    await user.save()

    // Remove 2FA data
    await TwoFactorAuth.deleteOne({ userId })
  }

  /**
   * Проверка 2FA токена
   * @param {string} userId - ID пользователя
   * @param {string} token - TOTP токен
   * @returns {Promise<boolean>} Результат проверки
   */
  async verify2FAToken(userId, token) {
    const twoFactorRecord = await TwoFactorAuth.findOne({
      userId,
      isEnabled: true,
    })

    if (!twoFactorRecord) {
      return false
    }

    // First try TOTP token
    const verified = twoFactorRecord.verifyToken(token)

    if (verified) {
      return true
    }

    // If TOTP failed, try backup codes
    if (twoFactorRecord.backupCodes && twoFactorRecord.backupCodes.length > 0) {
      const backupCodeValid = await twoFactorRecord.verifyBackupCode(token)
      if (backupCodeValid) {
        return true
      }
    }

    return false
  }

  /**
   * Получить статус 2FA для пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} Статус 2FA
   */
  async get2FAStatus(userId) {
    const user = await User.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      throw err
    }

    const twoFactorRecord = await TwoFactorAuth.findByUserId(userId)

    let backupCodesCount = 0
    if (twoFactorRecord?.backupCodes) {
      backupCodesCount = twoFactorRecord.backupCodes.length
    }

    return {
      is2FAEnabled: user.twoFactorEnabled,
      isSetup: !!twoFactorRecord,
      backupCodesCount: backupCodesCount,
    }
  }

  /**
   * Верификация 2FA для OAuth логина
   * @param {string} tempToken - Временный токен
   * @param {string} token - 2FA токен
   * @param {string} ipAddress - IP адрес
   * @param {Object} deviceInfo - Информация об устройстве
   * @returns {Promise<Object>} Финальные токены доступа
   */
  async verifyOAuth2FA(tempToken, token, ipAddress = null, deviceInfo = null) {
    // Verify temporary token
    const { userId } = JWTUtils.verifyToken(tempToken)

    const user = await User.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      throw err
    }

    // Verify 2FA token
    const isValidToken = await this.verify2FAToken(userId.toString(), token)
    if (!isValidToken) {
      const err = new Error('Invalid 2FA token')
      throw err
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Generate final tokens
    const access_token = JWTUtils.generateAccessToken(user._id.toString(), user.login)
    const refresh_token = JWTUtils.generateRefreshToken(user._id.toString(), user.login)

    // Create session
    const session = new Session({
      user: user._id,
      access_token: access_token,
      refresh_token: refresh_token,
      ip_address: ipAddress,
      device: deviceInfo,
    })

    await session.save()

    return { access_token, refresh_token }
  }
}

export const authService = new AuthService()
