# Обновления функционала задач

## Дата: 28 ноября 2025

### Изменения

#### 1. Замена чекбокса на кнопку "Done" ✅

**Файл**: `apps/web/src/features/Tasks/components/TaskCard/TaskCard.jsx`

- Заменили Checkbox на Button с двумя состояниями:
  - **Не выполнено**: Кнопка "Mark Done" (outline стиль)
  - **Выполнено**: Кнопка с галочкой "Done" (зелёная, bg-green-600)
- Кнопка работает корректно и переключает состояние задачи

#### 2. Добавление задач с датами в календарь ✅

**Backend изменения**:
- `apps/api/src/modules/Tasks/Tasks.service.js`: 
  - Добавлен метод `getAllTasks(userId, filters)` для получения всех задач пользователя
  - Поддержка фильтра `hasDate` для задач с установленной датой
  
- `apps/api/src/modules/Tasks/Tasks.controller.js`:
  - Добавлен контроллер `getAllTasks` для обработки запросов

- `apps/api/src/modules/Tasks/Tasks.routes.js`:
  - Добавлен роут `GET /tasks/all` с middleware `requireAccessToken`

**Frontend изменения**:
- `apps/web/src/features/Tasks/api/TasksApi.js`:
  - Добавлен метод `getAllTasks(filters)` для API запроса

- `apps/web/src/features/Tasks/hooks/useTasks.js`:
  - Добавлен хук `useAllTasks(filters)` для получения всех задач
  - Добавлена инвалидация кэша `allTasks` во всех мутациях (create, update, toggle, delete)

- `apps/web/src/shared/context/CalendarContextWrapper.jsx`:
  - Импортирован `useAllTasks` из Features/Tasks
  - Добавлен хук для получения задач с датами: `useAllTasks({ hasDate: true, completed: false })`
  - Создан `taskEvents` memo для преобразования задач в события календаря
  - Задачи отображаются с зелёной меткой ✓ и зелёным цветом (#22c55e)
  - Задачи автоматически показываются в календаре (calendarId: 'tasks')
  - Добавлена логика фильтрации событий, чтобы задачи всегда были видимы

#### 3. Исправление проблемы с отображением ремайндеров ✅

**Файл**: `apps/web/src/shared/context/CalendarContextWrapper.jsx`

- Добавлен `fetchReminders` из хука `useReminders()`
- Добавлен `useEffect` для автоматической загрузки ремайндеров после авторизации:
  ```javascript
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('🔄 Fetching reminders after auth...');
      fetchReminders();
    }
  }, [isAuthenticated, authLoading, fetchReminders]);
  ```
- Теперь ремайндеры загружаются сразу после логина, без необходимости обновления страницы

### Как это работает

1. **Задачи в календаре**:
   - Когда вы создаёте задачу с датой (`end` field), она автоматически появляется в календаре
   - Задачи показываются с префиксом ✓ и зелёным цветом
   - Выполненные задачи (completed: true) не показываются в календаре
   - При обновлении/удалении/завершении задачи календарь автоматически обновляется

2. **Кнопка Done**:
   - Нажмите "Mark Done" чтобы пометить задачу выполненной
   - Выполненная задача показывает зелёную кнопку "Done" с галочкой
   - Можно снова нажать чтобы вернуть задачу в невыполненное состояние

3. **Ремайндеры**:
   - Теперь автоматически загружаются при входе в систему
   - Не требуется обновление страницы для их отображения

### API Endpoints

**Новый endpoint**:
```
GET /api/tasks/all?hasDate=true&completed=false
```
- Получает все задачи пользователя
- Параметры:
  - `hasDate`: true - только задачи с установленной датой
  - `completed`: false - только невыполненные задачи

### Тестирование

1. Создайте задачу с датой
2. Перейдите в календарь
3. Найдите задачу в соответствующем дне (зелёная метка с ✓)
4. На странице задач нажмите "Mark Done" - задача должна стать выполненной и исчезнуть из календаря
5. Выйдите и войдите снова - ремайндеры должны отображаться сразу без обновления страницы
