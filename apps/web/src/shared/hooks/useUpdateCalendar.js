import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarApi } from '@entities/Calendar';
import { calendarKeys } from './useCalendars';

export function useUpdateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ calendarId, data }) => CalendarApi.update(calendarId, data),
    onSuccess: () => {
      // Invalidate calendar queries to refetch
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}
