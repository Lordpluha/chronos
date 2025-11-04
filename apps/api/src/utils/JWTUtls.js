import jwt from 'jsonwebtoken'
import { AppConfig } from '../config/index.js'

export class JWTUtils {
  static generateAccessToken = (userId, username) =>
    jwt.sign({ userId, username }, AppConfig.JWT_SECRET, {
      expiresIn: AppConfig.ACCESS_TOKEN_LIFETIME,
    })
  static generateRefreshToken = (userId, username) =>
    jwt.sign({ userId, username }, AppConfig.JWT_SECRET, {
      expiresIn: AppConfig.REFRESH_TOKEN_LIFETIME,
    })

  static verifyToken = (token) => {
    let payload
    try {
      payload = jwt.verify(token, AppConfig.JWT_SECRET)
    } catch (err) {
      const e = new Error('Invalid token')
      e.status = 401
      throw e
    }
    return payload
  }

  static generateHttpOnlyCookie = (res, access, refresh) => {
    return res
      .cookie(AppConfig.ACCESS_TOKEN_NAME, access, {
        ...AppConfig.getCookieOptions('access'),
      })
      .cookie(AppConfig.REFRESH_TOKEN_NAME, refresh, {
        ...AppConfig.getCookieOptions('refresh'),
      })
  }

  static clearHttpOnlyCookie = (res) => {
    return res
      .clearCookie(
        AppConfig.ACCESS_TOKEN_NAME,
        AppConfig.getCookieOptions('access'),
      )
      .clearCookie(
        AppConfig.REFRESH_TOKEN_NAME,
        AppConfig.getCookieOptions('refresh'),
      )
  }
}
