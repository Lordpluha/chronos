export class SQLShielding {
  /**
   * Экранирует специальные символы для использования в SQL LIKE
   * @param {string} s
   * @returns {string}
   */
  static escapeLike = (s) => {
    return s.replace(/[\\%_]/g, (ch) => '\\' + ch)
  }

  /**
   * Генерирует строку заполнителей для подготовленных выражений SQL
   * @param {string} n
   * @returns {string}
   */
  static placeholders = (n) => {
    return Array(n).fill('?').join(',')
  }

  /**
   * Направление сортировки
   * @param {'asc' | 'desc'} order
   * @returns {'ASC' | 'DESC'}
   */
  static dir = (order) => {
    return order === 'asc' ? 'ASC' : 'DESC'
  }

  /**
   * Ограничение количества записей в выборке
   * @param {number} limit
   * @returns {number}
   */
  static limit = (limit) => Math.min(Math.max(Number(limit) || 20, 1), 100)

  /**
   * Смещение в выборке
   * @param {number} offset
   * @returns {number}
   */
  static offset = (offset) => Math.max(Number(offset) || 0, 0)
}
