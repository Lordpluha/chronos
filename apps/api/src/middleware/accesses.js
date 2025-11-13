import { AppConfig } from '../config/index.js'
import { Session } from '../models/Session.js'
import { JWTUtils } from '../utils/index.js'

export const requireAccessToken = async (req, res, next) => {
  const access = req.cookies?.[AppConfig.ACCESS_TOKEN_NAME]
  try {
    const { userId, username } = JWTUtils.verifyToken(access)

    // DB-check with MongoDB
    const session = await Session.findOne({
      user: userId,
      access_token: access,
    })
    if (!session) throw { status: 401, message: 'Access token revoked' }

    req.userId = userId
    req.username = username
    req.accessCookie = access
    next()
  } catch (err) {
    return res
      .status(err.status || 401)
      .json({ message: err.message || 'Invalid token' })
  }
}

export const requireRefreshToken = async (req, res, next) => {
  const refresh = req.cookies?.[AppConfig.REFRESH_TOKEN_NAME]
  try {
    const { userId, username } = JWTUtils.verifyToken(refresh)

    // DB-check with MongoDB
    const session = await Session.findOne({
      user: userId,
      refresh_token: refresh,
    })
    if (!session) throw { status: 401, message: 'Refresh token revoked' }

    req.userId = userId
    req.username = username
    req.refreshCookie = refresh
    next()
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message })
  }
}

// Опциональная проверка токена - не требует авторизации, но если токен есть, устанавливает req.userId
export const optionalAccessToken = async (req, _res, next) => {
  const access = req.cookies?.[AppConfig.ACCESS_TOKEN_NAME]

  // Если токена нет, просто продолжаем без userId
  if (!access) {
    return next()
  }

  try {
    const { userId, username } = JWTUtils.verifyToken(access)

    // DB-check with MongoDB
    const session = await Session.findOne({
      user: userId,
      access_token: access,
    })

    // Если токен валидный, устанавливаем userId
    if (session) {
      req.userId = userId
      req.username = username
      req.accessCookie = access
    }
  } catch (err) {
    // Игнорируем ошибки валидации токена для опционального middleware
    console.log('Optional token validation failed:', err.message)
  }

  next()
}
