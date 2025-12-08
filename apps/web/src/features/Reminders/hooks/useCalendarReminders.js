import { useState, useEffect, useCallback } from 'react';
import { RemindersApi } from '../api';

export const useCalendarReminders = (calendarId, options = {}) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReminders = useCallback(async () => {
    if (!calendarId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await RemindersApi.getCalendarReminders(calendarId, options);
      setReminders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reminders');
      console.error('Error fetching calendar reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [calendarId, JSON.stringify(options)]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const createReminder = async (data) => {
    try {
      setError(null);
      const newReminder = await RemindersApi.createReminder(calendarId, data);
      setReminders(prev => [...prev, newReminder]);
      return newReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reminder');
      throw err;
    }
  };

  const updateReminder = async (reminderId, data) => {
    try {
      setError(null);
      const updatedReminder = await RemindersApi.updateReminder(reminderId, data);
      setReminders(prev =>
        prev.map(reminder =>
          reminder._id === reminderId ? updatedReminder : reminder
        )
      );
      return updatedReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reminder');
      throw err;
    }
  };

  const deleteReminder = async (reminderId) => {
    try {
      setError(null);
      await RemindersApi.deleteReminder(reminderId);
      setReminders(prev => prev.filter(reminder => reminder._id !== reminderId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reminder');
      throw err;
    }
  };

  return {
    reminders,
    loading,
    error,
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
  };
};
