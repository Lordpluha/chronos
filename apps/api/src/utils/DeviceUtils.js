/**
 * Утилита для извлечения информации о устройстве из User-Agent
 */

/**
 * Определяет название браузера
 * @param {string} userAgent
 * @returns {string}
 */
function getBrowserName(userAgent) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('chrome/')) return 'Chrome'
  if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari'
  if (ua.includes('firefox/')) return 'Firefox'
  if (ua.includes('msie') || ua.includes('trident/')) return 'IE'

  return 'Unknown Browser'
}

/**
 * Определяет название операционной системы
 * @param {string} userAgent
 * @returns {string}
 */
function getOSName(userAgent) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('win')) return 'Windows'
  if (ua.includes('mac')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'

  return 'Unknown OS'
}

/**
 * Парсит User-Agent и возвращает информацию о устройстве
 * @param {string} userAgent - User-Agent строка
 * @returns {Object} Информация о устройстве
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      type: 'unknown',
      userAgent: null,
    }
  }

  const ua = userAgent.toLowerCase()
  let type = 'unknown'

  // Определяем тип устройства
  if (ua.includes('mobile') || ua.includes('android')) {
    type = 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    type = 'tablet'
  } else if (ua.includes('tv')) {
    type = 'tv'
  } else if (ua.includes('watch')) {
    type = 'watch'
  } else if (
    ua.includes('windows') ||
    ua.includes('mac') ||
    ua.includes('linux') ||
    ua.includes('x11')
  ) {
    type = 'desktop'
  }

  // Извлекаем название браузера и ОС для title
  const browserName = getBrowserName(userAgent)
  const osName = getOSName(userAgent)
  const title = `${browserName} on ${osName}`

  return {
    type,
    title,
    userAgent: userAgent.substring(0, 500), // Ограничиваем длину
  }
}

/**
 * Извлекает информацию из запроса Express
 * @param {Object} req - Express request object
 * @returns {Object} Объект с IP адресом и информацией о устройстве
 */
function getRequestInfo(req) {
  const ipAddress =
    req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress

  const userAgent = req.headers['user-agent']
  const deviceInfo = parseUserAgent(userAgent)

  return {
    ipAddress,
    deviceInfo,
  }
}

export const DeviceUtils = {
  parseUserAgent,
  getBrowserName,
  getOSName,
  getRequestInfo,
}
