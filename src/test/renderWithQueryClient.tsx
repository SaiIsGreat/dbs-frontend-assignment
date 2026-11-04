import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

/** Fresh cache and no retries, with the same staleTime as src/main.tsx. */
export function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: false } },
  })

  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)

  return queryClient
}
