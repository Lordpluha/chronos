import React, { useContext, useMemo } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';
import styles from './Week.module.css';

export const Week = () => {
  const { daySelected, setDaySelected, filteredEvents, setSelectedEvent, setShowEventModal } = useContext(CalendarContext);

  const labelColorMap = {
    indigo: "bg-indigo-200",
    gray: "bg-gray-200",
    green: "bg-green-200",
    blue: "bg-blue-200",
    red: "bg-red-200",
    purple: "bg-purple-200",
  };

  // Get the week days starting from Sunday
  const weekDays = useMemo(() => {
    const startOfWeek = daySelected.startOf('week'); // Sunday
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }, [daySelected]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day, hour) => {
    return filteredEvents.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
      // В будущем можно добавить фильтрацию по времени
    });
  };

  const isToday = (day) => {
    return day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  };

  const handleEventClick = (evt, day) => {
    setDaySelected(day);
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Week header with dates */}
      <div className={`grid border-b sticky top-0 bg-white z-10 pr-[6px] ${styles.weekGrid}`}>
        <div className="p-2 border-r text-xs text-gray-500 text-right pr-3 flex items-center justify-end">Time</div>
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className={`py-4 text-center border-r ${
              isToday(day) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-xs text-gray-500 uppercase">
              {day.format('ddd')}
            </div>
            <div
              className={`text-2xl font-semibold mt-1 ${
                isToday(day)
                  ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                  : 'text-gray-700'
              }`}
            >
              {day.format('DD')}
            </div>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-custom">
        {hours.map((hour) => (
          <div key={hour} className={`grid border-b min-h-[80px] ${styles.weekGrid}`}>
            <div className="p-2 border-r text-xs text-gray-500 text-right pr-3">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            {weekDays.map((day, idx) => {
              const events = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={idx}
                  className={`border-r p-1 hover:bg-gray-50 cursor-pointer ${
                    isToday(day) ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => setDaySelected(day)}
                >
                  {hour === 8 && events.map((evt, eventIdx) => (
                    <div
                      key={eventIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(evt, day);
                      }}
                      className={`${labelColorMap[evt.label] || 'bg-blue-200'} p-2 rounded text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <div className="font-semibold truncate">{evt.title}</div>
                      {evt.description && (
                        <div className="text-gray-600 truncate">{evt.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
