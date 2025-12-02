import React, { useState, useContext, useEffect } from "react";
import { useSearchParams } from "react-router";
import { CalendarHeader } from "../components/CalendarHeader";
import { Sidebar } from "../components/Sidebar";
import { Month } from "../components/Month";
import { Year } from "../components/Year";
import { Week } from "../components/Week";
import { DayView } from "../components/DayView";
import { CalendarWeekHeader } from "../components/CalendarWeekHeader";
import { getMonth } from "@shared/utils/calendar";
import { useCalendarSettings } from "@shared/hooks/useCalendarSettings";
import { CalendarContext } from "@shared/context/CalendarContext";
import { EventModal } from "../components/EventModal";

export function CalendarPage() {
  const { monthIndex, showEventModal, viewMode, isLoadingEvents, eventsError, setShowEventModal, setSelectedEvent, savedEvents } = useContext(CalendarContext);
  const { settings } = useCalendarSettings();
  const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex, settings.weekStartsOn));
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex, settings.weekStartsOn));
  }, [monthIndex, settings.weekStartsOn]);

  // Открываем событие из URL параметра ?event=ID
  useEffect(() => {
    const eventId = searchParams.get('event');
    const calendarId = searchParams.get('cal');

    if (eventId && savedEvents && savedEvents.length > 0) {
      const event = savedEvents.find(e => e.id === eventId || e._id === eventId);
      if (event) {
        console.log('📅 Opening event from URL:', event);
        setSelectedEvent(event);
        setShowEventModal(true);
        // Очищаем query параметр после открытия
        searchParams.delete('event');
        setSearchParams(searchParams, { replace: true });
      } else {
        console.warn('⚠️ Event not found:', eventId);
      }
    }

    if (calendarId) {
      console.log('📆 Calendar link opened:', calendarId);
      // Очищаем query параметр
      searchParams.delete('cal');
      setSearchParams(searchParams, { replace: true });
      // TODO: Можно добавить логику для выбора календаря в sidebar
    }
  }, [searchParams, savedEvents, setSelectedEvent, setShowEventModal, setSearchParams]);

  if (isLoadingEvents) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading events...</p>
        </div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Failed to load events</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{eventsError.message || 'An error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {showEventModal && <EventModal/>}
      <CalendarHeader />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
