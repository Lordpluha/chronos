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
        return res.status(403).json({
          requires2FA: true,
          userId: error.userId,
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

router.post(
  '/auth/2fa',
  validateBody(loginWith2FASchema),
  async (req, res) => {
    const { ipAddress, deviceInfo } = DeviceUtils.getRequestInfo(req)

    try {
      const { login, password, token } = req.body
      const { access_token, refresh_token } = await authService.loginWith2FA(
        login,
        password,
        token,
        ipAddress,
        deviceInfo,
      )
      res = JWTUtils.generateHttpOnlyCookie(res, access_token, refresh_token)
      return res.status(200).json({
        message: USER_LOGGED_IN,
      })
    } catch (error) {
      const statusCode = error.status || 400
      return res.status(statusCode).json({ message: error.message })
    }
  },
)

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

router.get('/auth/google', async (req, res) => {
  try {
    console.log('🚀 Initiating Google OAuth...')

    const state = Math.random().toString(36).substring(2, 15)
    console.log('🔐 Generated state:', state)

    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
      sameSite: 'lax',
    })

    const authUrl = authService.getGoogleAuthUrl(state)
    console.log('🔗 Redirecting to Google Auth URL:', authUrl)
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

    const codeStr = typeof code === 'string' ? code : String(code || '')
    const stateStr = typeof state === 'string' ? state : String(state || '')

    console.log('📥 Google OAuth Callback received:')
    console.log(
      '  Code:',
      codeStr ? `Present (${codeStr.substring(0, 10)}...)` : 'Missing',
    )
    console.log('  State from query:', stateStr)
    console.log('  Error:', error)
    console.log('  Request URL:', req.originalUrl)

    if (error) {
      console.log('❌ Google OAuth error:', error)
      return res.status(400).json({ message: `Google OAuth error: ${error}` })
    }

    if (!codeStr) {
      console.log('❌ Authorization code not provided')
      return res
        .status(400)
        .json({ message: 'Authorization code not provided' })
    }

    const isUsed = await UsedOAuthCode.isCodeUsed(codeStr)
    if (isUsed) {
      console.log('❌ Authorization code has already been used')
      return res
        .status(400)
        .json({ message: 'Authorization code has already been used' })
    }

    await UsedOAuthCode.markAsUsed(codeStr, 10)

    console.log('🔄 Processing Google OAuth callback...')

    const { ipAddress, deviceInfo } = DeviceUtils.getRequestInfo(req)

    const result = await authService.handleGoogleCallback(codeStr, stateStr, ipAddress, deviceInfo)

    const frontendUrl =
      process.env.NODE_ENV === 'production'
        ? `https://${process.env.FRONT_HOST}`
        : `http://${process.env.FRONT_HOST}:${process.env.FRONT_PORT}`

    // Check if 2FA is required
    if (result.requires2FA) {
      console.log('🔐 2FA required for user, redirecting to 2FA page')
      // Set temporary token in cookie
      res.cookie('temp_token', result.temp_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: 'lax',
      })
      return res.redirect(`${frontendUrl}/auth/verify-2fa`)
    }

    // Normal login without 2FA
    res = JWTUtils.generateHttpOnlyCookie(res, result.access_token, result.refresh_token)

    console.log(
      '✅ Google OAuth successful, redirecting to:',
      `${frontendUrl}/calendar`,
    )
    return res.redirect(`${frontendUrl}/calendar`)
  } catch (err) {
    console.error('❌ Google OAuth callback error:', err)

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

router.get('/auth/me', requireAccessToken, async (req, res) => {
  try {
    const userId = req.userId
    const user = await authService.getUserById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

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

router.post('/auth/oauth/verify-2fa', async (req, res) => {
  try {
    const { token } = req.body
    const tempToken = req.cookies.temp_token

    if (!tempToken) {
      return res.status(400).json({ message: 'No temporary token found' })
    }

    if (!token) {
      return res.status(400).json({ message: '2FA token is required' })
    }

    const { ipAddress, deviceInfo } = DeviceUtils.getRequestInfo(req)

    const { access_token, refresh_token } = await authService.verifyOAuth2FA(
      tempToken,
      token,
      ipAddress,
      deviceInfo
    )

    // Clear temp token
    res.clearCookie('temp_token')

    // Set final tokens
    res = JWTUtils.generateHttpOnlyCookie(res, access_token, refresh_token)

    return res.json({
      message: 'Login successful',
    })
  } catch (err) {
    console.error('❌ OAuth 2FA verification error:', err)
    return res.status(err.status || 400).json({ message: err.message })
  }
})

export { router as AuthRouter }
