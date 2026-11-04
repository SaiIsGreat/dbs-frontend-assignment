import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { Dashboard } from '../dashboard/Dashboard'
import { formatMoney } from '../lib/format'
import { renderWithQueryClient } from '../test/renderWithQueryClient'
import { server } from '../test/setup'

// The mock API takes about 500 ms per response, and a transfer makes four.
const WAIT = { timeout: 4000 }

const SEND_ERROR =
  "Something went wrong. Your money hasn't left your account. Try again."

/** Records each transfer sent, including ones an override answers. */
function recordTransfers() {
  const bodies: unknown[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST') {
      void request
        .clone()
        .json()
        .then((body: unknown) => bodies.push(body))
    }
  })
  return bodies
}

afterEach(() => server.events.removeAllListeners())

const customerWithUsedLimit = (transferredToday: number) =>
  HttpResponse.json({
    customer: {
      id: 'cus_001',
      firstName: 'Ava',
      lastName: 'Chen',
      email: 'ava.chen@example.com',
      segment: 'retail',
      dailyTransferLimit: 5000,
      transferredToday,
    },
  })

async function openReview({ amount = '120', note = '' } = {}) {
  const user = userEvent.setup()
  const queryClient = renderWithQueryClient(<Dashboard />)
  await user.click(
    await screen.findByRole('button', { name: 'New transfer' }, WAIT),
  )
  const dialog = screen.getByRole('dialog', { name: 'New transfer' })
  const inDialog = within(dialog)
  const pressContinue = () =>
    user.click(inDialog.getByRole('button', { name: 'Continue' }))

  await user.click(
    await inDialog.findByRole('radio', { name: /Jamie Tan/ }, WAIT),
  )
  await pressContinue()
  await user.type(
    await inDialog.findByRole('textbox', { name: 'Amount' }),
    amount,
  )
  if (note) {
    await user.type(
      inDialog.getByRole('textbox', { name: 'Note (optional)' }),
      note,
    )
  }
  await pressContinue()
  await inDialog.findByRole('heading', { name: 'Check the details' })

  return {
    dialog,
    inDialog,
    queryClient,
    user,
    confirm: () =>
      user.click(inDialog.getByRole('button', { name: 'Confirm transfer' })),
  }
}

describe('review step', () => {
  it('shows every detail, and sends nothing until Confirm', async () => {
    const posts = recordTransfers()
    const { dialog } = await openReview({ amount: '120.5', note: 'Dinner' })
    const text = dialog.textContent

    expect(text).toContain('Everyday Checking · •••• 4821')
    expect(text).toContain('Jamie Tan · DBS · •••• 3391')
    expect(text).toContain(`Amount${formatMoney(120.5)}`)
    expect(text).toContain(`Fee${formatMoney(0)}`)
    expect(text).toContain(`Total${formatMoney(120.5)}`)
    expect(text).toContain('NoteDinner')
    expect(posts).toEqual([])
  })

  it('leaves out the note when there is none', async () => {
    const { inDialog } = await openReview()

    expect(inDialog.queryByText('Note')).not.toBeInTheDocument()
  })
})

