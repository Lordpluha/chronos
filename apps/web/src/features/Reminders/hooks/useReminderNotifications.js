import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { RemindersApi } from '../api/RemindersApi';
import { useQueryClient } from '@tanstack/react-query';

export const useReminderNotifications = (reminders) => {
  const notifiedRef = useRef(new Set());
  const queryClient = useQueryClient();

  const handleSnooze = async (reminder, minutes) => {
    try {
      const currentTime = new Date(reminder.start);
      const newTime = new Date(currentTime.getTime() + minutes * 60000);

      await RemindersApi.updateReminder(reminder._id, {
        start: newTime.toISOString(),
      });

      notifiedRef.current.delete(`${reminder._id}-5min`);
      notifiedRef.current.delete(`${reminder._id}-now`);

      queryClient.invalidateQueries({ queryKey: ['reminders'] });

      toast.success(`Snoozed for ${minutes} minutes`, {
        description: `Will remind at ${newTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      });
    } catch (error) {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleComplete = async (reminder) => {
    try {
      await RemindersApi.updateReminder(reminder._id, {
        completed: true,
        completed_at: new Date().toISOString(),
      });

      notifiedRef.current.delete(`${reminder._id}-5min`);
      notifiedRef.current.delete(`${reminder._id}-now`);

      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['reminders'] });
      }, 100);
    } catch (error) {
      console.error('Failed to complete reminder:', error);
      toast.error('Failed to complete reminder');
    }
  };

  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    const checkReminders = () => {
      const now = new Date();

      const activeReminders = reminders.filter(reminder => !reminder.completed);

      activeReminders.forEach(reminder => {
        const reminderTime = new Date(reminder.start);
        const diffMinutes = Math.floor((reminderTime - now) / 60000);

        if (diffMinutes > 0 && diffMinutes <= 5 && !notifiedRef.current.has(`${reminder._id}-5min`)) {
          notifiedRef.current.add(`${reminder._id}-5min`);

          toast.info(`⏰ ${reminder.title}`, {
            description: `In ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`,
            duration: 10000,
          });
        }

        if (diffMinutes === 0 && !notifiedRef.current.has(`${reminder._id}-now`)) {
          notifiedRef.current.add(`${reminder._id}-now`);

          const toastId = toast.warning(`🔔 ${reminder.title}`, {
            description: reminder.description || 'Time for your reminder!',
            duration: 30000,
            action: {
              label: 'OK',
              onClick: () => {
                handleComplete(reminder);
                toast.dismiss(toastId);
              },
            },
            cancel: {
              label: '⏰ Snooze 10min',
              onClick: () => {
                handleSnooze(reminder, 10);
                toast.dismiss(toastId);
              },
            },
          });
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [reminders]);
};
