import React, { useContext } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';
import { useCalendarSettings } from '@shared/hooks/useCalendarSettings';

export const Year = () => {
  const { setMonthIndex, setDaySelected } = useContext(CalendarContext);
  const { settings } = useCalendarSettings();
  const currentYear = dayjs().year();

  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  const getMonthDays = (monthIndex) => {
    const firstDayOfMonth = dayjs(new Date(currentYear, monthIndex, 1));
    const daysInMonth = firstDayOfMonth.daysInMonth();
    let startingDayOfWeek = firstDayOfMonth.day();

    // Adjust for week start preference
    if (settings.weekStartsOn === 'monday') {
      startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    }

    const daysArray = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }

    return daysArray;
  };

  const handleDayClick = (monthIndex, day) => {
    if (day) {
      setMonthIndex(monthIndex);
      setDaySelected(dayjs(new Date(currentYear, monthIndex, day)));
    }
  };

  const isToday = (monthIndex, day) => {
    const today = dayjs();
    return (
      day &&
      today.year() === currentYear &&
      today.month() === monthIndex &&
      today.date() === day
    );
  };

  // Get day labels based on week start preference
  const getDayLabels = () => {
    if (settings.weekStartsOn === 'sunday') {
      return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    } else {
      return ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-custom p-3 md:p-6 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{currentYear}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-6">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 md:p-3 bg-white dark:bg-gray-800">
            <h3 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 text-center">
              {month}
            </h3>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1">
              {getDayLabels().map((day, idx) => (
                <div key={idx} className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {getMonthDays(monthIndex).map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDayClick(monthIndex, day)}
                  disabled={!day}
                  className={`
                    text-[10px] md:text-xs h-5 md:h-6 w-5 md:w-6 flex items-center justify-center rounded
                    ${!day ? 'invisible' : ''}
                    ${isToday(monthIndex, day)
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    ${day ? 'cursor-pointer' : ''}
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
