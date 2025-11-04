/**
 * Маскирует чувствительную информацию для логирования
 */
export function maskSensitiveInfo(value, visibleChars = 4) {
  if (!value || value.length <= visibleChars) {
    return '*'.repeat(8)
  }
  return (
    value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars)
  )
}

/**
 * Создает разделительную линию для таблицы
 */
function createTableBorder() {
  return '┌─────────────────────────────────────────────────────────────┐'
}

/**
 * Создает нижнюю границу таблицы
 */
function createTableBottom() {
  return '└─────────────────────────────────────────────────────────────┘'
}

/**
 * Форматирует строку для таблицы
 */
function formatTableRow(label, value, maxLength = 59) {
  const content = `${label}: ${value}`
  return `│ ${content.padEnd(maxLength)} │`
}

/**
 * Логирует успешную валидацию категории
 */
export function logValidationSuccess(category) {
  console.log(
    `✅ ${category.toUpperCase()} configuration validated successfully`,
  )
}

/**
 * Логирует ошибки валидации
 */
export function logValidationErrors(errors) {
  console.error('\n❌ Configuration validation failed:')
  console.error(createTableBorder())

  errors.forEach((error) => {
    console.error(`│ ${error.padEnd(59)} │`)
  })

  console.error(createTableBottom())
  console.error('\n💡 Please check your environment variables and try again.\n')
}

/**
 * Логирует текущую конфигурацию
 */
export function logConfiguration(config, env) {
  console.log('\n🔧 Application Configuration:')
  console.log(createTableBorder())

  // Основные настройки
  console.log(formatTableRow('Environment', env))
  console.log(
    formatTableRow(
      'Backend',
      `${config.app.BACK_HOST}:${config.app.BACK_PORT}`,
    ),
  )
  console.log(
    formatTableRow(
      'Frontend',
      `${config.app.FRONT_HOST}:${config.app.FRONT_PORT}`,
    ),
  )

  // База данных (скрываем чувствительную информацию)
  const dbUri = maskSensitiveInfo(config.database.MONGODB_URI)
  console.log(formatTableRow('Database', dbUri))
  console.log(formatTableRow('DB Name', config.database.DB_NAME))

  // JWT (скрываем секрет)
  console.log(formatTableRow('JWT Secret', '*'.repeat(20)))
  console.log(
    formatTableRow('Access Token TTL', config.jwt.ACCESS_TOKEN_LIFETIME),
  )
  console.log(
    formatTableRow('Refresh Token TTL', config.jwt.REFRESH_TOKEN_LIFETIME),
  )

  // Email (скрываем пароль)
  console.log(
    formatTableRow(
      'SMTP',
      `${config.email.SMTP_HOST}:${config.email.SMTP_PORT}`,
    ),
  )
  console.log(formatTableRow('SMTP User', config.email.SMTP_USER))
  console.log(formatTableRow('SMTP Pass', '*'.repeat(10)))

  // OAuth (скрываем секрет)
  console.log(
    formatTableRow(
      'OAuth Client',
      maskSensitiveInfo(config.oauth.OAUTH_CLIENT_ID, 20),
    ),
  )
  console.log(formatTableRow('OAuth Secret', '*'.repeat(20)))

  console.log(createTableBottom())
  console.log('')
}
