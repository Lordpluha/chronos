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

    console.log('🔍 useEffect triggered:', { eventId, calendarId, action, isRefetchingFromUrl, processedEventId, savedEventsCount: savedEvents?.length });

    // Пропускаем если уже обрабатываем
    if (isRefetchingFromUrl) {
      console.log('⏳ Already refetching, skipping...');
      return;
    }

    // Если есть eventId и мы еще не начали загрузку
    if (eventId && !processedEventId) {
      console.log('🔄 Starting refetch for event:', eventId);
      setIsRefetchingFromUrl(true);
      setProcessedEventId(eventId); // Помечаем как обрабатываемый
      Promise.all([refetchCalendars(), refetchEvents()]).then(() => {
        console.log('✅ Data refetched, now looking for event...');
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
      console.log(`🔍 Looking for event ${eventId} in ${savedEvents.length} events`);
      const event = savedEvents.find(e => e.id === eventId || e._id === eventId);
      if (event) {
        console.log('📅 Event found from URL:', event.title);
        console.log('✅ Event will be displayed in calendar view');
        // НЕ открываем модалку, просто очищаем URL
        // Событие уже в календаре благодаря filteredEvents
        searchParams.delete('event');
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
        setProcessedEventId(null); // Сбрасываем после успешной обработки
      } else {
        console.warn('⚠️ Event not found in savedEvents:', eventId);
        console.log('Available event IDs:', savedEvents.map(e => e.id || e._id).join(', '));
        // Попробуем загрузить событие напрямую через API
        import('@entities/Event/api/EventApi').then(({ EventApi }) => {
          console.log('📡 Loading event directly from API...');
          EventApi.getById(eventId)
            .then(async (eventData) => {
              console.log('✅ Event loaded directly from API:', eventData);

              // Если есть action=accept, принимаем приглашение
              if (action === 'accept') {
                try {
                  console.log('✅ Accepting event invitation...');
                  await EventApi.updateMyStatus(eventId, 'accepted');
                  console.log('✅ Invitation accepted, refetching events...');

                  // Перезагружаем события чтобы получить обновленный список
                  await refetchEvents();

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
                console.log('ℹ️ Event is accessible');
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
      console.log('📆 Calendar link opened:', calendarId);
      setProcessedCalendarId(calendarId); // Помечаем как обрабатываемый

      // Попытка загрузить календарь и подписаться на него
      import('@entities/Calendar/api/CalendarApi').then(({ CalendarApi }) => {
        console.log('📡 Loading calendar directly from API...');
        CalendarApi.getById(calendarId)
          .then(async (calendarData) => {
            console.log('✅ Calendar loaded directly from API:', calendarData);

            // Автоматически подписываемся на календарь
            try {
              console.log('👤 Subscribing current user to calendar...');
              await CalendarApi.subscribe(calendarId, {
                permission: 'read'  // Только на чтение
              });
              console.log('✅ User subscribed to calendar, refetching calendars...');

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
  }, [searchParams, savedEvents, setSelectedEvent, setShowEventModal, setSearchParams, isRefetchingFromUrl, processedEventId]);
  // НЕ включаем refetchCalendars и refetchEvents в зависимости!

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
