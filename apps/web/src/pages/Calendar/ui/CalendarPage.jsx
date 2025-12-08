import React, { useState, useContext, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex, settings.weekStartsOn));
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRefetchingFromUrl, setIsRefetchingFromUrl] = useState(false);
  const [processedEventId, setProcessedEventId] = useState(null); // Отслеживаем обработанные события
  const [processedCalendarId, setProcessedCalendarId] = useState(null); // Отслеживаем обработанные календари

  // Защита от дублирования запросов
  const processingCalendarRef = useRef(false);
  const processingEventRef = useRef(false);

  // Логируем URL параметры при каждом рендере
  console.log('🌐 CalendarPage render, URL params:', {
    event: searchParams.get('event'),
    calendar: searchParams.get('calendar'),
    action: searchParams.get('action'),
    fullURL: window.location.href
  });

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex, settings.weekStartsOn));
  }, [monthIndex, settings.weekStartsOn]);

  // Открываем событие из URL параметра ?event=ID или принимаем приглашение ?event=ID&action=accept
  useEffect(() => {
    const eventId = searchParams.get('event');
    const action = searchParams.get('action');

    console.log('🔍 CalendarPage useEffect (event):', { eventId, action, processedEventId, isRefetchingFromUrl });

    // Пропускаем если уже обрабатываем или нет eventId
    if (!eventId || isRefetchingFromUrl) {
      return;
    }

    // Если eventId изменился - сбрасываем processedEventId
    if (processedEventId && eventId !== processedEventId) {
      console.log('🔄 Resetting processedEventId because eventId changed');
      setProcessedEventId(null);
      return;
    }

    // Если уже обработали этот event - ничего не делаем
    if (processedEventId === eventId) {
      console.log('ℹ️ Event already processed, skipping');
      return;
    }

    // Помечаем как обрабатываемый
    setProcessedEventId(eventId);

    // Обрабатываем публичную ссылку события (с action=accept или без)
    // Для публичных ссылок автоматически добавляем пользователя как участника
    console.log('🎯 Processing event public link (auto-subscribing)');

    import('@entities/Event/api/EventApi').then(({ EventApi }) => {
        // Сначала загружаем событие
        EventApi.getById(eventId)
          .then(async (eventData) => {
            console.log('✅ Event loaded:', eventData.title);

            try {
              // 1. Добавляем себя как участника (self-subscribe)
              console.log('📝 Step 1: Adding self as attendee');
              try {
                await EventApi.addAttendee(eventId, { role: 'viewer' });
                console.log('✅ Self added as attendee');
              } catch (addError) {
                console.log('ℹ️ Already an attendee:', addError.response?.data?.message || addError.message);
              }

              // 2. Принимаем приглашение
              console.log('📝 Step 2: Accepting invitation');
              await EventApi.updateMyStatus(eventId, 'accepted');
              console.log('✅ Invitation accepted');

              // 3. Инвалидируем кеш и перезагружаем данные
              console.log('🔄 Step 3: Refreshing data');
              await queryClient.invalidateQueries({ queryKey: ['events'] });
              await queryClient.invalidateQueries({ queryKey: ['calendars'] });
              await Promise.all([refetchEvents(), refetchCalendars()]);

              // 4. Даем время на обновление
              await new Promise(resolve => setTimeout(resolve, 2000));

              // 5. Очищаем URL
              searchParams.delete('event');
              searchParams.delete('action');
              setSearchParams(searchParams, { replace: true });
              setProcessedEventId(null);

              console.log('🎉 Event invitation accepted successfully');
              import('sonner').then(({ toast }) => {
                toast.success(`Event "${eventData.title}" has been added to your calendar`);
              });
            } catch (error) {
              console.error('❌ Failed to accept invitation:', error);
              import('sonner').then(({ toast }) => {
                toast.error('Failed to accept invitation');
              });
              searchParams.delete('event');
              searchParams.delete('action');
              setSearchParams(searchParams, { replace: true });
              setProcessedEventId(null);
            }
          })
          .catch(error => {
            console.error('❌ Failed to load event:', error);
            import('sonner').then(({ toast }) => {
              toast.error('Event not found or you don\'t have access to it');
            });
            searchParams.delete('event');
            searchParams.delete('action');
            setSearchParams(searchParams, { replace: true });
            setProcessedEventId(null);
          });
      });
  }, [searchParams, setSearchParams, processedEventId, isRefetchingFromUrl, queryClient, refetchEvents, refetchCalendars]);

  // Обработка приглашений в календарь: ?calendar=ID&action=accept ИЛИ ?cal=ID
  useEffect(() => {
    const calendarInviteId = searchParams.get('calendar');
    const calendarId = searchParams.get('cal');
    const action = searchParams.get('action');
    const targetCalendarId = calendarInviteId || calendarId;

    console.log('📅 CalendarPage useEffect (calendar):', { targetCalendarId, action, processedCalendarId, isProcessing: processingCalendarRef.current });

    // Пропускаем если нет calendar ID
    if (!targetCalendarId) {
      return;
    }

    // ВАЖНО: Проверяем ref для защиты от дублирования
    if (processingCalendarRef.current) {
      console.log('⚠️ Calendar processing already in progress (ref check), skipping');
      return;
    }

    // Если уже обработали этот календарь - пропускаем
    if (processedCalendarId === targetCalendarId) {
      console.log('ℹ️ Calendar already processed, skipping');
      return;
    }

    // Если есть event в URL - пропускаем (обработка событий имеет приоритет)
    if (searchParams.get('event')) {
      console.log('ℹ️ Event processing in progress, skipping calendar');
      return;
    }

    console.log('📅 Processing calendar invitation:', { targetCalendarId, action, isInvite: !!calendarInviteId });

    // Устанавливаем флаги обработки
    setProcessedCalendarId(targetCalendarId);
    processingCalendarRef.current = true;

    import('@entities/Calendar/api/CalendarApi').then(({ CalendarApi }) => {
      CalendarApi.getById(targetCalendarId)
        .then(async (calendarData) => {
          // Автоматически подписываемся на календарь
          try {
            console.log('📝 Subscribing to calendar...');
            await CalendarApi.subscribe(targetCalendarId, {
              permission: 'read'  // Только на чтение
            });

            // ВАЖНО: Инвалидируем кеш календарей
            console.log('🔄 Invalidating calendars cache...');
            await queryClient.invalidateQueries({ queryKey: ['calendars'] });

            // Перезагружаем календари
            await refetchCalendars();

            // Даем время на обновление
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Очищаем query параметры
            searchParams.delete('cal');
            searchParams.delete('calendar');
            searchParams.delete('action');
            setSearchParams(searchParams, { replace: true });
            setProcessedCalendarId(null);
            processingCalendarRef.current = false; // Сбрасываем флаг

            console.log('✅ Calendar subscription completed');

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
            searchParams.delete('calendar');
            searchParams.delete('action');
            setSearchParams(searchParams, { replace: true });
            setProcessedCalendarId(null);
            processingCalendarRef.current = false; // Сбрасываем флаг
          }
        })
        .catch(error => {
          console.error('❌ Failed to load calendar from API:', error);
          // Показываем уведомление пользователю
          import('sonner').then(({ toast }) => {
            toast.error('Calendar not found or you don\'t have access to it');
          });
          // Очищаем query параметры
          searchParams.delete('cal');
          searchParams.delete('calendar');
          searchParams.delete('action');
          setSearchParams(searchParams, { replace: true });
          setProcessedCalendarId(null);
          processingCalendarRef.current = false; // Сбрасываем флаг
        });
    });
  }, [searchParams, setSearchParams, processedCalendarId, queryClient, refetchCalendars]);
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
