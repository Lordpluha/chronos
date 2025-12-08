# Chronos 📅

A modern, full-stack calendar and task management application built with React and Express.js. Chronos offers seamless event management, Google Calendar integration, calendar sharing, and a beautiful, responsive user interface.

![Chronos](./Chronos.drawio.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Local Development](#local-development)
  - [Docker Development](#docker-development)
  - [Production Deployment](#production-deployment)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **Event Management**: Create, edit, delete, and manage events with rich details
- **Calendar Management**: Multiple calendar support with customizable colors and names
- **Task Lists**: Organize tasks with task lists and track completion
- **Google Calendar Integration**: Seamless OAuth integration with Google Calendar API
- **Calendar Sharing**: Share calendars with other users with different access levels
- **Reminders**: Set up reminders for events with customizable notification times
- **User Authentication**: Secure authentication with JWT tokens, CSRF protection, and OAuth support
- **Two-Factor Authentication (2FA)**: Enhanced security with TOTP-based 2FA
- **Responsive Design**: Beautiful UI built with Radix UI and Tailwind CSS
- **Real-time Updates**: WebSocket support for real-time collaboration
- **Search Functionality**: Fast and efficient event and calendar search
- **Drag and Drop**: Intuitive drag-and-drop interface for event management

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern React with hooks and concurrent features
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query (React Query)** - Powerful data fetching and caching
- **Axios** - HTTP client for API requests
- **React Hook Form** - Performant form management
- **Zod** - TypeScript-first schema validation
- **Shadcn UI** - Beautiful UI components built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Motion** - Smooth animations and transitions
- **Nuqs** - Type-safe URL query string management
- **Lucide React** - Beautiful icon library
- **Feature Sliced Design** - Architectural methodology for scalable frontend
- **Biome** - Fast linter and formatter

### Backend
- **Express.js 5** - Fast, minimalist web framework
- **Mongoose** - MongoDB object modeling
- **Zod** - Runtime type validation
- **Argon2** - Secure password hashing (argon2id)
- **JWT** - JSON Web Tokens for authentication
- **CSRF Protection** - Cross-Site Request Forgery protection
- **OAuth 2.0** - Google OAuth integration
- **Speakeasy** - Two-Factor Authentication (TOTP)
- **Google APIs** - Google Calendar API integration
- **Nodemailer** - Email sending for notifications
- **Multer** - File upload middleware
- **WebSocket (ws)** - Real-time communication
- **Helmet** - Security headers middleware
- **Rate Limiting** - API rate limiting protection
- **Sanitize HTML** - XSS protection
- **Biome** - Fast linter and formatter

### Database
- **MongoDB** - NoSQL database (supports both local and MongoDB Atlas)

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Turborepo** - High-performance monorepo build system
- **Node.js** - JavaScript runtime

## 📁 Project Structure

```
chronos/
├── apps/
│   ├── api/                    # Backend application
│   │   ├── src/
│   │   │   ├── config/         # Configuration files
│   │   │   ├── db/             # Database connection
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── models/         # Mongoose models
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── Auth/       # Authentication
│   │   │   │   ├── Calendars/  # Calendar management
│   │   │   │   ├── Events/     # Event management
│   │   │   │   ├── Reminders/  # Reminder management
│   │   │   │   └── ...
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── utils/          # Utility functions
│   │   │   └── index.js        # Entry point
│   │   ├── uploads/            # Uploaded files (avatars, etc.)
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                    # Frontend application
│       ├── src/
│       │   ├── app/            # App configuration
│       │   ├── entities/       # Business entities
│       │   ├── features/       # Feature components
│       │   ├── pages/          # Page components
│       │   └── shared/         # Shared components/utils
│       ├── public/             # Static assets
│       ├── Dockerfile
│       ├── vite.config.js
│       └── package.json
│
├── docker-compose.yml          # Development Docker setup
├── docker-compose.prod.yml     # Production Docker setup
├── turbo.json                  # Turborepo configuration
├── package.json                # Root package.json
└── README.md
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 14.0.0
- **npm** >= 7.0.0 (or pnpm/yarn)
- **Docker** and **Docker Compose** (for containerized deployment)
- **MongoDB** (if running locally without Docker)

## 🚀 Getting Started

### Quick Start

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/Lordpluha/chronos.git
   cd chronos
   ```

2. **Создайте `.env` файл**
   ```bash
   cp .env.example .env
   # Отредактируйте .env и добавьте реальные значения
   ```

3. **Выберите режим запуска:**

   **🐳 Docker (рекомендуется):**
   ```bash
   # Development с hot-reload
   npm run docker:dev

   # Production
   npm run docker:prod
   ```

   **💻 Локально:**
   ```bash
   npm install
   npm run dev
   ```

4. **Доступ к приложению:**
   - Frontend: http://localhost:5173 (dev) или http://localhost:3000 (prod)
   - API: http://localhost:3001/api
   - MongoDB Admin: http://localhost:8081

📚 **Подробная документация:** См. [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md) и [DOCKER_DEV_MODE.md](./DOCKER_DEV_MODE.md)

### 💻 Локальная разработка

**Вариант 1: Полностью локально**

1. **Установите зависимости**
   ```bash
   npm install
   ```

2. **Создайте `.env.local` в `apps/api/`**
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   # Настройте подключение к локальной MongoDB
   ```

3. **Запустите MongoDB локально**
   ```bash
   mongod --dbpath /path/to/db
   ```

4. **Запустите dev серверы**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

**Вариант 2: БД в Docker, код локально (рекомендуется)**

1. **Запустите только БД и админку**
   ```bash
   docker-compose up -d mongodb mongo-express
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Создайте `.env.local` в `apps/api/`**
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   ```

   Убедитесь что MongoDB URI указывает на Docker:
   ```env
   MONGODB_URI=mongodb://admin:admin_password@localhost:27017/chronos?authSource=admin
   ```

4. **Запустите dev серверы**
   ```bash
   npm run dev
   ```

**Вариант 3: Backend в Docker, Frontend локально**

1. **Запустите API и БД**
   ```bash
   docker-compose up -d mongodb mongo-express api
   ```

2. **Запустите только фронтенд локально**
   ```bash
   cd apps/web
   npm run dev
   ```
   - Frontend с hot-reload: http://localhost:5173
   - API в Docker: http://localhost:3001

**Вариант 4: Frontend в Docker, Backend локально**

1. **Запустите Web и БД**
   ```bash
   docker compose up -d mongodb mongo-express web
   ```

2. **Запустите только бэкенд локально**
   ```bash
   cd apps/api
   npm run dev
   ```
   - Frontend в Docker: http://localhost:3000
   - API с hot-reload: http://localhost:3001

## 🔧 Environment Variables

### Docker (корневой `.env`)

Для Docker создайте `.env` в корне проекта:

```env
# Ports
FRONT_PORT=3000
BACK_PORT=3001
MONGO_PORT=27017
MONGO_EXPRESS_PORT=8081

# Hosts
FRONT_HOST=localhost
BACK_HOST=0.0.0.0

# Database
DB_NAME=chronos
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin_password

# MongoDB Admin UI
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=admin

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ACCESS_TOKEN_LIFETIME=15m
REFRESH_TOKEN_LIFETIME=7d
ACCESS_TOKEN_NAME=access_token
REFRESH_TOKEN_NAME=refresh_token
CODE_LIFETIME=5m

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth
OAUTH_CLIENT_ID=your-google-client-id
OAUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# MongoDB Atlas (для production)
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/chronos

# Node Environment
NODE_ENV=development
```

### Локальная разработка (`apps/api/.env.local`)

Для локального запуска создайте `apps/api/.env.local`:

```env
NODE_ENV=development
BACK_PORT=3001
BACK_HOST=0.0.0.0
FRONT_HOST=localhost
FRONT_PORT=5173

# Локальная MongoDB или Docker MongoDB
MONGODB_URI=mongodb://admin:admin_password@localhost:27017/chronos?authSource=admin
DB_NAME=chronos

JWT_SECRET=your-super-secret-jwt-key-change-this
ACCESS_TOKEN_LIFETIME=15m
REFRESH_TOKEN_LIFETIME=7d
ACCESS_TOKEN_NAME=access_token
REFRESH_TOKEN_NAME=refresh_token
CODE_LIFETIME=5m

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

OAUTH_CLIENT_ID=your-google-client-id
OAUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### 🔐 Получение OAuth credentials

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект
3. Перейдите в **APIs & Services → Credentials**
4. Создайте **OAuth client ID** → **Web application**
5. Добавьте redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Скопируйте Client ID и Client Secret в `.env`

## 📚 API Documentation

The API follows RESTful principles. A Postman collection is available in `Chronos_API.postman_collection.json`.

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/2fa/enable` - Enable 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code

### Calendar Endpoints
- `GET /api/calendars` - Get all calendars
- `POST /api/calendars` - Create calendar
- `GET /api/calendars/:id` - Get calendar by ID
- `PUT /api/calendars/:id` - Update calendar
- `DELETE /api/calendars/:id` - Delete calendar
- `POST /api/calendars/:id/share` - Share calendar with users
- `GET /api/calendars/:id/accesses` - Get calendar access list

### Event Endpoints
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### User Endpoints
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile
- `POST /api/users/avatar` - Upload avatar

## 🏗 Architecture

### Frontend Architecture (Feature Sliced Design)

The frontend follows the **Feature Sliced Design** methodology:

- **app/** - Application initialization and providers
- **pages/** - Page components (Landing, Login, Calendar, etc.)
- **features/** - User scenarios and features
- **entities/** - Business entities (Event, User, Calendar)
- **shared/** - Reusable components and utilities

### Backend Architecture (Modular Monolith)

- **Modular structure** - Each feature is a separate module
- **Middleware-based** - Authentication, validation, rate limiting
- **Type-safe** - TypeScript definitions and Zod validation
- **Security-first** - CSRF, rate limiting, helmet, sanitization

### Database Schema

Key models:
- **User** - User accounts with authentication
- **Calendar** - Calendar entities with sharing capabilities
- **Event** - Calendar events with reminders
- **Task** - Task items with completion tracking
- **TaskList** - Task list containers
- **Access** - Calendar sharing and permissions
- **Session** - User sessions
- **Reminder** - Event reminders

## 🔨 Available Scripts

### Основные команды

```bash
# Локальная разработка
npm run dev              # Запуск frontend + backend локально
npm run build            # Сборка всех приложений
npm run lint             # Линтинг кода
npm run format           # Форматирование кода
npm run test             # Запуск тестов
npm run clean            # Очистка build артефактов
```

### Docker команды

#### Development (с hot-reload)
```bash
npm run docker:dev           # 🔥 Запуск dev режима с auto-rebuild
npm run docker:dev:build     # Запуск с пересборкой образов
npm run docker:dev:logs      # Просмотр логов
npm run docker:dev:down      # Остановить и удалить контейнеры
```

**Особенности dev режима:**
- Автоматический hot-reload (Vite HMR + Nodemon)
- Auto-rebuild при изменении `package.json` или `Dockerfile.dev`
- Volumes для синхронизации кода
- Порты: Frontend (5173), API (3001)

#### Production
```bash
npm run docker:prod          # 🚀 Запуск production сборки
npm run docker:prod:rebuild  # Полная пересборка и запуск
npm run docker:prod:logs     # Просмотр логов
npm run docker:prod:down     # Остановить и удалить контейнеры
```

**Production особенности:**
- Оптимизированная сборка
- Nginx для frontend
- Порты: Frontend (3000), API (3001)

#### Утилиты
```bash
npm run docker:db            # Запустить только MongoDB + Admin UI
npm run docker:clean         # Остановить контейнеры и удалить volumes
npm run docker:clean:all     # Полная очистка (контейнеры, volumes, images)
```

### Примеры использования

**Разработка с Docker:**
```bash
# Запустить и работать с hot-reload
npm run docker:dev

# В другом терминале смотреть логи
npm run docker:dev:logs

# Остановить когда закончили
npm run docker:dev:down
```

**Разработка локально (только БД в Docker):**
```bash
# Запустить только MongoDB и админку
npm run docker:db

# В другом терминале запустить приложение
npm run dev
```

**Production деплой:**
```bash
# Создать .env с production настройками
cp .env.example .env

# Запустить production версию
npm run docker:prod
```

**Полная очистка и перезапуск:**
```bash
# Удалить всё
npm run docker:clean:all

# Запустить заново
npm run docker:dev
```

### Требования

- **Docker Compose v2.22+** - для `--watch` режима в dev
- **Node.js 20+** - для локальной разработки
- **npm 7+** - менеджер пакетов

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Lordpluha**

- GitHub: [@Lordpluha](https://github.com/Lordpluha)

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
