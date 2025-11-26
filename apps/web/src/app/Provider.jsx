import { NuqsAdapter } from 'nuqs/adapters/react'
import { Toaster } from '@shared/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '@shared/context/AuthContext'
import { CalendarContextWrapper } from '@shared/context/CalendarContextWrapper'

const queryClient = new QueryClient()

export const Provider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CalendarContextWrapper>
          <NuqsAdapter>
            <Toaster position="top-right" richColors closeButton />
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </NuqsAdapter>
        </CalendarContextWrapper>
      </AuthProvider>
    </QueryClientProvider>
  )
}
