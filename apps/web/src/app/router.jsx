import { Landing } from '@pages/Landing'
import { ROUTES } from '@shared/routes'
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: ROUTES.landing,
    element: <Landing />,
  },
])
