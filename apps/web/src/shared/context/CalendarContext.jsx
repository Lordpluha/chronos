import React from "react";
import { createContext } from "react";

export const CalendarContext = createContext({
  monthIndex: 0,
  setMonthIndex: (index) => {},
  SmallCalendarMonth: null,
  setSmallCalendarMonth: (index) => {},
  daySelected: null,
  setDaySelected: (day) => {},
  showEventModal: false,
  setShowEventModal: () => {},
  dispatchCalEvent: (type, payload) => {},
  savedEvents: [],
  selectedEvent: null,
  setSelectedEvent: () => {},
  setLabels: () => {},
  labels: [],
});
