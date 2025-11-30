import React from 'react';
import { useCalendarSettings } from '@shared/hooks/useCalendarSettings';

export default function CalendarWeekHeader() {
  const { settings } = useCalendarSettings();

  const weekDaysFromSunday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekDaysFromMonday = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const weekDays = settings.weekStartsOn === 'sunday' ? weekDaysFromSunday : weekDaysFromMonday;

  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekDays.map((day, idx) => (
        <div key={idx} className="border border-b-0 border-gray-200 last:border-r-0 py-2 text-center">
          <p className="text-sm font-medium text-gray-600">{day}</p>
        </div>
      ))}
    </div>
  );
}
