import { google } from 'googleapis'
import { AppConfig } from '../../config/index.js'

class GoogleAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      AppConfig.OAUTH_CLIENT_ID,
      AppConfig.OAUTH_CLIENT_SECRET,
      this.getCallbackUrl(),
    )
  }

  getCallbackUrl() {
    // Возвращаем URL для callback в зависимости от окружения
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? `https://your-domain.com`
        : `http://${AppConfig.HOST}:${AppConfig.PORT}`
    const callbackUrl = `${baseUrl}/api/auth/google/callback`
    console.log('🔗 Google OAuth Callback URL:', callbackUrl)
    return callbackUrl
  }

  /**
   * Генерирует URL для авторизации через Google
   * @param {string} state - Опциональный state параметр для защиты от CSRF
   * @returns {string} URL для редиректа пользователя
   */
  getAuthUrl(state = null) {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    console.log('🔧 OAuth Configuration:')
    console.log('  Client ID:', AppConfig.OAUTH_CLIENT_ID)
    console.log('  Callback URL:', this.getCallbackUrl())
    console.log('  Scopes:', scopes)
    console.log('  State:', state)

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent',
    })

    console.log('🔗 Generated Auth URL:', authUrl)

    // Извлекаем redirect_uri из URL для проверки
    const url = new URL(authUrl)
    const redirectUri = url.searchParams.get('redirect_uri')
    console.log('📍 Extracted redirect_uri:', redirectUri)
    console.log('📍 Decoded redirect_uri:', decodeURIComponent(redirectUri))

    return authUrl
  }

  /**
   * Обменивает код авторизации на токены
   * @param {string} code - Код авторизации от Google
   * @returns {Promise<object>} Объект с токенами
   */
  async getTokens(code) {
    try {
      console.log('🔄 Exchanging authorization code for tokens...')
      console.log('  Code (first 20 chars):', code.substring(0, 20) + '...')
      console.log('  Client ID:', AppConfig.OAUTH_CLIENT_ID)
      console.log('  Redirect URI:', this.getCallbackUrl())

      const { tokens } = await this.oauth2Client.getToken(code)

      console.log('✅ Successfully received tokens from Google')
      console.log('  Access token received:', !!tokens.access_token)
      console.log('  Refresh token received:', !!tokens.refresh_token)
      console.log(
        '  Expires in:',
        tokens.expiry_date ? new Date(tokens.expiry_date) : 'N/A',
      )

      this.oauth2Client.setCredentials(tokens)
      return tokens
    } catch (error) {
      console.error('❌ Failed to exchange code for tokens:')
      console.error('  Error message:', error.message)
      console.error('  Error code:', error.code)
      console.error('  Full error:', error)
      throw new Error(`Failed to exchange code for tokens: ${error.message}`)
    }
  }

  /**
   * Получает информацию о пользователе из Google
   * @param {string} accessToken - Access token от Google
   * @returns {Promise<object>} Информация о пользователе
   */
  async getUserInfo(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken })

      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
      const { data } = await oauth2.userinfo.get()

      return {
        googleId: data.id,
        email: data.email,
        name: data.name,
        given_name: data.given_name,
        family_name: data.family_name,
        picture: data.picture,
        verified_email: data.verified_email,
      }
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`)
    }
  }

  /**
   * Проверяет валидность токена
   * @param {string} accessToken - Access token для проверки
   * @returns {Promise<boolean>} true если токен валиден
   */
  async verifyToken(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken })

      const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken)
      return tokenInfo && tokenInfo.aud === AppConfig.OAUTH_CLIENT_ID
    } catch (error) {
      return false
    }
  }

  /**
   * Отзывает токен Google
   * @param {string} accessToken - Access token для отзыва
   */
  async revokeToken(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken })
      await this.oauth2Client.revokeCredentials()
    } catch (error) {
      console.error('Failed to revoke token:', error.message)
    }
  }
}

export const googleAuthService = new GoogleAuthService()
