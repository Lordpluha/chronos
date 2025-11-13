import { NuqsAdapter } from 'nuqs/adapters/react'
import { Toaster } from '@shared/ui/sonner'
import { Toaster as HotToaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '@shared/context/AuthContext'

const queryClient = new QueryClient()

export const Provider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NuqsAdapter>
          <Toaster />
          <HotToaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </NuqsAdapter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
