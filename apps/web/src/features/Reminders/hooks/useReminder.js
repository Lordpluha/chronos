import { useState, useCallback } from 'react';
import { RemindersApi } from '../api';

export const useReminder = (reminderId) => {
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReminder = useCallback(async () => {
    if (!reminderId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await RemindersApi.getReminder(reminderId);
      setReminder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reminder');
      console.error('Error fetching reminder:', err);
    } finally {
      setLoading(false);
    }
  }, [reminderId]);

  const updateReminder = async (data) => {
    try {
      setError(null);
      const updatedReminder = await RemindersApi.updateReminder(reminderId, data);
      setReminder(updatedReminder);
      return updatedReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reminder');
      throw err;
    }
  };

  const deleteReminder = async () => {
    try {
      setError(null);
      await RemindersApi.deleteReminder(reminderId);
      setReminder(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reminder');
      throw err;
    }
  };

  const shareReminder = async (userId, permission = 'read') => {
    try {
      setError(null);
      const updatedReminder = await RemindersApi.shareReminder(reminderId, userId, permission);
      setReminder(updatedReminder);
      return updatedReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share reminder');
      throw err;
    }
  };

  const removeSharedAccess = async (userId) => {
    try {
      setError(null);
      const updatedReminder = await RemindersApi.removeSharedAccess(reminderId, userId);
      setReminder(updatedReminder);
      return updatedReminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove access');
      throw err;
    }
  };

  return {
    reminder,
    loading,
    error,
    fetchReminder,
    updateReminder,
    deleteReminder,
    shareReminder,
    removeSharedAccess,
  };
};
