export class SQLShieldingClass {
  /**
   * Экранирует специальные символы для использования в SQL LIKE
   * @param {string} s
   * @returns {string}
   */
  escapeLike = (s) => {
    return s.replace(/[\\%_]/g, (ch) => '\\' + ch)
  }

  /**
   * Генерирует строку заполнителей для подготовленных выражений SQL
   * @param {string} n
   * @returns {string}
   */
  placeholders = (n) => {
    return Array(n).fill('?').join(',')
  }

  /**
   * Направление сортировки
   * @param {'asc' | 'desc'} order
   * @returns {'ASC' | 'DESC'}
   */
  dir = (order) => {
    return order === 'asc' ? 'ASC' : 'DESC'
  }

  /**
   * Ограничение количества записей в выборке
   * @param {number} limit
   * @returns {number}
   */
  limit = (limit) => Math.min(Math.max(Number(limit) || 20, 1), 100)

  /**
   * Смещение в выборке
   * @param {number} offset
   * @returns {number}
   */
  offset = (offset) => Math.max(Number(offset) || 0, 0)
}

export const SQLShielding = new SQLShieldingClass()
