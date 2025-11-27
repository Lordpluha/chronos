import React, { useContext } from 'react';
import clsx from 'clsx';
import { Button } from '@shared/ui/button';
import { CalendarContext } from '@shared/context/CalendarContext';

export function CreateEventButton({ className }) {
  const {setShowEventModal} = useContext(CalendarContext)
  return (
    <Button
      onClick={() => setShowEventModal(true)}
      className={clsx(
        "w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
        "dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600",
        "shadow-md hover:shadow-lg transition-all",
        className
      )}
      size="lg"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Create Event
    </Button>
  );
}
