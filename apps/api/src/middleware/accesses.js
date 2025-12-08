import { AppConfig } from '../config/index.js'
import { Session } from '../models/Session.js'
import { JWTUtils } from '../utils/index.js'

/**
 * Middleware для проверки access токена
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

    return res.status(401).json()
  }
}

/**
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

    return res.status(401)
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export const optionalAccessToken = async (req, _res, next) => {
  const access = req.cookies?.[AppConfig.ACCESS_TOKEN_NAME]

  if (!access) {
    return next()
  }

  try {
    const { userId, username } = JWTUtils.verifyToken(access)

    const session = await Session.findOne({
      user: userId,
      access_token: access,
    })

    if (session) {
      req.userId = userId
      req.username = username
      req.accessCookie = access
    }
  } catch (err) {

  }

  next()
}
