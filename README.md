# chronos

## Tech Stack

### Front
- React@19 + Vite
- React-router
- React-query + Axios
- Zod
- React-hook-form
- Shadcn (Radix UI + TailwindCSS)
- Motion
- Nuqs
- Feature Sliced Design
- Biome

### Back
- Express.js
- Mongoose
- Zod
- argon2id
- CSRF tokens
- OAuth
- 2FA (speakeasy)
- Rate-limitting
- googleapis
- google calendar api
- nodemailer
- Biome

### DB
- MongoDB serverless

### Admin
- Kottster(React)

### DevOps
- Docker
- turborepo
- .env

## Components

### Front
- Pages
  - Landing - '/'
  - Registration - '/auth/registration'
  - Login - '/auth/login'
  - Calendar - '/calendar'
  - EventCreatePage - '/events/create'
  - EventIdPage - '/events/${id}'
  - Profile - '/profile' (with settings modal)
  - CalendarsList - '/calendars'
  - CalendarIdPage - '/calendar/${id}'
- Entities
  - Event
    - EventCard
  - User
  - Calendar
    - CalendarCard
- Widgets
  - LoginForm
  - RegistrationForm
  - Calendar
  - Search
  - EventCreateForm
  - Globar Error
  - Not found
