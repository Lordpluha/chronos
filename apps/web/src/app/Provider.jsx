import { NuqsAdapter } from 'nuqs/adapters/react'
import { Toaster } from "@shared/ui/sonner"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()

export const Provider = ({ children }) => {
	return <QueryClientProvider client={queryClient}>
		<NuqsAdapter>
			<Toaster />
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</NuqsAdapter>
	</QueryClientProvider>
}