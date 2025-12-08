import { CalendarContext } from "@shared/context/CalendarContext";
import dayjs from "dayjs";
import React, { useContext, useEffect, useState } from "react";

export default function Day({ day }) {
  const [dayEvents, setDayEvents] = useState([]);
  const { setDaySelected, setShowEventModal, filteredEvents, daySelected, setSelectedEvent } =
    useContext(CalendarContext);

  useEffect(() => {
    const events = filteredEvents.filter(
      (evt) => dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
    setDayEvents(events)
  }, [filteredEvents, day]);

  function getCurrentDayClass() {
    const today = dayjs().format("DD-MM-YYYY");
    const currentDay = day.format("DD-MM-YYYY");
    const selected = daySelected && daySelected.format("DD-MM-YYYY") === currentDay;

    if (today === currentDay) {
      return "bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center";
    } else if (selected) {
      return "bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center font-bold";
    }
    return "";
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 flex flex-col p-0.5 md:p-1 h-full box-border">
      <header className="flex flex-col items-center">
        <p className={`text-xs md:text-sm text-center ${getCurrentDayClass()}`}>
          {day.format("DD")}
        </p>
      </header>
      <div
        className="flex-1 cursor-pointer overflow-y-auto scrollbar-custom"
        onClick={() => {
          setDaySelected(day);
          setSelectedEvent(null);
          setShowEventModal(true);
        }}
      >
        {dayEvents.map((evt, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              // Запрещаем редактирование напоминаний и задач через календарь
              if (evt.isReminder || evt.calendarId === 'tasks') {
                return;
              }
              setDaySelected(day);
              setSelectedEvent(evt);
              setShowEventModal(true);
            }}
            className={`p-0.5 md:p-1 mr-1 md:mr-3 text-gray-700 dark:text-gray-200 text-[10px] md:text-xs rounded mb-0.5 md:mb-1 truncate box-border ${
              evt.isReminder || evt.calendarId === 'tasks'
                ? 'cursor-default'
                : 'cursor-pointer hover:opacity-80'
            } transition-opacity`}
            style={{
              backgroundColor: evt.color ? `${evt.color}33` : '#3b82f633',
              borderLeft: `2px md:border-l-4 solid ${evt.color || '#3b82f6'}`
            }}
          >
            <div className="font-medium truncate flex items-center gap-1">
              {evt.is_recurring && <span className="text-[10px]">🔁</span>}
              {evt.title}
            </div>
            {evt.startTime && (
              <div className="text-[9px] md:text-[10px] opacity-75 hidden md:block">
                {evt.startTime}
                {evt.endTime && ` - ${evt.endTime}`}
              </div>
            )}
            {evt.subtasks && evt.subtasks.length > 0 && (
              <div className="text-[9px] md:text-[10px] opacity-75 mt-0.5 hidden md:block">
                ✓ {evt.subtasks.filter(st => st.completed).length}/{evt.subtasks.length}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
