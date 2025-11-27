import { useState } from 'react';
import { RemindersApi } from '../../api/RemindersApi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const ReminderCard = ({ reminder, onEdit, onDelete, onShare }) => {
  const [showActions, setShowActions] = useState(false);
  const queryClient = useQueryClient();

  const handleComplete = async (e) => {
    e.stopPropagation();
    try {
      await RemindersApi.updateReminder(reminder._id, {
        completed: true,
        completed_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder completed ✓');
    } catch (error) {
      console.error('Failed to complete reminder:', error);
      toast.error('Failed to complete reminder');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffMins < 60) {
      return `in ${diffMins} min`;
    } else if (diffHours < 24) {
      return `in ${diffHours} h`;
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const isOverdue = new Date(reminder.start) < new Date();
  const isUpcoming = () => {
    const now = new Date();
    const reminderDate = new Date(reminder.start);
    const diffHours = (reminderDate - now) / 3600000;
    return diffHours > 0 && diffHours <= 24;
  };

  const borderColor = isOverdue ? 'border-red-500' : isUpcoming() ? 'border-orange-500' : 'border-indigo-500';
  const bgColor = isOverdue ? 'bg-red-50 dark:bg-red-900/20' : isUpcoming() ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-gray-800';
  const timeColor = isOverdue ? 'text-red-600 dark:text-red-400' : isUpcoming() ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-300';

  return (
    <div
      className={`${bgColor} ${borderColor} border-l-4 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{reminder.title}</h3>
          <span className={`text-sm font-medium ${timeColor}`}>{formatDate(reminder.start)}</span>
        </div>
        {showActions && (
          <div className="flex gap-1.5 opacity-100 transition-opacity">
            <button
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-500 rounded-md transition-all"
              onClick={handleComplete}
              title="Mark as done"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-gray-200 dark:border-gray-600 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-md transition-all"
              onClick={() => onEdit(reminder)}
              title="Edit"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.16634 13.5L1.33301 14.6667L2.49967 10.8334L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-500 rounded-md transition-all"
              onClick={() => onShare(reminder)}
              title="Share"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 5.33337C13.1046 5.33337 14 4.43794 14 3.33337C14 2.2288 13.1046 1.33337 12 1.33337C10.8954 1.33337 10 2.2288 10 3.33337C10 4.43794 10.8954 5.33337 12 5.33337Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 10C5.10457 10 6 9.10457 6 8C6 6.89543 5.10457 6 4 6C2.89543 6 2 6.89543 2 8C2 9.10457 2.89543 10 4 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14.6666C13.1046 14.6666 14 13.7712 14 12.6666C14 11.5621 13.1046 10.6666 12 10.6666C10.8954 10.6666 10 11.5621 10 12.6666C10 13.7712 10.8954 14.6666 12 14.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.72656 9.00671L10.2799 11.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.2732 4.34009L5.72656 6.99342" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-gray-600 hover:border-red-600 dark:hover:border-red-500 rounded-md transition-all"
              onClick={() => onDelete(reminder)}
              title="Delete"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.33301 4.00004V2.66671C5.33301 2.31309 5.47348 1.97395 5.72353 1.7239C5.97358 1.47385 6.31272 1.33337 6.66634 1.33337H9.33301C9.68663 1.33337 10.0258 1.47385 10.2758 1.7239C10.5259 1.97395 10.6663 2.31309 10.6663 2.66671V4.00004M12.6663 4.00004V13.3334C12.6663 13.687 12.5259 14.0261 12.2758 14.2762C12.0258 14.5262 11.6866 14.6667 11.333 14.6667H4.66634C4.31272 14.6667 3.97358 14.5262 3.72353 14.2762C3.47348 14.0261 3.33301 13.687 3.33301 13.3334V4.00004H12.6663Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      {reminder.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 my-2 leading-relaxed">{reminder.description}</p>
      )}
      {reminder.calendar && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M1 5H11" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4 1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{reminder.calendar.title}</span>
        </div>
      )}
    </div>
  );
};
