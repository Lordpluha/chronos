# Feature: Sharing (Calendar & Events)

## 📋 Описание
Эта ветка содержит полный визуал для функционала шеринга календарей и событий. Backend интеграция будет добавлена позже.

## ✨ Что добавлено

### 1. **ShareCalendarDialog** 
`apps/web/src/features/Calendar/ShareCalendar/ShareCalendarDialog.jsx`

Диалоговое окно для шеринга календарей с:
- ✅ Приглашение по email с выбором прав доступа:
  - **View only** - только просмотр
  - **Can edit** - редактирование событий
  - **Full access** - полный доступ + управление шерингом
- ✅ Публичная ссылка (включается/выключается)
- ✅ Копирование ссылки в буфер обмена
- ✅ Список людей с доступом (с аватарами)
- ✅ Удаление доступа для пользователей
- ✅ Красивый UI с градиентными аватарами

### 2. **ShareEventDialog**
`apps/web/src/features/Events/ShareEvent/ShareEventDialog.jsx`

Диалоговое окно для шеринга событий с:
- ✅ Приглашение участников (attendees) по email
- ✅ Роли участников:
  - **Organizer** - организатор
  - **Participant** - участник
  - **Viewer** - наблюдатель
- ✅ Статусы участников:
  - **Pending** - ожидает ответа
  - **Accepted** - принял приглашение
  - **Declined** - отклонил
  - **Tentative** - под вопросом
- ✅ Копирование ссылки на событие
- ✅ Управление списком участников
- ✅ Цветные бейджи для статусов и ролей

### 3. **Интеграция в существующие компоненты**

#### CalendarFormDialog
- Добавлена кнопка **"Share"** в хедере при редактировании календаря
- При клике открывается ShareCalendarDialog

#### EventModal
- Добавлена кнопка **"Share"** в хедере при редактировании события
- При клике открывается ShareEventDialog

#### CalendarsTab (Account Settings)
- Добавлена кнопка **Share** для каждого календаря в списке
- Иконка Share2 с hover эффектом (зеленый цвет)
- Tooltips для всех кнопок действий

## 🎨 UI/UX особенности

- **Градиентные аватары** для пользователей (если нет фото)
- **Анимация** при копировании ссылки (Check иконка на 2 секунды)
- **Toast уведомления** при всех действиях
- **Темная тема** полностью поддерживается
- **Responsive** дизайн для мобильных устройств
- **Валидация** email при добавлении пользователей
- **Disabled состояния** (например, нельзя удалить organizer'a)

## 🔌 Backend интеграция (TODO)

Для работы нужно реализовать следующие API методы:

### CalendarApi
```javascript
// Поделиться календарем
CalendarApi.share(calendarId, { email, permission })

// Удалить доступ
CalendarApi.removeShare(calendarId, { email })

// Получить публичную ссылку
CalendarApi.getPublicLink(calendarId)

// Отключить публичную ссылку
CalendarApi.revokePublicLink(calendarId)

// Получить список людей с доступом
CalendarApi.getSharedWith(calendarId)
```

### EventApi
```javascript
// Пригласить участника
EventApi.invite(eventId, { email, role })

// Удалить участника
EventApi.removeAttendee(eventId, { email })

// Обновить статус участника
EventApi.updateAttendeeStatus(eventId, { status })

// Получить список участников
EventApi.getAttendees(eventId)
```

## 🚀 Как тестировать

1. Переключиться на ветку:
```bash
git checkout feature/sharing
```

2. Установить зависимости (если нужно):
```bash
npm install
```

3. Запустить dev сервер:
```bash
npm run dev
```

4. Тестирование:
   - Откройте любой календарь → нажмите Edit → кнопка Share
   - Откройте любое событие → нажмите Edit → кнопка Share
   - Account Settings → Calendars → кнопка Share у календаря

## 📝 Чек-лист

### Календари
- [x] ShareCalendarDialog компонент
- [x] Кнопка Share в CalendarFormDialog
- [x] Кнопка Share в CalendarsTab
- [x] UI для приглашений
- [x] UI для прав доступа
- [x] UI для публичной ссылки
- [x] UI для списка пользователей
- [ ] API интеграция CalendarApi.share()
- [ ] API интеграция CalendarApi.removeShare()

### События
- [x] ShareEventDialog компонент
- [x] Кнопка Share в EventModal
- [x] UI для приглашений участников
- [x] UI для ролей участников
- [x] UI для статусов участников
- [x] UI для ссылки на событие
- [ ] API интеграция EventApi.invite()
- [ ] API интеграция EventApi.removeAttendee()
- [ ] API интеграция EventApi.updateAttendeeStatus()

## 📸 Скриншоты

### ShareCalendarDialog
- Поле для email с выбором прав доступа
- Список пользователей с кнопками удаления
- Публичная ссылка с кнопкой копирования

### ShareEventDialog
- Поле для email с выбором роли
- Список участников со статусами и ролями
- Ссылка на событие с кнопкой копирования

## 🎯 Следующие шаги

1. Реализовать backend API для шеринга календарей
2. Реализовать backend API для шеринга событий
3. Интегрировать API в компоненты
4. Добавить обработку ошибок
5. Добавить loading состояния
6. Тестирование полного флоу

## 🔗 Связанные задачи

- FRONTEND_CHECKLIST.txt секция 3.6 (Sharing календарей)
- FRONTEND_CHECKLIST.txt секция 5.3.2 (Sharing событий)
