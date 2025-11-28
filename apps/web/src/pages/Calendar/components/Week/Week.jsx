import React, { useContext, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { CalendarContext } from '@shared/context/CalendarContext';
import { useUpdateReminder } from '@features/Reminders';
import { toast } from 'sonner';
import { ResizableWeekEvent } from './ResizableWeekEvent';
import styles from './Week.module.css';

export const Week = () => {
  const { daySelected, setDaySelected, filteredEvents, setSelectedEvent, setShowEventModal, dispatchCalEvent, visibleCalendarIds } = useContext(CalendarContext);
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

  // Получить события для конкретного дня с локальными обновлениями
  const getEventsForDay = (day) => {
    let dayEvents = filteredEvents.filter(evt => {
      const eventDate = dayjs(evt.day);
      return eventDate.format('YYYY-MM-DD') === day.format('YYYY-MM-DD');
    });

    // Применить локальные обновления
    dayEvents = dayEvents.map(evt => {
      if (localUpdates[evt.id]) {
        return { ...evt, ...localUpdates[evt.id] };
      }
      return evt;
    });

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
    // Запрещаем редактирование напоминаний и задач через календарь
    if (evt.isReminder || evt.calendarId === 'tasks') {
      return;
    }
    setDaySelected(day);
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  // Drag handlers
  const handleDragStart = (e, evt) => {
    // Запрещаем перетаскивание напоминаний и задач
    if (evt.isReminder || evt.calendarId === 'tasks') {
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

    if (draggedEvent.isReminder) {
      // Сразу обновить локально для напоминания
      setLocalUpdates(prev => ({
        ...prev,
        [draggedEvent.id]: {
          day: newDay,
          startTime: newStartTime,
          endTime: newEndTime,
        }
      }));

      // Обновить время напоминания на сервере
      const reminderDateTime = dayjs(newDay)
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
          day: newDay,
          startTime: newStartTime,
          endTime: newEndTime,
        }
      }));

      // Запланировать обновление на сервере
      scheduleUpdate(draggedEvent.id, {
        day: newDay,
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Week header with dates */}
      <div className={`grid border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 pr-1.5 ${styles.weekGrid}`}>
        <div className="p-2 border-r dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right pr-3 flex items-center justify-end">Time</div>
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className={`py-4 text-center border-r dark:border-gray-700 ${
              isToday(day) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
            }`}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              {day.format('ddd')}
            </div>
            <div
              className={`text-2xl font-semibold mt-1 ${
                isToday(day)
                  ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                  : 'text-gray-700 dark:text-gray-200'
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
            <div key={hour} className={`grid border-b dark:border-gray-700 min-h-20 relative ${styles.weekGrid}`}>
              <div className="p-2 border-r dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right pr-3">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`border-r dark:border-gray-700 relative hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    isToday(day) ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''
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
                  {eventPositions.map((pos) => (
                    <ResizableWeekEvent
                      key={pos.event.id}
                      pos={pos}
                      day={day}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={handleEventClick}
                      onResize={handleResize}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
