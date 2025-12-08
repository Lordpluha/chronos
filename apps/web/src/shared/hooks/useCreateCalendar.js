import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarApi } from '@entities/Calendar';
import { toast } from 'sonner';
import { calendarKeys } from './useCalendars';

export function useCreateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => CalendarApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
      toast.success('Calendar created successfully');
      return data;
    },
    onError: (err) => {
      toast.error('Failed to create calendar');
      console.error('Calendar creation error:', err);
    },
  });
}
