import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { Dashboard } from '../dashboard/Dashboard'
import { formatMoney } from '../lib/format'
import { renderWithQueryClient } from '../test/renderWithQueryClient'
import { server } from '../test/setup'

// The mock API takes about 500 ms per response.
const WAIT = { timeout: 3000 }

async function openDialog() {
  const user = userEvent.setup()
  const queryClient = renderWithQueryClient(<Dashboard />)
  await user.click(
    await screen.findByRole('button', { name: 'New transfer' }, WAIT),
  )
  const dialog = screen.getByRole('dialog', { name: 'New transfer' })
  const inDialog = within(dialog)
  await inDialog.findByRole(
    'heading',
    { name: 'Who are you sending to?' },
    WAIT,
  )

  const pressContinue = () =>
    user.click(inDialog.getByRole('button', { name: 'Continue' }))

  return { dialog, inDialog, pressContinue, queryClient, user }
}

async function openAmountStep() {
  const opened = await openDialog()
  await opened.user.click(
    opened.inDialog.getByRole('radio', { name: /Jamie Tan/ }),
  )
  await opened.pressContinue()
  await opened.inDialog.findByRole('heading', { name: 'How much?' })
  return {
    ...opened,
    amount: opened.inDialog.getByRole('textbox', { name: 'Amount' }),
  }
}

const currentStep = (dialog: HTMLElement) =>
  within(dialog)
    .getAllByRole('listitem')
    .find((item) => item.getAttribute('aria-current') === 'step')?.textContent

/** The text of the error linked to a field through aria-describedby. */
const errorOf = (field: HTMLElement) =>
  document.getElementById(field.getAttribute('aria-describedby') ?? '')
    ?.textContent

describe('opening and closing', () => {
  it('stays closed until New transfer is pressed', async () => {
    renderWithQueryClient(<Dashboard />)
    await screen.findByRole('button', { name: 'New transfer' }, WAIT)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each(['Close', 'Cancel'])('closes with %s', async (name) => {
    const { inDialog, user } = await openDialog()

    await user.click(inDialog.getByRole('button', { name }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('discards what was entered when closed', async () => {
    const { inDialog, pressContinue, user } = await openDialog()
    await user.click(inDialog.getByRole('radio', { name: /Jamie Tan/ }))
    await pressContinue()
    await inDialog.findByRole('heading', { name: 'How much?' })
    await user.click(inDialog.getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'New transfer' }))

    const reopened = screen.getByRole('dialog')
    expect(currentStep(reopened)).toBe('Recipient')
    expect(
      within(reopened).getByRole('radio', { name: /Jamie Tan/ }),
    ).not.toBeChecked()
  })

  it('shows an error if payees fail to load, and Retry recovers', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        '*/api/payees',
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
            { status: 500 },
          ),
        { once: true },
      ),
    )
    renderWithQueryClient(<Dashboard />)
    await user.click(
      await screen.findByRole('button', { name: 'New transfer' }, WAIT),
    )
    const inDialog = within(screen.getByRole('dialog'))

    expect(await inDialog.findByRole('alert', {}, WAIT)).toHaveTextContent(
      "We couldn't load your payees.",
    )

    await user.click(inDialog.getByRole('button', { name: 'Retry' }))

    expect(
      await inDialog.findByRole('radio', { name: /Jamie Tan/ }, WAIT),
    ).toBeInTheDocument()
  })
})

