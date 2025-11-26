import React, { useContext, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';
import { toast } from 'sonner';
import styles from './Week.module.css';

export const Week = () => {
  const { daySelected, setDaySelected, filteredEvents, setSelectedEvent, setShowEventModal, dispatchCalEvent, visibleCalendarIds } = useContext(CalendarContext);
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
        // Проверить, совпадают ли время и день с превью
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

  // Get the week days starting from Sunday
  const weekDays = useMemo(() => {
    const startOfWeek = daySelected.startOf('week'); // Sunday
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }, [daySelected]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Функция для конвертации времени в минуты с начала дня
  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Получить события для конкретного дня (включая превью)
  const getEventsForDay = (day) => {
    let dayEvents = filteredEvents.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
    });

    // Если есть превью, скрыть оригинальное событие
    if (previewEvent) {
      dayEvents = dayEvents.filter(evt => evt.id !== previewEvent.id);

      // Проверить, должно ли превью событие отображаться (применить фильтр по calendar)
      const previewCalendarVisible = visibleCalendarIds.includes(previewEvent.calendarId);

      // Добавить превью если оно для этого дня И его календарь видим
      const previewDate = dayjs(previewEvent.day);
      if (previewDate.format('YYYY-MM-DD') === day.format('YYYY-MM-DD') && previewCalendarVisible) {
        dayEvents = [...dayEvents, previewEvent];
      }
    }

    return dayEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  // Рассчитать позиционирование для наложения событий
  const calculateEventPositions = (events) => {
    const positions = [];

    events.forEach((event, index) => {
      const startMinutes = timeToMinutes(event.startTime || '09:00');
      const endMinutes = timeToMinutes(event.endTime || '10:00');

      // Найти конфликтующие события
      const conflicts = positions.filter(pos => {
        const posStartMinutes = timeToMinutes(pos.event.startTime || '09:00');
        const posEndMinutes = timeToMinutes(pos.event.endTime || '10:00');
        return startMinutes < posEndMinutes && endMinutes > posStartMinutes;
      });

      const column = conflicts.length;
      const maxColumns = Math.max(column + 1, ...conflicts.map(c => c.maxColumns));

      // Обновить maxColumns для конфликтующих событий
      conflicts.forEach(pos => {
        pos.maxColumns = maxColumns;
      });

      positions.push({
        event,
        column,
        maxColumns,
        top: (startMinutes / 60) * 80, // 80px на час
        height: ((endMinutes - startMinutes) / 60) * 80,
      });
    });

    return positions;
  };

  const isToday = (day) => {
    return day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  };

  const handleEventClick = (evt, day) => {
    setDaySelected(day);
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  // Drag handlers
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

  const handleDrop = (e, day, hour) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const newDay = day.valueOf();
    const minutes = Math.floor((e.nativeEvent.offsetY / 80) * 60);
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
      day: newDay,
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Week header with dates */}
      <div className={`grid border-b sticky top-0 bg-white z-10 pr-1.5 ${styles.weekGrid}`}>
        <div className="p-2 border-r text-xs text-gray-500 text-right pr-3 flex items-center justify-end">Time</div>
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className={`py-4 text-center border-r ${
              isToday(day) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-xs text-gray-500 uppercase">
              {day.format('ddd')}
            </div>
            <div
              className={`text-2xl font-semibold mt-1 ${
                isToday(day)
                  ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                  : 'text-gray-700'
              }`}
            >
              {day.format('DD')}
            </div>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-custom">
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className={`grid border-b min-h-20 relative ${styles.weekGrid}`}>
              <div className="p-2 border-r text-xs text-gray-500 text-right pr-3">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`border-r relative hover:bg-gray-50 ${
                    isToday(day) ? 'bg-blue-50/30' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day, hour)}
                />
              ))}
            </div>
          ))}

          {/* Render events as absolutely positioned overlays */}
          <div className={`absolute top-0 left-0 right-0 pointer-events-none grid ${styles.weekGrid}`} style={{ height: `${hours.length * 80}px` }}>
            <div className="border-r" /> {/* Time column spacer */}
            {weekDays.map((day, dayIdx) => {
              const eventsForDay = getEventsForDay(day);
              const eventPositions = calculateEventPositions(eventsForDay);

              return (
                <div key={dayIdx} className="border-r relative">
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
                          handleEventClick(pos.event, day);
                        }}
                        className={`absolute pointer-events-auto p-1.5 rounded border-l-4 cursor-move hover:opacity-90 transition-all shadow-sm overflow-hidden ${
                          previewEvent?.id === pos.event.id ? 'opacity-70 ring-2 ring-blue-400' : ''
                        }`}
                        style={{
                          top: `${pos.top}px`,
                          height: `${pos.height}px`,
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
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
