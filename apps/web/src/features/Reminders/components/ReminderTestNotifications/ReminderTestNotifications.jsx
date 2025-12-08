import React, { useState } from 'react';
import { Button } from '@shared/ui/button';
import dayjs from 'dayjs';
import { RemindersApi } from '../../api/RemindersApi';
import { toast } from 'sonner';

export const ReminderTestNotifications = ({ calendars }) => {
  const [creating, setCreating] = useState(false);

  const createTestReminder = async (minutesFromNow) => {
    if (!calendars || calendars.length === 0) {
      toast.error('No calendars available');
      return;
    }

    setCreating(true);
    try {
      const defaultCalendar = calendars.find(cal => cal.is_default) || calendars[0];
      const reminderTime = dayjs().add(minutesFromNow, 'minute');

      await RemindersApi.createReminder({
        title: `Test Reminder (${minutesFromNow}min)`,
        description: `This reminder will fire in ${minutesFromNow} minutes at ${reminderTime.format('HH:mm')}`,
        reminder_at: reminderTime.toISOString(),
        calendar_id: defaultCalendar.id,
      });

      toast.success(`Test reminder created for ${reminderTime.format('HH:mm')}`, {
        description: `Will notify ${minutesFromNow === 16 ? '15 minutes before' : 'at the time'}`,
      });
    } catch (error) {
      toast.error('Failed to create test reminder');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="text-sm font-semibold mb-3 text-gray-700">
        🧪 Test Reminder Notifications
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => createTestReminder(16)}
          disabled={creating}
          className="w-full text-xs"
          variant="outline"
        >
          15-min warning (16min from now)
        </Button>

        <Button
          onClick={() => createTestReminder(1)}
          disabled={creating}
          className="w-full text-xs"
          variant="outline"
        >
          Immediate notification (1min from now)
        </Button>
      </div>

      <div className="mt-3 text-[10px] text-gray-500 border-t pt-2">
        <div>✅ 15min: Blue info toast</div>
        <div>⚠️ 0min: Yellow warning toast</div>
        <div className="mt-1 text-gray-400">
          Checks every 60 seconds
        </div>
      </div>
    </div>
  );
};
