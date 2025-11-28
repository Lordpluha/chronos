import { Router } from 'express'

import {
  TOKEN_REFRESHED,
  USER_LOGGED_IN,
  USER_LOGGED_OUT,
  USER_REGISTERED,
} from '../../messages/index.js'
import {
  requireAccessToken,
  requireRefreshToken,
} from '../../middleware/index.js'
import {
  DeviceUtils,
  JWTUtils,
  validateBody,
  validateParams,
} from '../../utils/index.js'
import { UsedOAuthCode } from '../../models/UsedOAuthCode.js'

import { authService } from './Auth.service.js'
import {
  disable2FASchema,
  enable2FASchema,
  loginSchema,
  loginWith2FASchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
  resetCodeParamSchema,
  setup2FASchema,
  verify2FASchema,
} from './Auth.validation.js'

const router = Router()

router.post(
  '/auth/registration',
  validateBody(registerSchema),
  async (req, res) => {
    try {
      await authService.register(req.body)
      return res.status(201).json({ message: USER_REGISTERED })
    } catch (err) {
      res = JWTUtils.clearHttpOnlyCookie(res)
      return res.status(err.status || 400).json({ message: err.message })
    }
  },
)

router.post(
  '/auth/login',
  validateBody(loginSchema),
  async (req, res) => {
    const { ipAddress, deviceInfo } = DeviceUtils.getRequestInfo(req)

    try {
      const { access_token, refresh_token } = await authService.login(req.body, ipAddress, deviceInfo)
      res = JWTUtils.generateHttpOnlyCookie(res, access_token, refresh_token)
      res.status(200).json({
        message: USER_LOGGED_IN
      })
    } catch (error) {
      if (error.requires2FA) {
        return res.status(200).json({
          requires2FA: true,
          message: error.message,
        })
      }
      const statusCode = error.status || 400
      res.status(statusCode).json({ error: error.message })
    }
  },
)

router.post('/auth/refresh', requireRefreshToken, async (req, res) => {
  try {
    const { access, refresh } = await authService.refresh(req.refreshCookie)
    res = JWTUtils.generateHttpOnlyCookie(res, access, refresh)

    return res.json({
      message: TOKEN_REFRESHED,
    })
  } catch (err) {
    res = JWTUtils.clearHttpOnlyCookie(res)
    return res.status(err.status || 401).json({ message: err.message })
  }
})

router.post('/auth/logout', requireAccessToken, async (req, res) => {
  try {
    await authService.logout(req.accessCookie)
    res = JWTUtils.clearHttpOnlyCookie(res)
    return res.json({ message: USER_LOGGED_OUT })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.post(
  '/auth/password-reset',
  validateBody(passwordResetRequestSchema),
  async (req, res) => {
    try {
      await authService.sendCode(req.accessCookie, req.body)
      return res.json({ message: 'Code was sended to your email' })
    } catch (err) {
      return res.status(400).json({ message: err.message })
    }
  },
)

router.post(
  '/auth/password-reset/:token',
  validateParams(resetCodeParamSchema),
  validateBody(passwordResetSchema),
  async (req, res) => {
    try {
      await authService.resetPassword(req.params.token, req.body)
      return res.json({ message: 'Password reset successfully' })
    } catch (err) {
      return res.status(400).json({ message: err.message })
    }
  },
)

// Google OAuth routes
router.get('/auth/google', async (req, res) => {
  try {


    // Генерируем state для защиты от CSRF
    const state = Math.random().toString(36).substring(2, 15)


    // Сохраняем state в cookie для проверки в callback
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000, // 10 минут
      sameSite: 'lax',
    })

    const authUrl = authService.getGoogleAuthUrl(state)

    return res.redirect(authUrl)
  } catch (err) {
    console.error('❌ Google OAuth initiation error:', err)
    return res
      .status(500)
      .json({ message: 'Failed to initiate Google authentication' })
  }
})

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query
}...)` : 'Missing',
    )




    // Проверяем наличие ошибки от Google
    if (error) {

      return res.status(400).json({ message: `Google OAuth error: ${error}` })
    }

    // Проверяем наличие кода
    if (!code) {

      return res
        .status(400)
        .json({ message: 'Authorization code not provided' })
    }

    // Проверяем, не был ли код уже использован
    const isUsed = await UsedOAuthCode.isCodeUsed(code)
    if (isUsed) {

      return res
        .status(400)
        .json({ message: 'Authorization code has already been used' })
    }

    // Добавляем код в список использованных (истекает через 10 минут)
    await UsedOAuthCode.markAsUsed(code, 10)



    // Обрабатываем callback и получаем токены
    const { ipAddress, deviceInfo } = DeviceUtils.getRequestInfo(req)

    const { access_token, refresh_token } =
      await authService.handleGoogleCallback(code, state, ipAddress, deviceInfo)

    // Устанавливаем токены в cookies
    res = JWTUtils.generateHttpOnlyCookie(res, access_token, refresh_token)

    // Перенаправляем на фронтенд
    const frontendUrl =
      process.env.NODE_ENV === 'production'
        ? `https://${process.env.FRONT_HOST}`
        : `http://${process.env.FRONT_HOST}:${process.env.FRONT_PORT}`
    return res.redirect(`${frontendUrl}/calendar`)
  } catch (err) {
    console.error('❌ Google OAuth callback error:', err)

    // Удаляем код из использованных, если произошла ошибка
    if (req.query.code) {
      await UsedOAuthCode.deleteOne({ code: req.query.code })
    }

    const frontendUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://your-frontend-domain.com'
        : `file:///home/lordpluha/develop/Campus/vtesliuk-6096`

    return res.redirect(
      `${frontendUrl}/auth-error.html?message=${encodeURIComponent(err.message)}`,
    )
  }
})

