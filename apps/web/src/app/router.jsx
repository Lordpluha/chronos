import { Landing } from '@pages/Landing'
import { Login } from '@pages/Login'
import { Registration } from '@pages/Registration'
import { ForgotPassword } from '@pages/ForgotPassword'
import { ResetPassword } from '@pages/ResetPassword'
import { ProfilePage } from '@pages/Profile'
import { CalendarPage } from '@pages/Calendar'
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
    path: ROUTES.profile,
    element: (
      <PrivateRoute>
        <ProfilePage />
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
])
