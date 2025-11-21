import React, { useContext } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';

export const Year = () => {
  const { setMonthIndex, setDaySelected } = useContext(CalendarContext);
  const currentYear = dayjs().year();

  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  const getMonthDays = (monthIndex) => {
    const firstDayOfMonth = dayjs(new Date(currentYear, monthIndex, 1));
    const daysInMonth = firstDayOfMonth.daysInMonth();
    const startingDayOfWeek = firstDayOfMonth.day();

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

  return (
    <div className="h-full overflow-y-auto scrollbar-custom p-6 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{currentYear}</h2>
      </div>

      <div className="grid grid-cols-4 gap-6 pb-6">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="border border-gray-200 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">
              {month}
            </h3>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-xs text-gray-500 text-center font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {getMonthDays(monthIndex).map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDayClick(monthIndex, day)}
                  disabled={!day}
                  className={`
                    text-xs h-6 flex items-center justify-center rounded
                    ${!day ? 'invisible' : ''}
                    ${isToday(monthIndex, day)
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
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
