import { CalendarContext } from "@shared/context/CalendarContext";
import dayjs from "dayjs";
import React, { useContext, useEffect, useState } from "react";

export default function Day({ day }) {
  const [dayEvents, setDayEvents] = useState([]);
  const { setDaySelected, setShowEventModal, savedEvents, daySelected, setSelectedEvent } =
    useContext(CalendarContext);

  const labelColorMap = {
    indigo: "bg-indigo-200",
    gray: "bg-gray-200",
    green: "bg-green-200",
    blue: "bg-blue-200",
    red: "bg-red-200",
    purple: "bg-purple-200",
  };

  useEffect(() => {
    const events = savedEvents.filter(
      (evt) => dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
    setDayEvents(events)
  }, [savedEvents, day]);

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
    <div className="border border-gray-200 flex flex-col p-1 h-full">
      <header className="flex flex-col items-center">
        <p className={`text-sm text-center ${getCurrentDayClass()}`}>
          {day.format("DD")}
        </p>
      </header>
      <div
        className="flex-1 cursor-pointer overflow-y-auto scrollbar-custom"
        onClick={() => {
          setDaySelected(day);
        }}
      >
        {dayEvents.map((evt, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setDaySelected(day);
              setSelectedEvent(evt);
              setShowEventModal(true);
            }}
            className={`${labelColorMap[evt.label] || "bg-blue-200"} p-1 mr-3 text-gray-600 text-sm rounded mb-1 truncate`}
          >
            {evt.title}
          </div>
        ))}
      </div>
    </div>
  );
}
