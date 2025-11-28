import React, { useState, useRef } from 'react';
import dayjs from 'dayjs';

export const ResizableWeekEvent = ({
  pos,
  day,
  onDragStart,
  onDragEnd,
  onClick,
  onResize
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHeight, setResizeHeight] = useState(null);
  const cardRef = useRef(null);
  const startHeightRef = useRef(null);
  const currentHeightRef = useRef(null);

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    startHeightRef.current = pos.height;
    currentHeightRef.current = pos.height;

    const startY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(20, startHeightRef.current + deltaY);
      currentHeightRef.current = newHeight;
      setResizeHeight(newHeight);
    };

    const handleMouseUp = (upEvent) => {
      upEvent.preventDefault();
      setIsResizing(false);

      const finalHeight = currentHeightRef.current;

      if (finalHeight && Math.abs(finalHeight - startHeightRef.current) > 5) {
        const pixelsPerHour = 80;
        const additionalMinutes = Math.round((finalHeight - startHeightRef.current) / pixelsPerHour * 60);

        const originalEndTime = pos.event.endTime || '10:00';
        const [endHours, endMinutes] = originalEndTime.split(':').map(Number);
        const newEndTime = dayjs()
          .hour(endHours)
          .minute(endMinutes)
          .add(additionalMinutes, 'minute')
          .format('HH:mm');

        onResize({
          ...pos.event,
          endTime: newEndTime,
        });
      }

      setResizeHeight(null);
      startHeightRef.current = null;
      currentHeightRef.current = null;

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const widthPercent = 100 / pos.maxColumns;
  const leftPercent = (pos.column / pos.maxColumns) * 100;
  const displayHeight = resizeHeight !== null ? resizeHeight : pos.height;
  const isReadOnly = pos.event.isReminder || pos.event.calendarId === 'tasks';

  return (
    <div
      ref={cardRef}
      draggable={!isResizing && !isReadOnly}
      onDragStart={(e) => onDragStart(e, pos.event)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        if (!isResizing && !isReadOnly) {
          onClick(pos.event, day);
        }
      }}
      className={`absolute pointer-events-auto p-1.5 rounded border-l-4 ${
        isReadOnly ? '' : 'hover:opacity-90'
      } transition-opacity shadow-sm overflow-hidden group ${
        isResizing ? 'cursor-ns-resize' : isReadOnly ? 'cursor-default' : 'cursor-move'
      }`}
      style={{
        top: `${pos.top}px`,
        height: `${displayHeight}px`,
        width: `calc(${widthPercent}% - 4px)`,
        left: `calc(${leftPercent}% + 2px)`,
        backgroundColor: pos.event.color ? `${pos.event.color}33` : '#3b82f633',
        borderLeftColor: pos.event.color || '#3b82f6',
      }}
    >
      <div className="font-semibold text-xs truncate">{pos.event.title}</div>
      {pos.event.startTime && (
        <div className="text-[10px] opacity-75 truncate">
          {pos.event.startTime}
          {pos.event.endTime && ` - ${pos.event.endTime}`}
        </div>
      )}
      {pos.event.subtasks && pos.event.subtasks.length > 0 && (
        <div className="text-[10px] opacity-75 mt-0.5">
          ✓ {pos.event.subtasks.filter(st => st.completed).length}/{pos.event.subtasks.length}
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize bg-transparent group-hover:bg-blue-400/20 transition-colors z-10 ${
          pos.event.isReminder || pos.event.calendarId === 'tasks' ? 'hidden' : ''
        }`}
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'none' }}
      />

      {isResizing && resizeHeight && (
        <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] bg-blue-600 text-white rounded px-1 py-0.5 z-50">
          {pos.event.startTime} - {dayjs().hour(0).minute(0).add(
            pos.event.startTime ?
            (parseInt(pos.event.startTime.split(':')[0]) * 60 + parseInt(pos.event.startTime.split(':')[1])) :
            0, 'minute'
          ).add(Math.round(displayHeight / 80 * 60), 'minute').format('HH:mm')}
        </div>
      )}
    </div>
  );
};
