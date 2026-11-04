import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { formatMoney } from '../../lib/format'
import { renderWithQueryClient } from '../../test/renderWithQueryClient'
import { server } from '../../test/setup'
import { TransactionList } from './TransactionList'

// The mock API takes about 500 ms, on top of the 300 ms search delay.
const WAIT = { timeout: 3000 }

async function renderList() {
  const queryClient = renderWithQueryClient(<TransactionList />)
  await screen.findAllByRole('listitem', {}, WAIT)
  return {
    queryClient,
    user: userEvent.setup(),
    input: screen.getByRole('searchbox', { name: 'Search transactions' }),
  }
}

const descriptions = () =>
  screen
    .getAllByRole('listitem')
    .map((row) => row.querySelector('span')?.textContent)

describe('TransactionList', () => {
  it('shows the 8 newest, newest first', async () => {
    await renderList()

    expect(descriptions()).toEqual([
      'FairPrice Finest',
      'Grab',
      'Kopitiam Corner',
      'Spotify',
      'PayNow from Marcus Lee',
      'Salary — Northwind Labs',
      'SP Group',
      'Uniqlo',
    ])
  })

  it('shows money in, money out, the date and the Pending chip', async () => {
    await renderList()
    const rows = screen.getAllByRole('listitem')

    const moneyIn = rows[4]
    expect(moneyIn.textContent).toContain(`+${formatMoney(45)}`)

    const moneyOut = rows[0]
    expect(moneyOut.textContent).toContain(formatMoney(-86.4))
    expect(moneyOut).toHaveTextContent('groceries · 19 Oct')
    expect(within(moneyOut).queryByText('Pending')).not.toBeInTheDocument()

    const pending = rows[1]
    expect(within(pending).getByText('Pending')).toBeInTheDocument()
  })

  it('finds transactions older than the 8 loaded', async () => {
    const { user, input } = await renderList()

    await user.type(input, 'NETFLIX')

    expect(await screen.findByText('1 result', {}, WAIT)).toBeInTheDocument()
    expect(descriptions()).toEqual(['Netflix'])
  })

  it('searches by category and counts every match', async () => {
    const { user, input } = await renderList()

    await user.type(input, 'dining')

    expect(await screen.findByText('2 results', {}, WAIT)).toBeInTheDocument()
    expect(descriptions()).toEqual([
      'Kopitiam Corner',
      'Coffee Bean & Tea Leaf',
    ])
  })

  it('waits for typing to stop, and asks for every match', async () => {
    const { user, input } = await renderList()
    const searches: (string | null)[][] = []
    server.events.on('request:start', ({ request }) => {
      const { searchParams } = new URL(request.url)
      searches.push([searchParams.get('q'), searchParams.get('limit')])
    })

    await user.type(input, 'grab')
    await screen.findByText('1 result', {}, WAIT)
    server.events.removeAllListeners()

    expect(searches).toEqual([['grab', '50']])
  })

  it('handles no matches, and clearing brings the list back', async () => {
    const { user, input } = await renderList()

    await user.type(input, 'zzz')

    expect(
      await screen.findByText('No transactions match your search.', {}, WAIT),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument()
  })

  it('updates the results when the search changes again', async () => {
    const { user, input } = await renderList()

    await user.type(input, 'grab')
    await screen.findByText('1 result', {}, WAIT)
    expect(descriptions()).toEqual(['Grab'])

    await user.clear(input)
    await user.type(input, 'netflix')

    await waitFor(() => expect(descriptions()).toEqual(['Netflix']), WAIT)
  })

  it('keeps old rows on screen during a search, without counting them', async () => {
    const { queryClient, user, input } = await renderList()

    await user.type(input, 'grab')
    // Wait for the delay to pass and the request to actually start.
    await waitFor(
      () => expect(queryClient.isFetching()).toBeGreaterThan(0),
      WAIT,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Searching…')
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
    await screen.findByText('1 result', {}, WAIT)
  })

  it('keeps a failed search inside the list, and Retry recovers', async () => {
    const { user, input } = await renderList()
    server.use(
      http.get(
        '*/api/transactions',
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
            { status: 500 },
          ),
        { once: true },
      ),
    )

    await user.type(input, 'grab')

    expect(await screen.findByRole('alert', {}, WAIT)).toHaveTextContent(
      "We couldn't search your transactions.",
    )
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(
      () => expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
      WAIT,
    )
    expect(await screen.findByText('1 result', {}, WAIT)).toBeInTheDocument()
  })

  it('tells the user when there are no transactions at all', async () => {
    server.use(
      http.get('*/api/transactions', () =>
        HttpResponse.json({ transactions: [], total: 0 }),
      ),
    )
    renderWithQueryClient(<TransactionList />)

    expect(
      await screen.findByText('No transactions yet.', {}, WAIT),
    ).toBeInTheDocument()
  })
})
