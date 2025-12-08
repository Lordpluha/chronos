import { createRoot } from 'react-dom/client'
import { router } from './router'
import { RouterProvider } from 'react-router'
import './global.css'
import { Provider } from './Provider'

const root = document.getElementById('root')

createRoot(root).render(
  <Provider>
    <RouterProvider router={router} />
  </Provider>,
)
