import React from "react";
import { CreateEventButton } from "../CreateEventButton";
import { SmallCalendar } from "../SmallCalendar";
import { CalendarList } from "../CalendarList";
import { UpcomingEvents } from "../UpcomingEvents";
import { ScrollArea } from "@shared/ui/scroll-area";

export const Sidebar = () => {
  return (
    <aside className="border-r w-72 flex flex-col bg-white">
      <div className="p-5 shrink-0">
        <CreateEventButton />
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="px-5 pb-4">
          <SmallCalendar />
          <CalendarList />
          <UpcomingEvents />
        </div>
      </ScrollArea>
    </aside>
  );
};
