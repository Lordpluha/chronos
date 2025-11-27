import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EventApi } from '@entities/Event';
import { toast } from 'sonner';

// Query key factory
export const eventKeys = {
  all: ['events'],
  lists: () => [...eventKeys.all, 'list'],
  list: (filters) => [...eventKeys.lists(), { filters }],
  details: () => [...eventKeys.all, 'detail'],
  detail: (id) => [...eventKeys.details(), id],
  calendar: (calendarId) => [...eventKeys.all, 'calendar', calendarId],
};

// Hook to get all events
export function useEvents(params = {}) {
  const { enabled, ...filters } = params;
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => EventApi.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled !== undefined ? enabled : true, // По умолчанию enabled=true, но можно переопределить
  });
}

// Hook to get events by calendar
export function useEventsByCalendar(calendarId) {
  return useQuery({
    queryKey: eventKeys.calendar(calendarId),
    queryFn: () => EventApi.getByCalendar(calendarId),
    enabled: !!calendarId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to get event by ID
export function useEvent(eventId) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => EventApi.getById(eventId),
    enabled: !!eventId,
  });
}

// Hook to create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => EventApi.create(data),
    onSuccess: () => {
      // Just refetch, no optimistic updates to avoid duplicates
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event created successfully');
    },
    onError: (err) => {
      console.error('Create event error:', err);
      toast.error(err.response?.data?.message || 'Failed to create event');
    },
  });
}

// Hook to update event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => {
      console.log('🔄 useUpdateEvent: Sending to API', { id, data });
      return EventApi.update(id, data);
    },
    onSuccess: (response) => {
      console.log('✅ useUpdateEvent: Success response', response);
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      // Toast показывается в Week.jsx и DayView.jsx после проверки обновления
    },
    onError: (err) => {
      console.error('❌ Update event error:', err);
      toast.error(err.response?.data?.message || 'Failed to update event');
    },
  });
}

// Hook to delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId) => EventApi.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event deleted successfully');
    },
    onError: (err) => {
      console.error('Delete event error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete event');
    },
  });
}
