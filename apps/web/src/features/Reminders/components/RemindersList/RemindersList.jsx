import { useState } from 'react';
import { ReminderCard } from '../ReminderCard';

export const RemindersList = ({
  reminders = [],
  onEdit,
  onDelete,
  onShare,
  loading = false,
  error = null,
  emptyMessage = 'No reminders'
}) => {
  const [filter, setFilter] = useState('upcoming');

  const filterReminders = (reminders) => {
    const now = new Date();

    // Сначала фильтруем выполненные напоминания
    const activeReminders = reminders.filter(r => !r.completed);

    switch (filter) {
      case 'upcoming':
        return activeReminders.filter(r => {
          const reminderDate = new Date(r.start);
          const diffHours = (reminderDate - now) / 3600000;
          return diffHours > 0 && diffHours <= 24;
        });
      case 'overdue':
        return activeReminders.filter(r => new Date(r.start) < now);
      default:
        return activeReminders;
    }
  };

  const filteredReminders = filterReminders(reminders);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-base text-gray-600 dark:text-gray-300">Loading reminders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-base text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reminders</h2>
        <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              filter === 'upcoming'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-700'
            }`}
            onClick={() => setFilter('upcoming')}
          >
            Soon ({reminders.filter(r => {
              if (r.completed) return false;
              const now = new Date();
              const reminderDate = new Date(r.start);
              const diffHours = (reminderDate - now) / 3600000;
              return diffHours > 0 && diffHours <= 24;
            }).length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-700'
            }`}
            onClick={() => setFilter('all')}
          >
            All ({reminders.filter(r => !r.completed).length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              filter === 'overdue'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-700'
            }`}
            onClick={() => setFilter('overdue')}
          >
            Overdue ({reminders.filter(r => !r.completed && new Date(r.start) < new Date()).length})
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="opacity-40">
              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-base text-gray-600 dark:text-gray-300">{emptyMessage}</p>
          </div>
        ) : (
          filteredReminders.map(reminder => (
            <ReminderCard
              key={reminder._id}
              reminder={reminder}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
            />
          ))
        )}
      </div>
    </div>
  );
};
