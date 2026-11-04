import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { formatMoney } from '../lib/format'
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

describe('Dashboard balances', () => {
  it('totals the deposit accounts and leaves out the credit card', async () => {
    renderDashboard()

    const hero = await screen.findByRole(
      'region',
      { name: 'Total available' },
      WAIT,
    )

    expect(hero.textContent).toContain(formatMoney(17120.55))
    expect(hero).toHaveTextContent('Across 2 deposit accounts')
  })

  it('shows each account, with Amount due only on the credit card', async () => {
    renderDashboard()

    const list = await screen.findByRole('list', {}, WAIT)
    const cards = within(list).getAllByRole('listitem')

    expect(cards).toHaveLength(3)
    expect(cards[0].textContent).toContain('Everyday Checking')
    expect(cards[0].textContent).toContain('•••• 4821')
    expect(cards[0].textContent).toContain(formatMoney(4280.55))
    expect(cards[0]).not.toHaveTextContent('Amount due')

    expect(cards[2].textContent).toContain('Rewards Card')
    expect(cards[2].textContent).toContain(formatMoney(-420.3))
    expect(cards[2]).toHaveTextContent('Amount due')
  })

  it('works out the remaining daily limit from what has been used', async () => {
    server.use(
      http.get('*/api/customer', () =>
        HttpResponse.json({
          customer: {
            id: 'cus_001',
            firstName: 'Ava',
            lastName: 'Chen',
            email: 'ava.chen@example.com',
            segment: 'retail',
            dailyTransferLimit: 5000,
            transferredToday: 120,
          },
        }),
      ),
    )
    renderDashboard()

    const limit = await screen.findByRole(
      'complementary',
      { name: 'Daily limit' },
      WAIT,
    )

    expect(limit.textContent).toContain(`${formatMoney(4880)} remaining today`)
  })

  it('handles having no accounts', async () => {
    server.use(
      http.get('*/api/accounts', () => HttpResponse.json({ accounts: [] })),
    )
    renderDashboard()

    const hero = await screen.findByRole(
      'region',
      { name: 'Total available' },
      WAIT,
    )

    expect(hero.textContent).toContain(formatMoney(0))
    expect(hero).toHaveTextContent('Across 0 deposit accounts')
    expect(screen.getByText('No accounts to show.')).toBeInTheDocument()
  })
})