describe('recipient step', () => {
  it('lists every payee, and requires a choice', async () => {
    const { dialog, inDialog, pressContinue } = await openDialog()

    for (const name of ['Jamie Tan', 'Marcus Lee', 'Priya Nair', 'Mum']) {
      expect(
        inDialog.getByRole('radio', { name: new RegExp(name) }),
      ).toBeInTheDocument()
    }

    await pressContinue()

    await waitFor(() =>
      expect(errorOf(inDialog.getByRole('radiogroup'))).toBe(
        'Choose a recipient.',
      ),
    )
    expect(currentStep(dialog)).toBe('Recipient')
    expect(inDialog.getAllByRole('radio')).toContain(document.activeElement)
  })

  it('filters payees by name or bank, and keeps a hidden choice', async () => {
    const { inDialog, pressContinue, user } = await openDialog()
    const search = inDialog.getByRole('searchbox', { name: 'Search payees' })
    await user.click(inDialog.getByRole('radio', { name: /Jamie Tan/ }))

    await user.type(search, 'ocbc')

    expect(inDialog.getByRole('radio', { name: /Marcus Lee/ })).toBeInTheDocument()
    expect(inDialog.queryByRole('radio', { name: /Jamie Tan/ })).toBeNull()

    await user.clear(search)
    await user.type(search, 'zzz')
    expect(inDialog.getByText('No payees match your search.')).toBeInTheDocument()

    await user.clear(search)
    expect(inDialog.getByRole('radio', { name: /Jamie Tan/ })).toBeChecked()

    await pressContinue()
    expect(
      await inDialog.findByRole('heading', { name: 'How much?' }),
    ).toBeInTheDocument()
  })

  it('pressing Enter in the search does not continue', async () => {
    const { dialog, inDialog, user } = await openDialog()

    await user.type(
      inDialog.getByRole('searchbox', { name: 'Search payees' }),
      'mum{Enter}',
    )

    expect(currentStep(dialog)).toBe('Recipient')
    expect(inDialog.getByRole('radiogroup')).not.toHaveAttribute(
      'aria-describedby',
    )
  })

  it('handles having no saved payees', async () => {
    server.use(http.get('*/api/payees', () => HttpResponse.json({ payees: [] })))
    const { inDialog } = await openDialog()

    expect(inDialog.getByText('No saved payees yet.')).toBeInTheDocument()
    expect(
      inDialog.getByRole('radio', { name: 'Send to someone new' }),
    ).toBeInTheDocument()
  })

  it('validates new recipient details, and focuses the first invalid field', async () => {
    const { dialog, inDialog, pressContinue, user } = await openDialog()
    await user.click(inDialog.getByRole('radio', { name: 'Send to someone new' }))
    const name = inDialog.getByRole('textbox', { name: 'Recipient name' })
    const number = inDialog.getByRole('textbox', {
      name: 'Account number (8 digits)',
    })
    const bank = inDialog.getByRole('combobox', { name: 'Bank' })

    await pressContinue()

    await waitFor(() => expect(name).toHaveFocus())
    expect(errorOf(name)).toBe('Enter a recipient name (2–50 characters).')
    expect(errorOf(number)).toBe('Enter a valid 8-digit account number.')
    expect(errorOf(bank)).toBe('Choose a bank.')
    expect(currentStep(dialog)).toBe('Recipient')

    await user.type(name, 'Alex Lim')
    await user.type(number, '12345678')
    await user.selectOptions(bank, 'OCBC')
    await pressContinue()

    expect(
      await inDialog.findByRole('heading', { name: 'How much?' }),
    ).toBeInTheDocument()
  })

  it('checks a field when the user leaves it', async () => {
    const { inDialog, user } = await openDialog()
    await user.click(inDialog.getByRole('radio', { name: 'Send to someone new' }))
    const number = inDialog.getByRole('textbox', {
      name: 'Account number (8 digits)',
    })

    await user.type(number, '123')
    expect(number).not.toHaveAttribute('aria-invalid')

    await user.tab()

    await waitFor(() =>
      expect(errorOf(number)).toBe('Enter a valid 8-digit account number.'),
    )
    expect(number).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('amount step', () => {
  // Required by the brief. Sending arrives with the review step, so this also
  // protects against a request being made as the amount is checked.
  it('shows the error for an amount over the balance, and sends no request', async () => {
    const { amount, dialog, pressContinue, user } = await openAmountStep()
    const posts: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') posts.push(request.url)
    })

    await user.type(amount, '4280.56')
    await pressContinue()

    await waitFor(() =>
      expect(errorOf(amount)).toBe(
        `Amount can't be more than your available balance (${formatMoney(4280.55)}).`,
      ),
    )
    expect(amount).toHaveFocus()
    expect(amount).toHaveAttribute('aria-invalid', 'true')
    expect(currentStep(dialog)).toBe('Amount')
    expect(posts).toEqual([])
    server.events.removeAllListeners()
  })

  it('offers only deposit accounts, and shows the balance and limit', async () => {
    const { dialog, inDialog, user } = await openAmountStep()
    const from = inDialog.getByRole('combobox', { name: 'From account' })

    expect(
      within(from)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Everyday Checking · •••• 4821', 'Savings Plus · •••• 9930'])
    expect(dialog.textContent).toContain(formatMoney(4280.55))
    expect(dialog.textContent).toContain(formatMoney(5000))

    await user.selectOptions(from, 'acc_savings')

    expect(dialog.textContent).toContain(formatMoney(12840))
  })

  it('re-checks the amount when the account changes', async () => {
    const { amount, inDialog, user } = await openAmountStep()
    const from = inDialog.getByRole('combobox', { name: 'From account' })
    await user.selectOptions(from, 'acc_savings')
    await user.type(amount, '4500')
    await user.tab()
    expect(amount).not.toHaveAttribute('aria-invalid')

    await user.selectOptions(from, 'acc_checking')

    await waitFor(() =>
      expect(errorOf(amount)).toBe(
        `Amount can't be more than your available balance (${formatMoney(4280.55)}).`,
      ),
    )

    await user.selectOptions(from, 'acc_savings')

    await waitFor(() => expect(amount).not.toHaveAttribute('aria-invalid'))
  })

  it('does not complain about an empty amount when the account changes', async () => {
    const { amount, inDialog, user } = await openAmountStep()

    await user.selectOptions(
      inDialog.getByRole('combobox', { name: 'From account' }),
      'acc_savings',
    )

    expect(amount).not.toHaveAttribute('aria-invalid')
  })

  it('fills the amount from the quick buttons, and checks it', async () => {
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
            transferredToday: 4900,
          },
        }),
      ),
    )
    const { amount, inDialog, user } = await openAmountStep()
    const quickAmounts = within(
      inDialog.getByRole('group', { name: 'Quick amounts' }),
    )

    await user.click(quickAmounts.getByRole('button', { name: '250' }))

    expect(amount).toHaveValue('250')
    await waitFor(() =>
      expect(errorOf(amount)).toBe(
        `This transfer exceeds your remaining daily limit (${formatMoney(100)}).`,
      ),
    )

    await user.click(quickAmounts.getByRole('button', { name: '50' }))

    await waitFor(() => expect(amount).not.toHaveAttribute('aria-invalid'))
  })

  it('uses the latest limit if it changes while the dialog is open', async () => {
    const { amount, pressContinue, queryClient, user } = await openAmountStep()
    await user.type(amount, '100')
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
            transferredToday: 4950,
          },
        }),
      ),
    )

    await act(() => queryClient.invalidateQueries({ queryKey: ['customer'] }))
    await pressContinue()

    await waitFor(() =>
      expect(errorOf(amount)).toBe(
        `This transfer exceeds your remaining daily limit (${formatMoney(50)}).`,
      ),
    )
  })

  it('counts note characters and rejects a long note', async () => {
    const { amount, inDialog, pressContinue, user } = await openAmountStep()
    const note = inDialog.getByRole('textbox', { name: 'Note (optional)' })
    await user.type(amount, '100')

    await user.type(note, 'Dinner')
    expect(inDialog.getByText('6/50')).toBeInTheDocument()

    await user.clear(note)
    await user.click(note)
    await user.paste('x'.repeat(51))
    expect(inDialog.getByText('51/50')).toBeInTheDocument()
    await pressContinue()

    await waitFor(() =>
      expect(errorOf(note)).toBe('Keep the note to 50 characters or fewer.'),
    )
    expect(note).toHaveFocus()
  })

  it('reaches the review step, and Back keeps everything entered', async () => {
    const { amount, dialog, inDialog, pressContinue, user } =
      await openAmountStep()
    await user.selectOptions(
      inDialog.getByRole('combobox', { name: 'From account' }),
      'acc_savings',
    )
    await user.type(amount, '120.50')
    await user.type(
      inDialog.getByRole('textbox', { name: 'Note (optional)' }),
      'Dinner',
    )

    await pressContinue()
    const reviewHeading = await inDialog.findByRole('heading', {
      name: 'Check the details',
    })
    expect(reviewHeading).toHaveFocus()
    expect(currentStep(dialog)).toBe('Review')

    await user.click(inDialog.getByRole('button', { name: 'Back' }))

    expect(inDialog.getByRole('textbox', { name: 'Amount' })).toHaveValue(
      '120.50',
    )
    expect(inDialog.getByRole('combobox', { name: 'From account' })).toHaveValue(
      'acc_savings',
    )
    expect(
      inDialog.getByRole('textbox', { name: 'Note (optional)' }),
    ).toHaveValue('Dinner')

    await user.click(inDialog.getByRole('button', { name: 'Back' }))

    expect(inDialog.getByRole('radio', { name: /Jamie Tan/ })).toBeChecked()
  })
})
