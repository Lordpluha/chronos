import React, { useContext, useMemo } from "react";
import { CalendarContext } from "@shared/context/CalendarContext";
import dayjs from "dayjs";
import { Clock, Calendar } from "lucide-react";
import { ScrollArea } from "@shared/ui/scroll-area";

export const UpcomingEvents = () => {
  const { filteredEvents, setSelectedEvent, setShowEventModal, setDaySelected } =
    useContext(CalendarContext);

  const { todayEvents, tomorrowEvents } = useMemo(() => {
    const today = dayjs().format("DD-MM-YY");
    const tomorrow = dayjs().add(1, "day").format("DD-MM-YY");

    const todayEvts = filteredEvents
      .filter((evt) => dayjs(evt.day).format("DD-MM-YY") === today)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    const tomorrowEvts = filteredEvents
      .filter((evt) => dayjs(evt.day).format("DD-MM-YY") === tomorrow)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    return { todayEvents: todayEvts, tomorrowEvents: tomorrowEvts };
  }, [filteredEvents]);

  const handleEventClick = (evt) => {
    setDaySelected(dayjs(evt.day));
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const EventCard = ({ event }) => (
    <div
      onClick={() => handleEventClick(event)}
      className="p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all mb-2"
      style={{
        backgroundColor: event.color ? `${event.color}22` : '#3b82f622',
        borderColor: event.color ? `${event.color}66` : '#3b82f666',
        color: '#374151', // gray-700
      }}
    >
      <div className="font-medium text-sm truncate">{event.title}</div>
      {event.startTime && (
        <div className="flex items-center gap-1 text-xs mt-1 opacity-80">
          <Clock className="h-3 w-3" />
          <span>
            {event.startTime}
            {event.endTime && ` - ${event.endTime}`}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Upcoming Events
      </h3>

      <ScrollArea className="h-[280px] pr-3">
        {/* Today */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Today
          </div>
          {todayEvents.length > 0 ? (
            todayEvents.map((evt) => <EventCard key={evt.id} event={evt} />)
          ) : (
            <div className="text-xs text-gray-400 italic py-2">No events today</div>
          )}
        </div>

        {/* Tomorrow */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Tomorrow
          </div>
          {tomorrowEvents.length > 0 ? (
            tomorrowEvents.map((evt) => <EventCard key={evt.id} event={evt} />)
          ) : (
            <div className="text-xs text-gray-400 italic py-2">
              No events tomorrow
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
