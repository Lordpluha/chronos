import jwt from 'jsonwebtoken'
import { AppConfig } from '../config/index.js'

export class JWTUtilsClass {
  /**
   * Генерирует access токен
   * @param {string} userId - ID пользователя
   * @param {string} username - Имя пользователя
   * @returns {string} JWT токен
   */
  generateAccessToken = (userId, username) =>
    jwt.sign({ userId, username }, AppConfig.JWT_SECRET, {
      expiresIn: AppConfig.cookieAccessMaxAge,
    })

  /**
   * Генерирует refresh токен
   * @param {string} userId - ID пользователя
   * @param {string} username - Имя пользователя
   * @returns {string} JWT токен
   */
  generateRefreshToken = (userId, username) =>
    jwt.sign({ userId, username }, AppConfig.JWT_SECRET, {
      expiresIn: AppConfig.cookieRefreshMaxAge,
    })

  /**
   * Верифицирует токен и возвращает payload
   * @param {string} token - JWT токен
   * @returns {import('./jwt-payload.js').JwtPayload} Payload токена
   * @throws {Error} Если токен невалиден
   */
  verifyToken = (token) => {
    /** @type {import('./jwt-payload.js').JwtPayload} */
    let payload
    try {
      payload = /** @type {import('./jwt-payload.js').JwtPayload} */ (
        jwt.verify(token, AppConfig.JWT_SECRET)
      )
    } catch (err) {
      throw new Error('Invalid token')
    }
    return payload
  }

  /**
   * Устанавливает HTTP-only cookies с токенами
   * @param {import("express").Response} res - Express response объект
   * @param {string} access - Access токен
   * @param {string} refresh - Refresh токен
   * @returns {import("express").Response} Response с установленными cookies
   */
  generateHttpOnlyCookie = (res, access, refresh) => {
    return res
      .cookie(AppConfig.ACCESS_TOKEN_NAME, access, {
        ...AppConfig.getCookieOptions('access'),
      })
      .cookie(AppConfig.REFRESH_TOKEN_NAME, refresh, {
        ...AppConfig.getCookieOptions('refresh'),
      })
  }

  /**
   * Очищает HTTP-only cookies с токенами
   * @param {import("express").Response} res - Express response объект
   * @returns {import("express").Response} Response с очищенными cookies
   */
  clearHttpOnlyCookie = (res) => {
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

export const JWTUtils = new JWTUtilsClass()
