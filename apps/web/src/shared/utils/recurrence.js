import dayjs from 'dayjs';

const WEEKDAY_MAP = {
  MO: 1, // Monday
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 0, // Sunday
};

/**
 * Генерирует экземпляры повторяющегося события в заданном диапазоне
 * @param {Object} event - Основное событие
 * @param {Date} rangeStart - Начало диапазона
 * @param {Date} rangeEnd - Конец диапазона
 * @param {number} maxOccurrences - Максимальное количество экземпляров
 * @returns {Array} Массив экземпляров события
 */
export function expandRecurringEvent(event, rangeStart, rangeEnd, maxOccurrences = 500) {
  if (!event.is_recurring || !event.recurrence) {
    return [event];
  }

  const { frequency, interval = 1, byWeekday, byMonthDay, count, until } = event.recurrence;
  const occurrences = [];

  const eventStart = dayjs(event.day);

  // Вычисляем длительность события в минутах
  let eventDuration;
  if (typeof event.startTime === 'string' && typeof event.endTime === 'string') {
    // Если это строки времени (HH:mm)
    eventDuration = dayjs(event.endTime, 'HH:mm').diff(dayjs(event.startTime, 'HH:mm'), 'minute');
  } else {
    // Если это даты или timestamps
    eventDuration = dayjs(event.endTime).diff(dayjs(event.startTime), 'minute');
  }

  // Защита от отрицательной длительности
  if (eventDuration <= 0) {
    eventDuration = 60; // По умолчанию 1 час
  }

  let current = eventStart;
  let occurrenceCount = 0;

  const maxDate = until
    ? dayjs(Math.min(new Date(until).getTime(), rangeEnd.getTime()))
    : dayjs(rangeEnd);

  while (current.isBefore(maxDate) || current.isSame(maxDate, 'day')) {
    // Проверяем лимит повторений
    if (count && occurrenceCount >= count) break;
    if (occurrenceCount >= maxOccurrences) break;

    // Проверяем попадает ли текущая дата в диапазон
    const inRange = (current.isAfter(rangeStart) || current.isSame(rangeStart, 'day')) &&
                    (current.isBefore(rangeEnd) || current.isSame(rangeEnd, 'day'));

    if (inRange) {
      // Для weekly проверяем день недели
      if (frequency === 'weekly' && byWeekday && byWeekday.length > 0) {
        const currentWeekday = current.day();
        const isValidWeekday = byWeekday.some(day => WEEKDAY_MAP[day] === currentWeekday);

        if (isValidWeekday) {
          occurrences.push(createOccurrence(event, current, eventDuration, occurrenceCount));
          occurrenceCount++;
        }
      } else {
        occurrences.push(createOccurrence(event, current, eventDuration, occurrenceCount));
        occurrenceCount++;
      }
    } else if (current.isAfter(rangeEnd)) {
      // Если вышли за конец диапазона, но еще не достигли лимита,
      // продолжаем только если есть count ограничение
      if (!count) break;
    }

    // Переходим к следующей дате
    current = getNextOccurrence(current, frequency, interval, byWeekday, byMonthDay);

    // Дополнительная защита от бесконечного цикла
    if (current.isAfter(dayjs().add(10, 'year'))) break;
  }

  return occurrences;
}

/**
 * Создает экземпляр события для конкретной даты
 */
function createOccurrence(event, date, duration, index) {
  // Получаем время начала события
  let startTime = event.startTime;
  if (typeof startTime !== 'string' || !startTime.includes(':')) {
    // Если startTime не строка формата HH:mm, извлекаем из даты
    startTime = dayjs(event.startTime || event.day).format('HH:mm');
  }

  const [hours, minutes] = startTime.split(':');
  const occurrenceStart = date.hour(parseInt(hours)).minute(parseInt(minutes)).second(0);
  const occurrenceEnd = occurrenceStart.add(duration, 'minute');

  return {
    ...event,
    id: `${event.id}-occurrence-${index}`,
    _id: `${event._id}-occurrence-${index}`,
    day: occurrenceStart.valueOf(),
    startTime: occurrenceStart.format('HH:mm'),
    endTime: occurrenceEnd.format('HH:mm'),
    isRecurringInstance: true,
    originalEventId: event.id || event._id,
    occurrenceIndex: index,
  };
}

/**
 * Вычисляет следующую дату повторения
 */
function getNextOccurrence(current, frequency, interval, byWeekday, byMonthDay) {
  switch (frequency) {
    case 'daily':
      return current.add(interval, 'day');

    case 'weekly':
      if (byWeekday && byWeekday.length > 0) {
        // Сортируем дни недели для правильного порядка
        const sortedDays = [...byWeekday].map(d => WEEKDAY_MAP[d]).sort((a, b) => a - b);
        const currentWeekday = current.day();

        // Ищем следующий день в текущей неделе
        for (const targetDay of sortedDays) {
          if (targetDay > currentWeekday) {
            const daysToAdd = targetDay - currentWeekday;
            return current.add(daysToAdd, 'day');
          }
        }

        // Если не нашли в текущей неделе, берем первый день из следующей недели цикла
        const firstDay = sortedDays[0];
        const daysUntilNextWeek = 7 - currentWeekday + firstDay;
        const weeksToSkip = interval - 1; // минус текущая неделя
        return current.add(daysUntilNextWeek + (weeksToSkip * 7), 'day');
      }
      return current.add(interval * 7, 'day');

    case 'monthly':
      if (byMonthDay && byMonthDay.length > 0) {
        const nextMonth = current.add(interval, 'month');
        const targetDay = Math.min(...byMonthDay);
        return nextMonth.date(Math.min(targetDay, nextMonth.daysInMonth()));
      }
      return current.add(interval, 'month');

    case 'yearly':
      return current.add(interval, 'year');

    default:
      return current.add(1, 'day');
  }
}

/**
 * Расширяет массив событий, раскрывая повторяющиеся события
 */
export function expandEvents(events, rangeStart, rangeEnd) {
  const expanded = [];

  for (const event of events) {
    if (event.is_recurring) {
      const occurrences = expandRecurringEvent(event, rangeStart, rangeEnd);
      expanded.push(...occurrences);
    } else {
      expanded.push(event);
    }
  }

  return expanded;
}

/**
 * Получает краткое описание правила повторения
 */
export function getRecurrenceSummary(recurrence) {
  if (!recurrence) return null;

  const { frequency, interval = 1, byWeekday, count, until } = recurrence;

  let summary = '';

  if (interval === 1) {
    summary = frequency === 'daily' ? 'Daily'
            : frequency === 'weekly' ? 'Weekly'
            : frequency === 'monthly' ? 'Monthly'
            : 'Yearly';
  } else {
    summary = `Every ${interval} ${frequency === 'daily' ? 'days'
            : frequency === 'weekly' ? 'weeks'
            : frequency === 'monthly' ? 'months'
            : 'years'}`;
  }

  if (frequency === 'weekly' && byWeekday && byWeekday.length > 0) {
    const days = byWeekday.map(d => {
      const dayName = Object.keys(WEEKDAY_MAP).find(k => WEEKDAY_MAP[k] === d);
      return dayName || d;
    }).join(', ');
    summary += ` on ${days}`;
  }

  if (count) {
    summary += `, ${count} times`;
  } else if (until) {
    summary += `, until ${dayjs(until).format('MMM D, YYYY')}`;
  }

  return summary;
}
