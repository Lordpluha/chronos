import React, { useContext } from 'react';
import clsx from 'clsx';
import { Button } from '@shared/ui/button';
import { CalendarContext } from '@shared/context/CalendarContext';

export function CreateEventButton({ className }) {
  const {setShowEventModal} = useContext(CalendarContext)
  return (
    <Button onClick={() => setShowEventModal(true)} className={clsx("w-full", className)} size="lg">
      <img src="/plus-circle.svg" alt="" />
      Create Event
    </Button>
  );
}
