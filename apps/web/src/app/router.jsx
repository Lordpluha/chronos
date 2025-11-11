import { Landing } from '@pages/Landing'
import { Login } from '@pages/Login'
import { Registration } from '@pages/Registration'
import { ROUTES } from '@shared/routes'
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: ROUTES.landing,
    element: <Landing />,
  },
  {
    path: ROUTES.login,
    element: <Login />,
  },
  {
    path: ROUTES.registration,
    element: <Registration />,
  },
])
