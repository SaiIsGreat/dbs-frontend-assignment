import { z } from 'zod'
import type { Account } from '../api/types'
import { getDepositAccounts } from '../lib/banking'
import { formatMoney } from '../lib/format'

/** The payee list's value for "Send to someone new". */
export const NEW_RECIPIENT = 'new'

const NOTE_MAX_LENGTH = 50

interface TransferSchemaOptions {
  accounts: Account[]
  remainingLimit: number
}

/**
 * Every transfer rule, defined once. It's a function because some rules and
 * messages depend on the live balance and limit.
 *
 * Field names match the API's error keys, so its errors can be shown directly.
 * When a field breaks several rules, the form shows the first one listed.
 */
export function createTransferSchema({
  accounts,
  remainingLimit,
}: TransferSchemaOptions) {
  const depositAccounts = getDepositAccounts(accounts)

  return z
    .object({
      payeeId: z.string().min(1, 'Choose a recipient.'),
      recipient: z.object({
        name: z.string().trim(),
        accountNumber: z.string().trim(),
        bank: z.string(),
      }),
      fromAccountId: z.string().min(1, 'Choose an account to transfer from.'),
      // A string until it's sent: checking the text avoids decimal rounding
      // problems, and an empty field stays empty rather than becoming 0.
      amount: z
        .string()
        .trim()
        .regex(/^\d+(\.\d+)?$/, 'Enter an amount.')
        .regex(/^\d+(\.\d{1,2})?$/, 'Use at most 2 decimal places.')
        .refine(
          (amount) => Number(amount) >= 1,
          'Enter an amount of at least SGD 1.00.',
        ),
      note: z
        .string()
        .max(NOTE_MAX_LENGTH, 'Keep the note to 50 characters or fewer.'),
    })
    .superRefine((values, ctx) => {
      // These rules depend on more than one field.
      const addError = (path: string[], message: string) =>
        ctx.addIssue({ code: 'custom', path, message })

      if (values.payeeId === NEW_RECIPIENT) {
        const { name, accountNumber, bank } = values.recipient
        if (name.length < 2 || name.length > 50) {
          addError(
            ['recipient', 'name'],
            'Enter a recipient name (2–50 characters).',
          )
        }
        if (!/^\d{8}$/.test(accountNumber)) {
          addError(
            ['recipient', 'accountNumber'],
            'Enter a valid 8-digit account number.',
          )
        }
        if (!bank) {
          addError(['recipient', 'bank'], 'Choose a bank.')
        }
      }

      const amount = Number(values.amount)
      const account = depositAccounts.find(
        ({ id }) => id === values.fromAccountId,
      )
      if (account && amount > account.balance) {
        addError(
          ['amount'],
          `Amount can't be more than your available balance (${formatMoney(account.balance)}).`,
        )
      }
      if (amount > remainingLimit) {
        addError(
          ['amount'],
          `This transfer exceeds your remaining daily limit (${formatMoney(remainingLimit)}).`,
        )
      }
    })
}

export type TransferFormValues = z.infer<
  ReturnType<typeof createTransferSchema>
>
