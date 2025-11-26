import React, { useState, useContext, useEffect } from "react";
import { CalendarHeader } from "../components/CalendarHeader";
import { Sidebar } from "../components/Sidebar";
import { Month } from "../components/Month";
import { Year } from "../components/Year";
import { Week } from "../components/Week";
import { DayView } from "../components/DayView";
import { CalendarWeekHeader } from "../components/CalendarWeekHeader";
import { getMonth } from "@shared/utils/calendar";
import { CalendarContext } from "@shared/context/CalendarContext";
import { EventModal } from "../components/EventModal";

export function CalendarPage() {
  const { monthIndex, showEventModal, viewMode } = useContext(CalendarContext);
  const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex));

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {showEventModal && <EventModal/>}
      <CalendarHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {viewMode === 'day' && <DayView />}
          {viewMode === 'week' && <Week />}
          {viewMode === 'month' && (
            <>
              <CalendarWeekHeader />
              <Month month={currentMonth} />
            </>
          )}
          {viewMode === 'year' && <Year />}
        </div>
      </div>
    </div>
  );
}
