import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useReminders } from '@features/Reminders';
import { RemindersList, ReminderForm } from '@features/Reminders';
import { CalendarApi } from '@entities/Calendar/api/CalendarApi';
import { Button } from '@shared/ui/button';
import { ROUTES } from '@shared/routes';

export const RemindersPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarsLoading, setCalendarsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
    fetchReminders
  } = useReminders();

  // Загружаем календари пользователя
  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const response = await CalendarApi.getAll();
        const validCalendars = response.filter(cal => cal && cal._id && cal.title);
        setCalendars(validCalendars);
      } catch (err) {
        console.error('Failed to load calendars:', err);
      } finally {
        setCalendarsLoading(false);
      }
    };

    fetchCalendars();
  }, []);

  const handleCreate = () => {
    if (calendarsLoading) {
      return;
    }
    if (calendars.length === 0) {
      alert('Please create a calendar first');
      return;
    }
    setEditingReminder(null);
    setShowModal(true);
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setShowModal(true);
  };

  const handleDelete = async (reminder) => {
    if (!confirm(`Delete reminder "${reminder.title}"?`)) {
      return;
    }

    try {
      await deleteReminder(reminder._id);
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      alert('Failed to delete reminder');
    }
  };

  const handleShare = (reminder) => {
    alert(`Share function for "${reminder.title}" is in development`);
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (editingReminder) {
        await updateReminder(editingReminder._id, formData);
      } else {
        await createReminder(formData.calendar, formData);
      }
      setShowModal(false);
      setEditingReminder(null);
      fetchReminders();
    } catch (err) {
      console.error('Failed to save reminder:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingReminder(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.calendar)}
            className="gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Calendar
          </Button>
        </div>

        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reminders</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Manage your reminders and don't miss important events
            </p>
          </div>
          <Button
            className="flex items-center gap-2 px-6 py-3"
            onClick={handleCreate}
            disabled={calendarsLoading || calendars.length === 0}
            variant="default"
            size="lg"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {calendarsLoading ? 'Loading...' : 'Create Reminder'}
          </Button>
        </div>

        <RemindersList
          reminders={reminders}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShare={handleShare}
          loading={loading}
          error={error}
        />

        {!calendarsLoading && calendars.length === 0 && (
          <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No calendars found</h3>
            <p className="text-yellow-700">
              You need to create a calendar before you can add reminders.
            </p>
          </div>
        )}

        {showModal && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingReminder ? 'Edit Reminder' : 'New Reminder'}
                </h2>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                  onClick={handleCancel}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {errorMessage && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}
                <ReminderForm
                  initialData={editingReminder || {}}
                  calendars={calendars}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
