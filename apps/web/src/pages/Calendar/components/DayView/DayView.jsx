import React, { useContext, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';
import { useUpdateReminder } from '@features/Reminders';
import { toast } from 'sonner';
import { ResizableDayEvent } from './ResizableDayEvent';

export const DayView = () => {
  const { daySelected, filteredEvents, setSelectedEvent, setShowEventModal, dispatchCalEvent, visibleCalendarIds } = useContext(CalendarContext);
  const { mutate: updateReminder } = useUpdateReminder();
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [localUpdates, setLocalUpdates] = useState({});
  const updateTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef(new Set());

  // Cleanup таймера при размонтировании
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Очистить localUpdates когда событие реально обновилось из API
  useEffect(() => {
    if (Object.keys(localUpdates).length === 0) return;

    // Проверить каждое локальное обновление
    Object.keys(localUpdates).forEach(eventId => {
      // Пропустить если обновление еще в процессе отправки
      if (pendingUpdatesRef.current.has(eventId)) return;

      const localUpdate = localUpdates[eventId];
      const apiEvent = filteredEvents.find(e => e.id === eventId);

      if (apiEvent) {
        // Проверить, совпадает ли endTime из API с локальным обновлением
        const matches =
          (!localUpdate.endTime || apiEvent.endTime === localUpdate.endTime) &&
          (!localUpdate.startTime || apiEvent.startTime === localUpdate.startTime) &&
          (!localUpdate.day || apiEvent.day === localUpdate.day);

        if (matches) {
          console.log('✅ Event synced with API, removing local update:', eventId);
          setLocalUpdates(prev => {
            const newUpdates = { ...prev };
            delete newUpdates[eventId];
            return newUpdates;
          });
        }
      }
    });
  }, [filteredEvents, localUpdates]);

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

    // Применить локальные обновления
    dayEvents = dayEvents.map(evt => {
      if (localUpdates[evt.id]) {
        return { ...evt, ...localUpdates[evt.id] };
      }
      return evt;
    });

    return dayEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [filteredEvents, daySelected, localUpdates]);

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
    // Запрещаем редактирование напоминаний и задач через календарь
    if (evt.calendarId === 'reminders' || evt.calendarId === 'tasks') {
      return;
    }
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const handleDragStart = (e, evt) => {
    // Запрещаем перетаскивание напоминаний и задач
    if (evt.calendarId === 'reminders' || evt.calendarId === 'tasks') {
      e.preventDefault();
      return;
    }
    setDraggedEvent(evt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Функция для выполнения реального обновления с debounce
  const scheduleUpdate = useCallback((eventId, updates) => {
    // Пометить событие как "в процессе обновления"
    pendingUpdatesRef.current.add(eventId);

    // Очистить предыдущий таймер если он есть
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Установить новый таймер - короткая задержка для группировки быстрых изменений
    updateTimeoutRef.current = setTimeout(() => {
      // Найти оригинальное событие
      const originalEvent = filteredEvents.find(e => e.id === eventId);
      if (originalEvent) {
        const updatedEvent = { ...originalEvent, ...updates };
        console.log('🚀 Sending update to server:', updatedEvent);
        dispatchCalEvent({ type: 'update', payload: updatedEvent });

        // Убрать пометку через 2 секунды (достаточно времени для API)
        setTimeout(() => {
          pendingUpdatesRef.current.delete(eventId);
        }, 2000);
      }
    }, 500);
  }, [dispatchCalEvent, filteredEvents]);

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

    if (draggedEvent.isReminder) {
      // Сразу обновить локально для напоминания
      setLocalUpdates(prev => ({
        ...prev,
        [draggedEvent.id]: {
          startTime: newStartTime,
          endTime: newEndTime,
        }
      }));

      // Обновить время напоминания на сервере
      const reminderDateTime = dayjs(draggedEvent.day)
        .hour(newStartHour)
        .minute(newStartMinute);

      updateReminder({
        id: draggedEvent.reminderId,
        data: {
          reminder_at: reminderDateTime.toISOString(),
        },
      });

      // Очистить локальное обновление через 2 секунды
      setTimeout(() => {
        setLocalUpdates(prev => {
          const newUpdates = { ...prev };
          delete newUpdates[draggedEvent.id];
          return newUpdates;
        });
      }, 2000);
    } else {
      // Сразу обновить локально
      setLocalUpdates(prev => ({
        ...prev,
        [draggedEvent.id]: {
          startTime: newStartTime,
          endTime: newEndTime,
        }
      }));

      // Запланировать обновление на сервере
      scheduleUpdate(draggedEvent.id, {
        startTime: newStartTime,
        endTime: newEndTime,
      });
    }

    setDraggedEvent(null);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
  };

  const handleResize = useCallback((updatedEvent) => {
    console.log('🔧 Resize event:', updatedEvent);

    if (updatedEvent.isReminder) {
      // Сразу обновить локально для напоминания
      setLocalUpdates(prev => ({
        ...prev,
        [updatedEvent.id]: {
          endTime: updatedEvent.endTime,
        }
      }));

      // Обновить время напоминания на сервере
      const reminderDateTime = dayjs(updatedEvent.day)
        .hour(parseInt(updatedEvent.endTime.split(':')[0]))
        .minute(parseInt(updatedEvent.endTime.split(':')[1]));

      updateReminder({
        id: updatedEvent.reminderId,
        data: {
          reminder_at: reminderDateTime.toISOString(),
        },
      });

      // Очистить локальное обновление через 2 секунды (после обновления с сервера)
      setTimeout(() => {
        setLocalUpdates(prev => {
          const newUpdates = { ...prev };
          delete newUpdates[updatedEvent.id];
          return newUpdates;
        });
      }, 2000);
    } else {
      // Сразу обновить локально
      setLocalUpdates(prev => ({
        ...prev,
        [updatedEvent.id]: {
          endTime: updatedEvent.endTime,
        }
      }));

      // Запланировать обновление на сервере
      scheduleUpdate(updatedEvent.id, {
        endTime: updatedEvent.endTime,
      });
    }
  }, [updateReminder, scheduleUpdate]);

  const isToday = daySelected.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Day header */}
      <div className={`p-6 border-b dark:border-gray-700 ${isToday ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
        <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
          {daySelected.format('dddd')}
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <div
            className={`text-5xl font-bold ${
              isToday
                ? 'bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center'
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {daySelected.format('DD')}
          </div>
          <div className="text-2xl text-gray-600 dark:text-gray-300">
            {daySelected.format('MMMM YYYY')}
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b dark:border-gray-700 min-h-20">
              <div className="w-24 p-4 border-r dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 text-right shrink-0">
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
            {eventPositions.map((pos) => (
              <ResizableDayEvent
                key={pos.event.id}
                pos={pos}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={handleEventClick}
                onResize={handleResize}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
