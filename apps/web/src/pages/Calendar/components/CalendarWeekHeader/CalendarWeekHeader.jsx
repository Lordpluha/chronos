import React from 'react';

export default function CalendarWeekHeader() {
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
