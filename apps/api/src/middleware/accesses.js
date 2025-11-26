import { AppConfig } from '../config/index.js'
import { Session } from '../models/Session.js'
import { JWTUtils } from '../utils/index.js'

/**
 * Middleware для проверки access токена
 * После успешной проверки добавляет в req: userId, username, accessCookie
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireAccessToken = async (req, res, next) => {
	/**
	 * @type {string | undefined}
	 */
  const access = req.cookies?.[AppConfig.ACCESS_TOKEN_NAME]
  try {
    const { userId, username } = JWTUtils.verifyToken(access)

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
    console.log('Access token validation failed:', err.message)
    return res.status(401)
  }
}

/**
 * Middleware для проверки refresh токена
 * После успешной проверки добавляет в req: userId, username, refreshCookie
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireRefreshToken = async (req, res, next) => {
  /**
   * @type {string | undefined}
   */
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
		console.log('Refresh token validation failed:', err.message)
    return res.status(401)
  }
}

/**
 * Опциональная проверка токена - не требует авторизации, но если токен есть, устанавливает req.userId
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
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
