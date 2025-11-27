import React, { useState, useRef, useContext } from 'react';
import { CalendarContext } from '@shared/context/CalendarContext';
import { useUpdateReminder } from '@features/Reminders';
import dayjs from 'dayjs';

export const ResizableEventCard = ({ evt, day }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [height, setHeight] = useState(null);
  const cardRef = useRef(null);
  const { setDaySelected, setSelectedEvent, setShowEventModal, dispatchCalEvent } = useContext(CalendarContext);
  const { mutate: updateReminder } = useUpdateReminder();

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = cardRef.current?.offsetHeight || 40;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(40, startHeight + deltaY);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);

      if (height && height !== startHeight) {
        const minutesPerPixel = 2;
        const additionalMinutes = Math.round((height - startHeight) * minutesPerPixel);

        const originalEndTime = evt.endTime || '10:00';
        const [endHours, endMinutes] = originalEndTime.split(':').map(Number);
        const newEndTime = dayjs()
          .hour(endHours)
          .minute(endMinutes)
          .add(additionalMinutes, 'minute')
          .format('HH:mm');

        if (evt.isReminder) {
          const reminderDateTime = dayjs(evt.day)
            .hour(endHours)
            .minute(endMinutes)
            .add(additionalMinutes, 'minute');

          updateReminder({
            id: evt.reminderId,
            data: {
              reminder_at: reminderDateTime.toISOString(),
            },
          });
        } else {
          dispatchCalEvent({
            type: 'update',
            payload: {
              ...evt,
              endTime: newEndTime,
            },
          });
        }
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCardClick = (e) => {
    if (!isResizing) {
      e.stopPropagation();
      setDaySelected(day);
      setSelectedEvent(evt);
      setShowEventModal(true);
    }
  };

  const cardStyle = {
    backgroundColor: evt.color ? `${evt.color}33` : '#3b82f633',
    borderLeft: `4px solid ${evt.color || '#3b82f6'}`,
    height: height ? `${height}px` : 'auto',
    minHeight: '40px',
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="relative p-1 mr-3 text-gray-600 text-xs rounded mb-1 truncate cursor-pointer hover:opacity-80 transition-opacity group"
      style={cardStyle}
    >
      <div className="font-medium">{evt.title}</div>
      {evt.startTime && (
        <div className="text-[10px] opacity-75">
          {evt.startTime}
          {evt.endTime && ` - ${evt.endTime}`}
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500 transition-opacity"
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      />

      {isResizing && (
        <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] bg-blue-600 text-white rounded px-1 py-0.5">
          {evt.endTime}
        </div>
      )}
    </div>
  );
};
