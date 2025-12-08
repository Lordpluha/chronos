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

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lordpluha/chronos.git
   cd chronos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file in `apps/api/` directory:
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   ```
   
   See [Environment Variables](#-environment-variables) section for required variables.

4. **Start MongoDB**
   
   If using Docker for MongoDB only:
   ```bash
   npm run docker:db
   ```
   
   Or start your local MongoDB instance.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

### Docker Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lordpluha/chronos.git
   cd chronos
   ```

2. **Set up environment variables**
   
   Create `.env.local` file in `apps/api/` directory with your configuration.

3. **Start with Docker Compose**
   
   For local development (with local MongoDB):
   ```bash
   npm run docker:dev
   ```
   
   For development with MongoDB Atlas:
   ```bash
   npm run docker:dev-atlas
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - MongoDB: mongodb://localhost:27017 (if using local MongoDB)

### Production Deployment

1. **Set up production environment variables**
   
   Create `.env.production` file in the root directory:
   ```bash
   cp .env.example .env.production
   ```

2. **Deploy with Docker Compose**
   ```bash
   npm run docker:prod
   ```

3. **View logs**
   ```bash
   npm run docker:logs
   ```

## 🔧 Environment Variables

Create `apps/api/.env.local` file with the following variables:

### Server Configuration
```env
NODE_ENV=development
BACK_PORT=3001
BACK_HOST=0.0.0.0
FRONT_HOST=localhost
FRONT_PORT=5173
```

### Database
```env
# For MongoDB Atlas (serverless)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chronos?retryWrites=true&w=majority

# For local MongoDB
# MONGODB_URI=mongodb://admin:admin_password@localhost:27017/chronos?authSource=admin

DB_NAME=chronos
```

### JWT Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
ACCESS_TOKEN_LIFETIME=15m
REFRESH_TOKEN_LIFETIME=7d
ACCESS_TOKEN_NAME=access_token
REFRESH_TOKEN_NAME=refresh_token
CODE_LIFETIME=5m
```

### Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Google OAuth
```env
OAUTH_CLIENT_ID=your-google-client-id
OAUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

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

### Root Level
```bash
npm run dev          # Start all services in development mode
npm run build        # Build all applications
npm run lint         # Lint all applications
npm run format       # Format code with Biome
npm run clean        # Clean build artifacts
```

### Docker Commands
```bash
npm run docker:dev           # Start development with local MongoDB
npm run docker:dev-atlas     # Start development with MongoDB Atlas
npm run docker:prod          # Start production deployment
npm run docker:db            # Start only MongoDB
npm run docker:api           # Start only API service
npm run docker:web           # Start only web service
npm run docker:logs          # View logs
npm run docker:stop          # Stop all services
npm run docker:clean         # Clean Docker volumes and images
```

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