describe('sending', () => {
  // Required by the brief.
  it('shows the success screen, and the dashboard updates', async () => {
    const { confirm, dialog, inDialog } = await openReview()

    await confirm()

    const heading = await inDialog.findByRole(
      'heading',
      { name: 'Transfer sent' },
      WAIT,
    )
    expect(heading).toHaveFocus()
    expect(heading.closest('[aria-live="polite"]')).toBeInTheDocument()
    expect(dialog.textContent).toContain(formatMoney(120))
    expect(dialog.textContent).toContain('to Jamie Tan · DBS · •••• 3391')
    expect(dialog.textContent).toMatch(/Reference\s*TRF-[A-Z0-9]{6}/)
    expect(dialog.textContent).toContain(
      'The money should arrive within minutes.',
    )

    // Already correct behind the dialog, before going back to the dashboard.
    const pageText = () => document.body.textContent
    expect(pageText()).toContain(formatMoney(4160.55))
    expect(pageText()).toContain(formatMoney(17000.55))
    expect(pageText()).toContain(`${formatMoney(4880)} remaining today`)
    expect(pageText()).toContain('Transfer to Jamie Tan')

    await userEvent.click(
      inDialog.getByRole('button', { name: 'Back to dashboard' }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(pageText()).toContain('Transfer to Jamie Tan')
  })

  it('sends a saved payee by id, with the amount as a number', async () => {
    const posts = recordTransfers()
    const { confirm, inDialog } = await openReview({
      amount: '120.50',
      note: 'Dinner',
    })

    await confirm()
    await inDialog.findByRole('heading', { name: 'Transfer sent' }, WAIT)

    expect(posts).toEqual([
      {
        fromAccountId: 'acc_checking',
        payeeId: 'pay_001',
        amount: 120.5,
        note: 'Dinner',
      },
    ])
  })

  it('sends new recipient details, trimmed and without a payee id', async () => {
    const user = userEvent.setup()
    const posts = recordTransfers()
    renderWithQueryClient(<Dashboard />)
    await user.click(
      await screen.findByRole('button', { name: 'New transfer' }, WAIT),
    )
    const inDialog = within(screen.getByRole('dialog'))
    await user.click(
      await inDialog.findByRole('radio', { name: 'Send to someone new' }, WAIT),
    )
    await user.type(
      inDialog.getByRole('textbox', { name: 'Recipient name' }),
      '  Alex Lim ',
    )
    await user.type(
      inDialog.getByRole('textbox', { name: 'Account number (8 digits)' }),
      '12345678',
    )
    await user.selectOptions(
      inDialog.getByRole('combobox', { name: 'Bank' }),
      'OCBC',
    )
    await user.click(inDialog.getByRole('button', { name: 'Continue' }))
    await user.type(
      await inDialog.findByRole('textbox', { name: 'Amount' }),
      '50',
    )
    await user.click(inDialog.getByRole('button', { name: 'Continue' }))
    await inDialog.findByRole('heading', { name: 'Check the details' })

    expect(screen.getByRole('dialog').textContent).toContain(
      'Alex Lim · OCBC · •••• 5678',
    )

    await user.click(inDialog.getByRole('button', { name: 'Confirm transfer' }))
    await inDialog.findByRole('heading', { name: 'Transfer sent' }, WAIT)

    expect(posts).toEqual([
      {
        fromAccountId: 'acc_checking',
        amount: 50,
        recipient: {
          name: 'Alex Lim',
          accountNumber: '12345678',
          bank: 'OCBC',
        },
      },
    ])
  })

  it('reads Sending…, and blocks every way out while sending', async () => {
    server.use(
      http.post('*/api/transfers', async () => {
        await delay(300)
        return HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
          { status: 500 },
        )
      }),
    )
    const { confirm, dialog, inDialog } = await openReview()

    await confirm()

    expect(inDialog.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    expect(inDialog.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(inDialog.getByRole('button', { name: 'Close' })).toBeDisabled()
    // fireEvent returns false when the handler calls preventDefault.
    expect(
      fireEvent(dialog, new Event('cancel', { cancelable: true })),
    ).toBe(false)
    expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(false)

    await inDialog.findByRole('alert', {}, WAIT)

    expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(true)

    expect(inDialog.getByRole('button', { name: 'Close' })).toBeEnabled()
    expect(
      fireEvent(dialog, new Event('cancel', { cancelable: true })),
    ).toBe(true)
  })

  it('sends only once when Confirm is double-clicked', async () => {
    const posts = recordTransfers()
    const { inDialog, user } = await openReview()

    await user.dblClick(
      inDialog.getByRole('button', { name: 'Confirm transfer' }),
    )
    await inDialog.findByRole('heading', { name: 'Transfer sent' }, WAIT)

    expect(posts).toHaveLength(1)
  })

  it('still shows success if the refresh afterwards fails', async () => {
    const { confirm, inDialog } = await openReview()
    server.use(
      http.get('*/api/accounts', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
          { status: 500 },
        ),
      ),
    )

    await confirm()

    expect(
      await inDialog.findByRole('heading', { name: 'Transfer sent' }, WAIT),
    ).toBeInTheDocument()
    expect(inDialog.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('failures', () => {
  it("stays on review with the brief's error, keeps the data, and can retry", async () => {
    const { confirm, dialog, inDialog, user } = await openReview({
      note: '#fail',
    })

    await confirm()

    const alert = await inDialog.findByRole('alert', {}, WAIT)
    expect(alert).toHaveTextContent(SEND_ERROR)
    expect(alert).toHaveFocus()
    expect(
      inDialog.queryByRole('heading', { name: 'Transfer sent' }),
    ).not.toBeInTheDocument()
    expect(
      inDialog.getByRole('heading', { name: 'Check the details' }),
    ).toBeInTheDocument()
    expect(dialog.textContent).toContain('Jamie Tan · DBS · •••• 3391')
    expect(document.body.textContent).toContain(formatMoney(17120.55))

    await user.click(inDialog.getByRole('button', { name: 'Back' }))
    const note = inDialog.getByRole('textbox', { name: 'Note (optional)' })
    expect(note).toHaveValue('#fail')
    await user.clear(note)
    await user.click(inDialog.getByRole('button', { name: 'Continue' }))
    await inDialog.findByRole('heading', { name: 'Check the details' })

    expect(inDialog.queryByRole('alert')).not.toBeInTheDocument()

    await confirm()

    expect(
      await inDialog.findByRole('heading', { name: 'Transfer sent' }, WAIT),
    ).toBeInTheDocument()
  })

  it('Confirm works again straight after a failure', async () => {
    server.use(
      http.post(
        '*/api/transfers',
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
            { status: 500 },
          ),
        { once: true },
      ),
    )
    const { confirm, inDialog } = await openReview()

    await confirm()
    await inDialog.findByRole('alert', {}, WAIT)
    await confirm()

    expect(
      await inDialog.findByRole('heading', { name: 'Transfer sent' }, WAIT),
    ).toBeInTheDocument()
  })

  it('shows an API rejection in the alert and under the field, and refreshes', async () => {
    const message = `Amount can't be more than your available balance (${formatMoney(100)}).`
    const { confirm, inDialog, user } = await openReview()
    const refetched: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'GET') {
        refetched.push(new URL(request.url).pathname)
      }
    })
    server.use(
      http.post(
        '*/api/transfers',
        () =>
          HttpResponse.json(
            {
              error: {
                code: 'INSUFFICIENT_FUNDS',
                message: 'Amount exceeds available balance.',
                fields: { amount: message },
                meta: { available: 100 },
              },
            },
            { status: 422 },
          ),
        { once: true },
      ),
    )

    await confirm()

    expect((await inDialog.findByRole('alert', {}, WAIT)).textContent).toBe(
      message,
    )
    expect(
      inDialog.getByRole('heading', { name: 'Check the details' }),
    ).toBeInTheDocument()
    expect(refetched.sort()).toEqual(['/api/accounts', '/api/customer'])

    await user.click(inDialog.getByRole('button', { name: 'Back' }))

    const amount = inDialog.getByRole('textbox', { name: 'Amount' })
    const errorId = amount.getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(errorId)?.textContent).toBe(message)
  })

  it('shows the general error for a rejection users cannot fix', async () => {
    server.use(
      http.post('*/api/transfers', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Please check the highlighted fields.',
              fields: {
                payeeId:
                  'Provide either a saved payee or new recipient details, not both.',
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { confirm, inDialog } = await openReview()

    await confirm()

    expect(await inDialog.findByRole('alert', {}, WAIT)).toHaveTextContent(
      SEND_ERROR,
    )
  })

  // Completes the brief's required test: the over-balance rule also stops a
  // request at the last moment, when the numbers change on the review step.
  it('sends no request if the limit changes while on review', async () => {
    const posts = recordTransfers()
    const { confirm, inDialog, queryClient } = await openReview()
    server.use(http.get('*/api/customer', () => customerWithUsedLimit(4950)))
    await act(() => queryClient.invalidateQueries({ queryKey: ['customer'] }))

    await confirm()

    await waitFor(() =>
      expect(inDialog.getByRole('alert').textContent).toBe(
        `This transfer exceeds your remaining daily limit (${formatMoney(50)}).`,
      ),
    )
    expect(posts).toEqual([])
  })
})
