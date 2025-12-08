import { Landing } from '@pages/Landing'
import { Login } from '@pages/Login'
import { Login2FA } from '@pages/Login2FA'
import { Registration } from '@pages/Registration'
import { ForgotPassword } from '@pages/ForgotPassword'
import { ResetPassword } from '@pages/ResetPassword'
import { Verify2FA } from '@pages/Verify2FA'
import { ProfilePage } from '@pages/Profile'
import { AccountPage } from '@pages/AccountPage'
import { CalendarPage } from '@pages/Calendar'
import { RemindersPage } from '@pages/RemindersPage'
import { TasksPage } from '@pages/TasksPage'
import { ROUTES } from '@shared/routes'
import { GuestRoute, PrivateRoute } from '@shared/components/ProtectedRoute'
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: ROUTES.landing,
    element: <Landing />,
  },
  {
    path: ROUTES.login,
    element: (
      <GuestRoute>
        <Login />
      </GuestRoute>
    ),
  },
  {
    path: '/auth/2fa',
    element: (
      <GuestRoute>
        <Login2FA />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.registration,
    element: (
      <GuestRoute>
        <Registration />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.forgotPassword,
    element: (
      <GuestRoute>
        <ForgotPassword />
      </GuestRoute>
    ),
  },
  {
    path: ROUTES.resetPassword,
    element: (
      <GuestRoute>
        <ResetPassword />
      </GuestRoute>
    ),
  },
  {
    path: '/auth/verify-2fa',
    element: <Verify2FA />,
  },
  {
    path: ROUTES.profile,
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: ROUTES.account,
    element: (
      <PrivateRoute>
        <AccountPage />
      </PrivateRoute>
    ),
  },
  {
    path: ROUTES.calendar,
    element: (
      <PrivateRoute>
        <CalendarPage />
      </PrivateRoute>
    ),
  },
  {
    path: ROUTES.reminders,
    element: (
      <PrivateRoute>
        <RemindersPage />
      </PrivateRoute>
    ),
  },
  {
    path: ROUTES.tasks,
    element: (
      <PrivateRoute>
        <TasksPage />
      </PrivateRoute>
    ),
  },
])
