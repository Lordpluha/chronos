export class DateTimeUtilsClass {
  /**
   * Конвертирует строку длительности в миллисекунды.
   * Поддерживаемые единицы (регистр не важен): d, h, m, s, ms.
   * Разрешены комбинации: "1h30m", "2d 4h", "2.5s", "1m,250ms".
   * @param {string} input
   * @returns {number} Миллисекунды (округление до ближайшего целого)
   * @throws {TypeError|Error} При неверном типе или формате
   * @example ```ts
      parseDurationToMs("3m")        // 180000
      parseDurationToMs("7d")        // 604800000
      parseDurationToMs("30s")       // 30000
      parseDurationToMs("30ms")      // 30
      parseDurationToMs("1h30m")     // 5400000
      parseDurationToMs("2.5s")      // 2500
      parseDurationToMs("1m 250ms")  // 60250
      parseDurationToMs("1d4h")      // 104400000
    ```
  */
  parseDurationToMs(input) {
    if (typeof input !== 'string') {
      throw new TypeError('Duration must be a string')
    }

    // Важно: "ms" ставим перед "m", чтобы не спутать милисекунды и минуты.
    const re = /(-?\d*\.?\d+)\s*(ms|[dhms])/gi

    let total = 0
    let matched = false

    for (let m; (m = re.exec(input)); ) {
      matched = true
      const value = parseFloat(m[1])
      const unit = m[2].toLowerCase()

      const mult =
        unit === 'd'
          ? 24 * 60 * 60 * 1000
          : unit === 'h'
            ? 60 * 60 * 1000
            : unit === 'm'
              ? 60 * 1000
              : unit === 's'
                ? 1000
                : /* ms */ 1

      total += value * mult
    }

    if (!matched) {
      throw new Error(
        "Invalid duration format. Use d/h/m/s/ms, e.g. '3m', '7d', '1h30m'.",
      )
    }

    return Math.round(total)
  }
}

export const DateTimeUtils = new DateTimeUtilsClass()
