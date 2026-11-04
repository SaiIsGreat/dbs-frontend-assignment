import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Dashboard } from '../dashboard/Dashboard'
import { renderWithQueryClient } from '../test/renderWithQueryClient'

// The mock API takes about 500 ms per response.
const WAIT = { timeout: 3000 }

async function openDialog() {
  const user = userEvent.setup()
  renderWithQueryClient(<Dashboard />)
  await user.click(
    await screen.findByRole('button', { name: 'New transfer' }, WAIT),
  )
  return { user, dialog: screen.getByRole('dialog', { name: 'New transfer' }) }
}

const currentStep = (dialog: HTMLElement) =>
  within(dialog)
    .getAllByRole('listitem')
    .find((item) => item.getAttribute('aria-current') === 'step')?.textContent

describe('TransferDialog', () => {
  it('stays closed until New transfer is pressed', async () => {
    renderWithQueryClient(<Dashboard />)
    await screen.findByRole('button', { name: 'New transfer' }, WAIT)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on the first step, and the stepper follows Continue and Back', async () => {
    const { user, dialog } = await openDialog()
    const inDialog = within(dialog)

    expect(currentStep(dialog)).toBe('Recipient')
    expect(
      inDialog.getByRole('heading', { name: 'Who are you sending to?' }),
    ).toBeInTheDocument()

    await user.click(inDialog.getByRole('button', { name: 'Continue' }))
    expect(currentStep(dialog)).toBe('Amount')
    expect(
      inDialog.getByRole('heading', { name: 'How much?' }),
    ).toBeInTheDocument()

    await user.click(inDialog.getByRole('button', { name: 'Continue' }))
    expect(currentStep(dialog)).toBe('Review')
    expect(
      inDialog.getByRole('heading', { name: 'Check the details' }),
    ).toBeInTheDocument()

    await user.click(inDialog.getByRole('button', { name: 'Back' }))
    expect(currentStep(dialog)).toBe('Amount')
  })

  it.each(['Close', 'Cancel'])('closes with %s', async (name) => {
    const { user, dialog } = await openDialog()

    await user.click(within(dialog).getByRole('button', { name }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('starts again from the first step when reopened', async () => {
    const { user, dialog } = await openDialog()
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'New transfer' }))

    expect(currentStep(screen.getByRole('dialog'))).toBe('Recipient')
  })
})