// GET /auth/me - получить информацию о текущем пользователе
router.get('/auth/me', requireAccessToken, async (req, res) => {
  try {
    const userId = req.userId
    const user = await authService.getUserById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Возвращаем информацию о пользователе без пароля
    const userInfo = {
      id: user.id,
      login: user.login,
      email: user.email,
      full_name: user.full_name,
      avatar: user.avatar,
      created: user.created,
      google_id: user.google_id,
      is_email_verified: user.is_email_verified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
    }

    return res.json(userInfo)
  } catch (err) {
    console.error('❌ Error getting user info:', err)
    return res.status(500).json({ message: 'Failed to get user information' })
  }
})

// 2FA Routes

// Настройка 2FA - получение QR кода
router.post(
  '/auth/2fa/setup',
  requireAccessToken,
  validateBody(setup2FASchema),
  async (req, res) => {
    try {
      const userId = req.userId
      const { password } = req.body

      const result = await authService.setup2FA(userId, password)

      return res.json({
        message: '2FA setup initiated',
        secret: result.secret,
        qrCode: result.qrCode,
        manualEntryKey: result.manualEntryKey,
      })
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message })
    }
  },
)

// Включение 2FA после верификации
router.post(
  '/auth/2fa/enable',
  requireAccessToken,
  validateBody(enable2FASchema),
  async (req, res) => {
    try {
      const userId = req.userId
      const { token, password } = req.body

      const backupCodes = await authService.enable2FA(userId, token, password)

      return res.json({
        message: '2FA enabled successfully',
        backupCodes: backupCodes,
      })
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message })
    }
  },
)

// Отключение 2FA
router.post(
  '/auth/2fa/disable',
  requireAccessToken,
  validateBody(disable2FASchema),
  async (req, res) => {
    try {
      const userId = req.userId
      const { password } = req.body

      await authService.disable2FA(userId, password)

      return res.json({
        message: '2FA disabled successfully',
      })
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message })
    }
  },
)

// Проверка 2FA токена (для отдельной верификации)
router.post(
  '/auth/2fa/verify',
  requireAccessToken,
  validateBody(verify2FASchema),
  async (req, res) => {
    try {
      const userId = req.userId
      const { token } = req.body

      const isValid = await authService.verify2FAToken(userId, token)

      if (isValid) {
        return res.json({
          message: '2FA token is valid',
          valid: true,
        })
      } else {
        return res.status(401).json({
          message: 'Invalid 2FA token',
          valid: false,
        })
      }
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message })
    }
  },
)

// Получить статус 2FA
router.get('/auth/2fa/status', requireAccessToken, async (req, res) => {
  try {
    const userId = req.userId
    const status = await authService.get2FAStatus(userId)

    return res.json({
      message: '2FA status retrieved',
      ...status,
    })
  } catch (err) {
    return res.status(err.status || 400).json({ message: err.message })
  }
})

export { router as AuthRouter }
