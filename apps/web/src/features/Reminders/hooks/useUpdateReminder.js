import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RemindersApi } from '../api/RemindersApi';
import { toast } from 'sonner';

export const useUpdateReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => RemindersApi.updateReminder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update reminder');
    },
  });
};
