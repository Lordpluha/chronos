import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarApi } from '@entities/Calendar';
import { calendarKeys } from './useCalendars';
import { eventKeys } from './useEvents';

export function useDeleteCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (calendarId) => CalendarApi.delete(calendarId),
    onSuccess: () => {
      // Invalidate both calendar and event queries
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
