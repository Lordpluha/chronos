import { useQuery } from '@tanstack/react-query';
import { CalendarApi } from '@entities/Calendar';

export const calendarKeys = {
  all: ['calendars'],
  lists: () => [...calendarKeys.all, 'list'],
  list: (filters) => [...calendarKeys.lists(), { filters }],
  details: () => [...calendarKeys.all, 'detail'],
  detail: (id) => [...calendarKeys.details(), id],
};

export function useCalendars(options = {}) {
  return useQuery({
    queryKey: calendarKeys.lists(),
    queryFn: () => CalendarApi.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true, // Обновляем при возврате на вкладку
    refetchInterval: 1000 * 10, // Обновляем каждые 10 секунд для тестирования
    ...options, // Позволяет передать enabled и другие опции
  });
}

export function useCalendar(calendarId) {
  return useQuery({
    queryKey: calendarKeys.detail(calendarId),
    queryFn: () => CalendarApi.getById(calendarId),
    enabled: !!calendarId,
  });
}
