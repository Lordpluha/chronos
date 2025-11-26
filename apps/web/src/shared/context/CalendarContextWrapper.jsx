import React, { useEffect, useState, useMemo } from "react";
import { CalendarContext } from "./CalendarContext";
import dayjs from "dayjs";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useCalendars, useCreateCalendar } from "@shared/hooks";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export const CalendarContextWrapper = (props) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [monthIndex, setMonthIndex] = useState(dayjs().month());
  const [smallCalendarMonth, setSmallCalendarMonth] = useState(null);
  const [daySelected, setDaySelected] = useState(dayjs());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month', 'year'
  const [visibleCalendarIds, setVisibleCalendarIds] = useState([]); // IDs of visible calendars
  const [calendarCreated, setCalendarCreated] = useState(false); // Флаг для предотвращения дублирования

  // React Query hooks - запускаются только если пользователь авторизован
  const { data: calendarsData, isLoading: isLoadingCalendars } = useCalendars({ enabled: isAuthenticated });
  const { data: eventsData, isLoading, error } = useEvents({ enabled: isAuthenticated });
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const createCalendarMutation = useCreateCalendar();

  // Get default calendar ID
  const defaultCalendarId = useMemo(() => {
    if (!calendarsData) return null;
    const calendars = Array.isArray(calendarsData) ? calendarsData : calendarsData.calendars || [];
    const defaultCal = calendars.find(cal => cal.is_default);
    return defaultCal?._id || calendars[0]?._id || null;
  }, [calendarsData]);

  // Transform calendars data
  const calendars = useMemo(() => {
    if (!calendarsData) return [];
    const cals = Array.isArray(calendarsData) ? calendarsData : calendarsData.calendars || [];

    return cals.map(cal => ({
      id: cal._id || cal.id,
      title: cal.title,
      description: cal.description || '',
      color: cal.color || '#3b82f6',
      is_default: cal.is_default || false,
      isShared: cal.owner?.toString() !== cal.creator?.toString(), // Определяем shared календарь
    }));
  }, [calendarsData]);

  // Initialize visible calendars when calendars load
  useEffect(() => {
    if (calendars.length > 0 && visibleCalendarIds.length === 0) {
      setVisibleCalendarIds(calendars.map(cal => cal.id));
    }
  }, [calendars, visibleCalendarIds.length]);

  // Auto-create default calendar if none exists
  useEffect(() => {
    if (!isLoadingCalendars && calendarsData && !calendarCreated) {
      const calendars = Array.isArray(calendarsData) ? calendarsData : calendarsData.calendars || [];

      if (calendars.length === 0 && !createCalendarMutation.isPending) {
        console.log('No calendars found, creating default calendar...');
        setCalendarCreated(true); // Устанавливаем флаг сразу
        createCalendarMutation.mutate({
          title: 'My Calendar',
          description: 'Default calendar',
          color: '#3b82f6',
          is_default: true,
        });
      }
    }
  }, [calendarsData, isLoadingCalendars, calendarCreated, createCalendarMutation]);

  // Transform API data to match localStorage format + add calendar color
  const savedEvents = useMemo(() => {
    if (!eventsData) return [];

    // API возвращает массив напрямую, а не { events: [...] }
    const events = Array.isArray(eventsData) ? eventsData : eventsData.events || [];

    return events.map(event => {
      // Find calendar to get its color
      const calendar = calendars.find(cal =>
        cal.id === (event.calendar?._id || event.calendar)
      );

      return {
        id: event._id || event.id,
        title: event.title,
        description: event.description || '',
        day: new Date(event.start).getTime(),
        startTime: dayjs(event.start).format('HH:mm'),
        endTime: dayjs(event.end).format('HH:mm'),
        calendarId: event.calendar?._id || event.calendar,
        color: calendar?.color || '#3b82f6', // Use calendar color
      };
    });
  }, [eventsData, calendars]);

  // Dispatch function to handle CRUD operations
  const dispatchCalEvent = ({ type, payload }) => {
    switch (type) {
      case "push": {
        const calendarId = payload.calendarId || defaultCalendarId;

        if (!calendarId) {
          toast.error('Please wait, loading calendars...');
          console.error('No calendar available');
          return;
        }

        // Transform local format to API format
        const dayDate = dayjs(payload.day);
        const [startHours, startMinutes] = (payload.startTime || '09:00').split(':');
        const [endHours, endMinutes] = (payload.endTime || '10:00').split(':');

        const start = dayDate.hour(parseInt(startHours)).minute(parseInt(startMinutes)).second(0).toDate();
        const end = dayDate.hour(parseInt(endHours)).minute(parseInt(endMinutes)).second(0).toDate();

        createEventMutation.mutate({
          title: payload.title,
          description: payload.description || '',
          start: start.toISOString(),
          end: end.toISOString(),
          calendar_id: calendarId,
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        break;
      }
      case "update": {
        const dayDate = dayjs(payload.day);
        const [startHours, startMinutes] = (payload.startTime || '09:00').split(':');
        const [endHours, endMinutes] = (payload.endTime || '10:00').split(':');

        const start = dayDate.hour(parseInt(startHours)).minute(parseInt(startMinutes)).second(0).toDate();
        const end = dayDate.hour(parseInt(endHours)).minute(parseInt(endMinutes)).second(0).toDate();

        updateEventMutation.mutate({
          id: payload.id,
          data: {
            title: payload.title,
            description: payload.description || '',
            start: start.toISOString(),
            end: end.toISOString(),
          },
        });
        break;
      }
      case "delete":
        deleteEventMutation.mutate(payload.id);
        break;
      default:
        console.error("Unknown dispatch type:", type);
    }
  };

  // Filter events by visible calendars
  const filteredEvents = useMemo(() => {
    return savedEvents.filter((evt) =>
      visibleCalendarIds.includes(evt.calendarId)
    );
  }, [savedEvents, visibleCalendarIds]);

  // Toggle calendar visibility
  const toggleCalendarVisibility = (calendarId) => {
    setVisibleCalendarIds(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
      }
    });
  };

  useEffect(() => {
    if (smallCalendarMonth !== null) {
      setMonthIndex(smallCalendarMonth);
    }
  }, [smallCalendarMonth]);

  useEffect(() => {
    if (!showEventModal) {
      setSelectedEvent(null);
    }
  }, [showEventModal]);

  return (
    <CalendarContext.Provider
      value={{
        monthIndex,
        setMonthIndex,
        smallCalendarMonth,
        setSmallCalendarMonth,
        daySelected,
        setDaySelected,
        showEventModal,
        setShowEventModal,
        savedEvents,
        dispatchCalEvent,
        selectedEvent,
        setSelectedEvent,
        filteredEvents,
        viewMode,
        setViewMode,
        isLoadingEvents: authLoading || isLoading || isLoadingCalendars,
        eventsError: error,
        defaultCalendarId,
        calendars,
        visibleCalendarIds,
        toggleCalendarVisibility,
      }}
    >
      {props.children}
    </CalendarContext.Provider>
  );
};
