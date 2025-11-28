# Tasks Feature

Система управления задачами, вдохновленная Google Tasks.

## Архитектура

### Backend (API)

**Модели:**
- `TaskList` - список задач (аналог проектов)
- `Task` - отдельная задача

**Endpoints:**

#### Task Lists
- `POST /api/tasks/lists` - создать список задач
- `GET /api/tasks/lists` - получить все списки
- `GET /api/tasks/lists/:taskListId` - получить список по ID
- `PUT /api/tasks/lists/:taskListId` - обновить список
- `DELETE /api/tasks/lists/:taskListId` - удалить список
- `PUT /api/tasks/lists/:taskListId/reorder` - изменить порядок задач

#### Tasks
- `POST /api/tasks/lists/:taskListId/tasks` - создать задачу
- `GET /api/tasks/lists/:taskListId/tasks` - получить задачи (с фильтрами)
- `GET /api/tasks/lists/:taskListId/tasks/:taskId` - получить задачу
- `PUT /api/tasks/lists/:taskListId/tasks/:taskId` - обновить задачу
- `PATCH /api/tasks/lists/:taskListId/tasks/:taskId/toggle` - переключить статус
- `DELETE /api/tasks/lists/:taskListId/tasks/:taskId` - удалить задачу

#### Statistics
- `GET /api/tasks/stats` - статистика по задачам

### Frontend

**Структура:**
```
features/Tasks/
  ├── api/
  │   └── TasksApi.js         # API клиент
  ├── hooks/
  │   └── useTasks.js         # React Query хуки
  ├── components/
  │   ├── TaskListSidebar/    # Боковая панель со списками
  │   ├── TaskCard/           # Карточка задачи
  │   └── TaskForm/           # Форма создания/редактирования
  └── index.js

pages/TasksPage/
  └── TasksPage.jsx            # Главная страница задач
```

## Функционал

### Task Lists (Списки задач)
- ✅ Создание списков
- ✅ Редактирование названия и описания
- ✅ Удаление списков (с удалением всех задач)
- ✅ Переключение между списками

### Tasks (Задачи)
- ✅ Создание задач с полями:
  - Title (обязательное)
  - Description
  - Due date (срок выполнения)
  - Priority (low, medium, high, urgent)
  - Tags
- ✅ Отметка выполнения (checkbox)
- ✅ Редактирование задач
- ✅ Удаление задач
- ✅ Фильтрация:
  - Выполненные/невыполненные
  - По приоритету
  - По тегам
  - Просроченные
  - Сегодня

### UI/UX
- ✅ Светлая/темная тема
- ✅ Индикация просроченных задач (красный цвет)
- ✅ Индикация задач на сегодня (оранжевый цвет)
- ✅ Раздельное отображение активных и завершенных задач
- ✅ Быстрое переключение статуса через checkbox
- ✅ Dropdown меню для действий

## Стилистика

Дизайн вдохновлен Google Tasks с адаптацией под существующую тему приложения:
- Минималистичный интерфейс
- Акцент на функциональность
- Чистая типографика
- Использование существующей цветовой схемы
- Полная поддержка темной темы

## Использование

```jsx
import { TasksPage } from '@pages/TasksPage';
import { useTaskLists, useTasks, useCreateTask } from '@features/Tasks/hooks';

// Получить списки задач
const { data: taskLists } = useTaskLists();

// Получить задачи из списка
const { data: tasks } = useTasks(taskListId);

// Создать задачу
const createMutation = useCreateTask();
await createMutation.mutateAsync({
  taskListId,
  data: {
    title: 'New task',
    description: 'Description',
    priority: 'high',
    end: new Date(),
    tags: ['work', 'urgent']
  }
});
```

## Навигация

Кнопка **Tasks** добавлена в CalendarHeader рядом с Reminders.
Роут: `/tasks`
