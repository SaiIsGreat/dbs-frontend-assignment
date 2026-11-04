import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/setup'
import { Dashboard } from './Dashboard'

// The mock API takes about 500 ms per response.
const WAIT = { timeout: 3000 }

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>,
  )

  return queryClient
}

const serverError = () =>
  HttpResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
    { status: 500 },
  )

describe('Dashboard', () => {
  it('shows a loading state, then the data', async () => {
    renderDashboard()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading your dashboard',
    )
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Good evening, Ava' },
        WAIT,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows an error when a request fails, and Retry loads only what failed', async () => {
    const user = userEvent.setup()
    server.use(http.get('*/api/accounts', serverError, { once: true }))
    const queryClient = renderDashboard()

    expect(await screen.findByRole('alert', {}, WAIT)).toHaveTextContent(
      "We couldn't load your dashboard.",
    )
    // Let the other two requests finish, or Retry would just join them.
    await waitFor(() => expect(queryClient.isFetching()).toBe(0), WAIT)

    const requestedPaths: string[] = []
    server.events.on('request:start', ({ request }) => {
      requestedPaths.push(new URL(request.url).pathname)
    })
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(
      await screen.findByText('Everyday Checking', {}, WAIT),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(requestedPaths).toEqual(['/api/accounts'])

    server.events.removeAllListeners()
  })

  it('keeps showing existing data when a background refresh fails', async () => {
    const queryClient = renderDashboard()
    await screen.findByText('Everyday Checking', {}, WAIT)

    server.use(http.get('*/api/accounts', serverError))
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      // Give TanStack Query time to pass the failure on to React.
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(queryClient.getQueryState(['accounts'])?.status).toBe('error')
    expect(screen.getByText('Everyday Checking')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
