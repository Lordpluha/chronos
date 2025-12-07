import React from 'react';
import { useCalendarSettings } from '@shared/hooks/useCalendarSettings';

export default function CalendarWeekHeader() {
  const { settings } = useCalendarSettings();

  const weekDaysFromSunday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekDaysFromMonday = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Короткие названия для мобильных
  const weekDaysShortFromSunday = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDaysShortFromMonday = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const weekDays = settings.weekStartsOn === 'sunday' ? weekDaysFromSunday : weekDaysFromMonday;
  const weekDaysShort = settings.weekStartsOn === 'sunday' ? weekDaysShortFromSunday : weekDaysShortFromMonday;

  return (
    <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
      {weekDays.map((day, idx) => (
        <div key={idx} className="border border-b-0 border-gray-200 dark:border-gray-700 last:border-r-0 py-1 md:py-2 text-center">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 dark:text-gray-400">
            <span className="md:hidden">{weekDaysShort[idx]}</span>
            <span className="hidden md:inline">{day}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
