export const formatTimeUntil = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 0) {
    const absDiffMins = Math.abs(diffMins);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);

    if (absDiffMins < 60) {
      return `${absDiffMins} min ago`;
    } else if (absDiffHours < 24) {
      return `${absDiffHours} h ago`;
    } else {
      return `${absDiffDays} days ago`;
    }
  }

  if (diffMins < 60) {
    return `in ${diffMins} min`;
  } else if (diffHours < 24) {
    return `in ${diffHours} h`;
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else if (diffDays < 7) {
    return `in ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  }
};

export const isReminderOverdue = (dateString) => {
  return new Date(dateString) < new Date();
};

export const isReminderUpcoming = (dateString, hours = 24) => {
  const now = new Date();
  const reminderDate = new Date(dateString);
  const diffHours = (reminderDate - now) / 3600000;
  return diffHours > 0 && diffHours <= hours;
};

export const groupRemindersByStatus = (reminders) => {
  const now = new Date();

  return reminders.reduce((acc, reminder) => {
    const reminderDate = new Date(reminder.start);

    if (reminderDate < now) {
      acc.overdue.push(reminder);
    } else if (isReminderUpcoming(reminder.start)) {
      acc.upcoming.push(reminder);
    } else {
      acc.future.push(reminder);
    }

    return acc;
  }, { overdue: [], upcoming: [], future: [] });
};

export const sortRemindersByDate = (reminders, order = 'asc') => {
  return [...reminders].sort((a, b) => {
    const dateA = new Date(a.start);
    const dateB = new Date(b.start);
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

export const filterRemindersByQuery = (reminders, query) => {
  if (!query || !query.trim()) return reminders;

  const lowerQuery = query.toLowerCase().trim();

  return reminders.filter(reminder =>
    reminder.title?.toLowerCase().includes(lowerQuery) ||
    reminder.description?.toLowerCase().includes(lowerQuery) ||
    reminder.calendar?.title?.toLowerCase().includes(lowerQuery)
  );
};

export const getReminderStatusClass = (dateString) => {
  if (isReminderOverdue(dateString)) return 'overdue';
  if (isReminderUpcoming(dateString)) return 'upcoming';
  return 'future';
};
