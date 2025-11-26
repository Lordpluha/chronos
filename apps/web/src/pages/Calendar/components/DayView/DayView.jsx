import React, { useContext, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';
import { toast } from 'sonner';

export const DayView = () => {
  const { daySelected, filteredEvents, setSelectedEvent, setShowEventModal, dispatchCalEvent, visibleCalendarIds } = useContext(CalendarContext);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null); // Для визуального превью
  const updateTimeoutRef = useRef(null); // Для debounce обновления
  const isUpdatingRef = useRef(false); // Флаг что идет обновление

  // Cleanup таймера при размонтировании
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Очистить previewEvent когда filteredEvents обновляются и содержат обновленное событие
  useEffect(() => {
    if (previewEvent && isUpdatingRef.current) {
      const updatedEventExists = filteredEvents.some(evt => {
        if (evt.id !== previewEvent.id) return false;
        // Проверить, совпадают ли время И день с превью
        return evt.day === previewEvent.day &&
               evt.startTime === previewEvent.startTime &&
               evt.endTime === previewEvent.endTime;
      });

      if (updatedEventExists) {
        setPreviewEvent(null);
        isUpdatingRef.current = false;
        // Показываем toast только здесь - когда обновление действительно завершено
        toast.success('Event updated successfully');
      }
    }
  }, [filteredEvents, previewEvent]);

  const hours = Array.from({ length: 24 }, (_, i) => i);


  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const eventsForDay = useMemo(() => {
    let dayEvents = filteredEvents
      .filter(evt => {
        const eventDate = dayjs(evt.day);
        return eventDate.format('YYYY-MM-DD') === daySelected.format('YYYY-MM-DD');
      });

    // Если есть превью, скрыть оригинальное событие и добавить превью (с проверкой фильтра)
    if (previewEvent) {
      dayEvents = dayEvents.filter(evt => evt.id !== previewEvent.id);

      // Проверить, должно ли превью событие отображаться (применить фильтр по calendar)
      const previewCalendarVisible = visibleCalendarIds.includes(previewEvent.calendarId);

      if (previewCalendarVisible) {
        dayEvents = [...dayEvents, previewEvent];
      }
    }

    return dayEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [filteredEvents, daySelected, previewEvent, visibleCalendarIds]);

  const calculateEventPositions = () => {
    const positions = [];

    eventsForDay.forEach((event) => {
      const startMinutes = timeToMinutes(event.startTime || '09:00');
      const endMinutes = timeToMinutes(event.endTime || '10:00');

      const conflicts = positions.filter(pos => {
        const posStartMinutes = timeToMinutes(pos.event.startTime || '09:00');
        const posEndMinutes = timeToMinutes(pos.event.endTime || '10:00');
        return startMinutes < posEndMinutes && endMinutes > posStartMinutes;
      });

      const column = conflicts.length;
      const maxColumns = Math.max(column + 1, ...conflicts.map(c => c.maxColumns));

      conflicts.forEach(pos => {
        pos.maxColumns = maxColumns;
      });

      positions.push({
        event,
        column,
        maxColumns,
        top: (startMinutes / 60) * 80,
        height: ((endMinutes - startMinutes) / 60) * 80,
      });
    });

    return positions;
  };

  const eventPositions = useMemo(() => calculateEventPositions(), [eventsForDay]);

  const handleEventClick = (evt) => {
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const handleDragStart = (e, evt) => {
    setDraggedEvent(evt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Функция для выполнения реального обновления с debounce
  const scheduleUpdate = useCallback((updatedEvent) => {
    // Очистить предыдущий таймер если он есть
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Установить новый таймер - короткая задержка для группировки быстрых перетаскиваний
    updateTimeoutRef.current = setTimeout(() => {
      isUpdatingRef.current = true; // Отметить что начали обновление
      dispatchCalEvent({ type: 'update', payload: updatedEvent });
      // Toast будет показан в useEffect когда данные обновятся
    }, 300);
  }, [dispatchCalEvent]);

  const handleDrop = (e, hour) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minutes = Math.floor((offsetY / 80) * 60);
    const newStartHour = hour + Math.floor(minutes / 60);
    const newStartMinute = minutes % 60;
    const newStartTime = `${String(newStartHour).padStart(2, '0')}:${String(newStartMinute).padStart(2, '0')}`;

    // Рассчитать новое endTime на основе длительности
    const oldStart = timeToMinutes(draggedEvent.startTime || '09:00');
    const oldEnd = timeToMinutes(draggedEvent.endTime || '10:00');
    const duration = oldEnd - oldStart;
    const newEndMinutes = timeToMinutes(newStartTime) + duration;
    const newEndHour = Math.floor(newEndMinutes / 60);
    const newEndMinute = newEndMinutes % 60;
    const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;

    const updatedEvent = {
      ...draggedEvent,
      day: draggedEvent.day, // Оставляем тот же день
      startTime: newStartTime,
      endTime: newEndTime,
    };

    // Показать превью и запланировать обновление
    setPreviewEvent(updatedEvent);
    scheduleUpdate(updatedEvent);
    setDraggedEvent(null);
  };

  const handleDragEnd = () => {
    // Очистить состояние перетаскивания
    setDraggedEvent(null);
  };

  const isToday = daySelected.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Day header */}
      <div className={`p-6 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <div className="text-sm text-gray-500 uppercase">
          {daySelected.format('dddd')}
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <div
            className={`text-5xl font-bold ${
              isToday
                ? 'bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center'
                : 'text-gray-700'
            }`}
          >
            {daySelected.format('DD')}
          </div>
          <div className="text-2xl text-gray-600">
            {daySelected.format('MMMM YYYY')}
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b min-h-20">
              <div className="w-24 p-4 border-r text-sm text-gray-500 text-right shrink-0">
                {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
              </div>
              <div
                className="flex-1 relative"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, hour)}
              />
            </div>
          ))}

          {/* Render events as absolutely positioned overlays */}
          <div className="absolute top-0 left-24 right-0 pointer-events-none" style={{ height: `${hours.length * 80}px` }}>
            {eventPositions.map((pos) => {
              const widthPercent = 100 / pos.maxColumns;
              const leftPercent = (pos.column / pos.maxColumns) * 100;

              return (
                <div
                  key={pos.event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, pos.event)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(pos.event);
                  }}
                  className={`absolute pointer-events-auto p-2 rounded-lg border-l-4 cursor-move hover:opacity-90 transition-all shadow-sm overflow-hidden ${
                    previewEvent?.id === pos.event.id ? 'opacity-70 ring-2 ring-blue-400' : ''
                  }`}
                  style={{
                    top: `${pos.top}px`,
                    height: `${pos.height}px`,
                    width: `calc(${widthPercent}% - 8px)`,
                    left: `calc(${leftPercent}% + 4px)`,
                    backgroundColor: pos.event.color ? `${pos.event.color}33` : '#3b82f633',
                    borderLeftColor: pos.event.color || '#3b82f6',
                  }}
                >
                  <div className="font-semibold text-sm truncate">{pos.event.title}</div>
                  {pos.event.startTime && (
                    <div className="text-xs opacity-75 mt-0.5">
                      {pos.event.startTime}
                      {pos.event.endTime && ` - ${pos.event.endTime}`}
                    </div>
                  )}
                  {pos.event.description && (
                    <div className="text-xs text-gray-600 mt-1 truncate">{pos.event.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
