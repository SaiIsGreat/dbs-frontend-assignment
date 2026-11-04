import { describe, expect, it } from 'vitest'
import type { Account } from '../api/types'
import { formatMoney } from '../lib/format'
import { createTransferSchema, NEW_RECIPIENT } from './transferSchema'

const accounts: Account[] = [
  {
    id: 'acc_checking',
    name: 'Everyday Checking',
    type: 'checking',
    maskedNumber: '•••• 4821',
    balance: 4280.55,
    currency: 'SGD',
  },
  {
    id: 'acc_savings',
    name: 'Savings Plus',
    type: 'savings',
    maskedNumber: '•••• 9930',
    balance: 12840,
    currency: 'SGD',
  },
  {
    id: 'acc_credit',
    name: 'Rewards Card',
    type: 'credit',
    maskedNumber: '•••• 7712',
    balance: 1000,
    currency: 'SGD',
  },
]

const validValues = {
  payeeId: 'pay_001',
  recipient: { name: '', accountNumber: '', bank: '' },
  fromAccountId: 'acc_checking',
  amount: '120',
  note: '',
}

const newRecipient = {
  payeeId: NEW_RECIPIENT,
  recipient: { name: 'Alex Lim', accountNumber: '12345678', bank: 'OCBC' },
}

/** The message the form would show: the first one listed for that field. */
function errorFor(values: Partial<typeof validValues>, field: string) {
  const result = createTransferSchema({
    accounts,
    remainingLimit: 5000,
  }).safeParse({ ...validValues, ...values })
  return result.error?.issues.find((issue) => issue.path.join('.') === field)
    ?.message
}

const balanceError = `Amount can't be more than your available balance (${formatMoney(4280.55)}).`
const limitError = `This transfer exceeds your remaining daily limit (${formatMoney(5000)}).`

describe('createTransferSchema', () => {
  it('accepts a valid saved payee, and valid new recipient details', () => {
    const schema = createTransferSchema({ accounts, remainingLimit: 5000 })

    expect(schema.safeParse(validValues).success).toBe(true)
    expect(schema.safeParse({ ...validValues, ...newRecipient }).success).toBe(
      true,
    )
  })

  it('requires a recipient', () => {
    expect(errorFor({ payeeId: '' }, 'payeeId')).toBe('Choose a recipient.')
  })

  it.each([
    ['', 'Enter an amount.'],
    ['abc', 'Enter an amount.'],
    ['-5', 'Enter an amount.'],
    ['1e3', 'Enter an amount.'],
    ['0.99', 'Enter an amount of at least SGD 1.00.'],
    ['12.345', 'Use at most 2 decimal places.'],
    ['4280.56', balanceError],
    [' 4280.55 ', undefined],
    ['1', undefined],
    ['12.5', undefined],
    ['4.35', undefined],
    ['4280.55', undefined],
  ])('amount %j gives %j', (amount, message) => {
    expect(errorFor({ amount }, 'amount')).toBe(message)
  })

  it('checks the amount against the chosen account', () => {
    const values = { amount: '4500', fromAccountId: 'acc_savings' }

    expect(errorFor(values, 'amount')).toBeUndefined()
    expect(errorFor({ ...values, fromAccountId: 'acc_checking' }, 'amount')).toBe(
      balanceError,
    )
  })

  it('checks the amount against the remaining daily limit', () => {
    expect(
      errorFor({ amount: '5000.01', fromAccountId: 'acc_savings' }, 'amount'),
    ).toBe(limitError)
    expect(
      errorFor({ amount: '5000', fromAccountId: 'acc_savings' }, 'amount'),
    ).toBeUndefined()
  })

  it('shows the balance error first when both limits are exceeded', () => {
    expect(errorFor({ amount: '6000' }, 'amount')).toBe(balanceError)
  })

  it('still reports the balance when the note is too long', () => {
    const values = { amount: '5000', note: 'x'.repeat(51) }

    expect(errorFor(values, 'amount')).toBe(balanceError)
    expect(errorFor(values, 'note')).toBe(
      'Keep the note to 50 characters or fewer.',
    )
  })

  it('allows a note of exactly 50 characters', () => {
    expect(errorFor({ note: 'x'.repeat(50) }, 'note')).toBeUndefined()
  })

  it.each([
    ['name', 'A', 'Enter a recipient name (2–50 characters).'],
    ['name', 'x'.repeat(51), 'Enter a recipient name (2–50 characters).'],
    ['name', '  A  ', 'Enter a recipient name (2–50 characters).'],
    ['accountNumber', '1234567', 'Enter a valid 8-digit account number.'],
    ['accountNumber', '123456789', 'Enter a valid 8-digit account number.'],
    ['accountNumber', '1234567a', 'Enter a valid 8-digit account number.'],
    ['bank', '', 'Choose a bank.'],
  ])('new recipient %s %j is rejected', (field, value, message) => {
    const values = {
      payeeId: NEW_RECIPIENT,
      recipient: { ...newRecipient.recipient, [field]: value },
    }

    expect(errorFor(values, `recipient.${field}`)).toBe(message)
  })

  it('ignores the new recipient fields when a saved payee is chosen', () => {
    const result = createTransferSchema({
      accounts,
      remainingLimit: 5000,
    }).safeParse({
      ...validValues,
      recipient: { name: 'A', accountNumber: 'nope', bank: '' },
    })

    expect(result.success).toBe(true)
  })
})
