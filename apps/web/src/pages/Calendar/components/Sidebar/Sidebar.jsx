import React from "react";
import { CreateEventButton } from "../CreateEventButton";
import { SmallCalendar } from "../SmallCalendar";
import { EventModal } from "../EventModal";
import { Labels } from "../Labels";

export const Sidebar = () => {
  return <aside className="border p-5 w-64">
    <CreateEventButton className="mt-4" />
    <SmallCalendar/>
    <Labels/>
  </aside>;
};
