import React, { useContext } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';

export const DayView = () => {
  const { daySelected, filteredEvents, setSelectedEvent, setShowEventModal } = useContext(CalendarContext);

  const labelColorMap = {
    indigo: "bg-indigo-200",
    gray: "bg-gray-200",
    green: "bg-green-200",
    blue: "bg-blue-200",
    red: "bg-red-200",
    purple: "bg-purple-200",
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const eventsForDay = filteredEvents.filter(evt => {
    const eventDate = dayjs(evt.day);
    return eventDate.format('YYYY-MM-DD') === daySelected.format('YYYY-MM-DD');
  });

  const handleEventClick = (evt) => {
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const isToday = daySelected.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Day header */}
      <div className={`p-6 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <div className="text-sm text-gray-500 uppercase">
          {daySelected.format('dddd')}
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <div
            className={`text-5xl font-bold ${
              isToday
                ? 'bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center'
                : 'text-gray-700'
            }`}
          >
            {daySelected.format('DD')}
          </div>
          <div className="text-2xl text-gray-600">
            {daySelected.format('MMMM YYYY')}
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b min-h-20">
            <div className="w-24 p-4 border-r text-sm text-gray-500 text-right shrink-0">
              {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
            </div>
            <div
              className="flex-1 p-2 relative cursor-pointer"
              onClick={() => setShowEventModal(true)}
            >
              {hour === 8 && eventsForDay.map((evt, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(evt);
                  }}
                  className={`${labelColorMap[evt.label] || 'bg-blue-200'} p-3 rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity shadow-sm`}
                >
                  <div className="font-semibold text-base">{evt.title}</div>
                  {evt.description && (
                    <div className="text-sm text-gray-700 mt-1">{evt.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
