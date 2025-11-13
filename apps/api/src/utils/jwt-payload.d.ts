import type { JwtPayload as BaseJWTPayload } from 'jsonwebtoken'

/**
 * JWT Payload для токенов доступа и обновления
 */
export interface JwtPayload extends BaseJwtPayload {
  /** ID пользователя */
  userId: string
  /** Имя пользователя */
  username: string
  /** Время выдачи токена (timestamp) */
  iat?: number
  /** Время истечения токена (timestamp) */
  exp?: number
}
