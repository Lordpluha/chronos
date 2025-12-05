import React, { useState, useContext, useEffect } from "react";
import { useSearchParams } from "react-router";
import { CalendarHeader } from "../components/CalendarHeader";
import { Sidebar } from "../components/Sidebar";
import { Month } from "../components/Month";
import { Year } from "../components/Year";
import { Week } from "../components/Week";
import { DayView } from "../components/DayView";
import { CalendarWeekHeader } from "../components/CalendarWeekHeader";
import { getMonth } from "@shared/utils/calendar";
import { useCalendarSettings } from "@shared/hooks/useCalendarSettings";
import { CalendarContext } from "@shared/context/CalendarContext";
import { EventModal } from "../components/EventModal";

export function CalendarPage() {
  const { monthIndex, showEventModal, viewMode, isLoadingEvents, eventsError, setShowEventModal, setSelectedEvent, savedEvents, refetchCalendars, refetchEvents } = useContext(CalendarContext);
  const { settings } = useCalendarSettings();
  const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex, settings.weekStartsOn));
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRefetchingFromUrl, setIsRefetchingFromUrl] = useState(false);
  const [processedEventId, setProcessedEventId] = useState(null); // Отслеживаем обработанные события
  const [processedCalendarId, setProcessedCalendarId] = useState(null); // Отслеживаем обработанные календари

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex, settings.weekStartsOn));
  }, [monthIndex, settings.weekStartsOn]);

  // Открываем событие из URL параметра ?event=ID
  useEffect(() => {
    const eventId = searchParams.get('event');
    const calendarId = searchParams.get('cal');
    const action = searchParams.get('action'); // Проверяем action=accept

    // Пропускаем если уже обрабатываем
    if (isRefetchingFromUrl) {
      return;
    }

    // Если есть eventId и мы еще не начали загрузку
    if (eventId && !processedEventId) {
      setIsRefetchingFromUrl(true);
      setProcessedEventId(eventId); // Помечаем как обрабатываемый
      Promise.all([refetchCalendars(), refetchEvents()]).then(() => {
        setIsRefetchingFromUrl(false);
        // НЕ сбрасываем processedEventId - пусть следующий useEffect обработает событие
      }).catch(error => {
        console.error('❌ Failed to refetch data:', error);
        setIsRefetchingFromUrl(false);
        setProcessedEventId(null);
      });
      return;
    }

    // Если уже загрузили данные и есть eventId
    if (eventId && processedEventId === eventId && savedEvents && savedEvents.length > 0) {
      const event = savedEvents.find(e => e.id === eventId || e._id === eventId);
      if (event) {
        // НЕ открываем модалку, просто очищаем URL
        // Событие уже в календаре благодаря filteredEvents
        searchParams.delete('event');
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
        setProcessedEventId(null); // Сбрасываем после успешной обработки
      } else {
        // Попробуем загрузить событие напрямую через API
        import('@entities/Event/api/EventApi').then(({ EventApi }) => {
          EventApi.getById(eventId)
            .then(async (eventData) => {
              // Если есть action=accept, принимаем приглашение
              if (action === 'accept') {
                try {
                  const updatedEvent = await EventApi.updateMyStatus(eventId, 'accepted');

                  // Перезагружаем события чтобы получить обновленный список
                  await refetchEvents();

                  // Даем время React Query обновить кэш
                  await new Promise(resolve => setTimeout(resolve, 1000));

                  // Очищаем query параметры
                  searchParams.delete('event');
                  searchParams.delete('action');
                  setSearchParams(searchParams, { replace: true });
                  setProcessedEventId(null);

                  // Показываем уведомление
                  import('sonner').then(({ toast }) => {
                    toast.success(`Event "${eventData.title}" has been added to your calendar`);
                  });
                } catch (acceptError) {
                  console.error('❌ Failed to accept invitation:', acceptError);
                  import('sonner').then(({ toast }) => {
                    toast.error('Failed to accept invitation');
                  });
                  searchParams.delete('event');
                  searchParams.delete('action');
                  setSearchParams(searchParams, { replace: true });
                  setProcessedEventId(null);
                }
              } else {
                // Просто показываем что событие доступно
                searchParams.delete('event');
                setSearchParams(searchParams, { replace: true });
                setProcessedEventId(null);
              }
            })
            .catch(error => {
              console.error('❌ Failed to load event from API:', error);
              // Показываем уведомление пользователю
              import('sonner').then(({ toast }) => {
                toast.error('Event not found or you don\'t have access to it');
              });
              // Очищаем query параметр
              searchParams.delete('event');
              searchParams.delete('action');
              setSearchParams(searchParams, { replace: true });
              setProcessedEventId(null); // Сбрасываем после обработки
            });
        });
      }
    }

    if (calendarId && !processedEventId && !processedCalendarId) {
      setProcessedCalendarId(calendarId); // Помечаем как обрабатываемый

      // Попытка загрузить календарь и подписаться на него
      import('@entities/Calendar/api/CalendarApi').then(({ CalendarApi }) => {
        CalendarApi.getById(calendarId)
          .then(async (calendarData) => {
            // Автоматически подписываемся на календарь
            try {
              await CalendarApi.subscribe(calendarId, {
                permission: 'read'  // Только на чтение
              });

              // Перезагружаем календари чтобы получить обновленный список
              await refetchCalendars();

              // Очищаем query параметр
              searchParams.delete('cal');
              setSearchParams(searchParams, { replace: true });
              setProcessedCalendarId(null); // Сбрасываем после успешной обработки

              // Показываем уведомление
              import('sonner').then(({ toast }) => {
                toast.success(`Calendar "${calendarData.title}" has been added to your calendars`);
              });
            } catch (subscribeError) {
              console.error('❌ Failed to subscribe to calendar:', subscribeError);
              // Если не удалось подписаться - показываем уведомление
              import('sonner').then(({ toast }) => {
                toast.info(`Calendar "${calendarData.title}" is view-only. You can see it but it's not added to your list.`);
              });
              searchParams.delete('cal');
              setSearchParams(searchParams, { replace: true });
              setProcessedCalendarId(null);
            }
          })
          .catch(error => {
            console.error('❌ Failed to load calendar from API:', error);
            // Показываем уведомление пользователю
            import('sonner').then(({ toast }) => {
              toast.error('Calendar not found or you don\'t have access to it');
            });
            // Очищаем query параметр
            searchParams.delete('cal');
            setSearchParams(searchParams, { replace: true });
            setProcessedCalendarId(null);
          });
      });
    }

    // Обработка приглашения в календарь: ?calendar=ID&action=accept
    const calendarInviteId = searchParams.get('calendar');
    if (calendarInviteId && action === 'accept' && !processedCalendarId) {
      setProcessedCalendarId(calendarInviteId);

      import('@entities/Calendar/api/CalendarApi').then(({ CalendarApi }) => {
        CalendarApi.acceptInvitation(calendarInviteId)
          .then(async (calendarData) => {
            // Перезагружаем календари чтобы получить обновленный список
            await refetchCalendars();

            // Очищаем query параметры
            searchParams.delete('calendar');
            searchParams.delete('action');
            setSearchParams(searchParams, { replace: true });
            setProcessedCalendarId(null);

            // Показываем уведомление
            import('sonner').then(({ toast }) => {
              toast.success(`Calendar invitation accepted! "${calendarData.calendar?.title || 'Calendar'}" has been added to your calendars`);
            });
          })
          .catch(error => {
            console.error('❌ Failed to accept calendar invitation:', error);
            // Показываем уведомление пользователю
            import('sonner').then(({ toast }) => {
              toast.error(error.response?.data?.message || 'Failed to accept calendar invitation');
            });
            // Очищаем query параметры
            searchParams.delete('calendar');
            searchParams.delete('action');
            setSearchParams(searchParams, { replace: true });
            setProcessedCalendarId(null);
          });
      });
    }
  }, [searchParams, setSelectedEvent, setShowEventModal, setSearchParams, isRefetchingFromUrl, processedEventId, processedCalendarId]);
  // НЕ включаем refetchCalendars, refetchEvents и savedEvents в зависимости!

  if (isLoadingEvents || isRefetchingFromUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {isRefetchingFromUrl ? 'Loading shared event...' : 'Loading events...'}
          </p>
        </div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Failed to load events</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{eventsError.message || 'An error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {showEventModal && <EventModal/>}
      <CalendarHeader />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {viewMode === 'day' && <DayView />}
          {viewMode === 'week' && <Week />}
          {viewMode === 'month' && (
            <>
              <CalendarWeekHeader />
              <Month month={currentMonth} />
            </>
          )}
          {viewMode === 'year' && <Year />}
        </div>
      </div>
    </div>
  );
}
