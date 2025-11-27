import { useEffect } from 'react';
import { useReminders } from '@features/Reminders';
import './RemindersWidget.css';

export const RemindersWidget = ({ limit = 5, onReminderClick }) => {
  const { reminders, loading, error, fetchReminders } = useReminders({ upcoming: 24 });

  useEffect(() => {
    fetchReminders();
  }, []);

  const getUpcomingReminders = () => {
    const now = new Date();
    return reminders
      .filter(r => new Date(r.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, limit);
  };

  const formatTimeUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `через ${diffMins} мин`;
    } else if (diffHours < 24) {
      return `через ${diffHours} ч`;
    } else if (diffDays === 1) {
      return 'завтра';
    } else {
      return `через ${diffDays} дн`;
    }
  };

  const upcomingReminders = getUpcomingReminders();

  if (loading) {
    return (
      <div className="reminders-widget">
        <div className="widget-header">
          <h3 className="widget-title">Ближайшие напоминания</h3>
        </div>
        <div className="widget-loading">
          <div className="spinner-small"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reminders-widget">
        <div className="widget-header">
          <h3 className="widget-title">Ближайшие напоминания</h3>
        </div>
        <div className="widget-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reminders-widget">
      <div className="widget-header">
        <h3 className="widget-title">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 4.5V9L12 12M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ближайшие напоминания
        </h3>
        <span className="widget-count">{upcomingReminders.length}</span>
      </div>

      {upcomingReminders.length === 0 ? (
        <div className="widget-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Нет предстоящих напоминаний</p>
        </div>
      ) : (
        <div className="widget-content">
          {upcomingReminders.map(reminder => (
            <div
              key={reminder._id}
              className="widget-reminder-item"
              onClick={() => onReminderClick?.(reminder)}
            >
              <div className="widget-reminder-dot"></div>
              <div className="widget-reminder-info">
                <h4 className="widget-reminder-title">{reminder.title}</h4>
                <span className="widget-reminder-time">
                  {formatTimeUntil(reminder.start)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
