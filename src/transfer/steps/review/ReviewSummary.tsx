import { useFormContext } from 'react-hook-form'
import type { Account, Payee } from '../../../api/types'
import { formatMoney } from '../../../lib/format'
import {
  NEW_RECIPIENT,
  type TransferFormValues,
} from '../../transferSchema'
import styles from './review.module.css'

// The API charges no fee, and only reports that once a transfer has been sent.
const FEE = 0

interface ReviewSummaryProps {
  accounts: Account[]
  payees: Payee[]
}

export function ReviewSummary({ accounts, payees }: ReviewSummaryProps) {
  const { getValues } = useFormContext<TransferFormValues>()
  const { payeeId, recipient, fromAccountId, amount, note } = getValues()

  const account = accounts.find(({ id }) => id === fromAccountId)
  const payee = payees.find(({ id }) => id === payeeId)
  const to =
    payeeId === NEW_RECIPIENT
      ? `${recipient.name.trim()} · ${recipient.bank} · •••• ${recipient.accountNumber.trim().slice(-4)}`
      : `${payee?.name} · ${payee?.bank} · ${payee?.accountNumberMasked}`
  const amountValue = Number(amount)

  return (
    <dl className={styles.summary}>
      <div className={styles.row}>
        <dt>From</dt>
        <dd>
          {account?.name} · {account?.maskedNumber}
        </dd>
      </div>
      <div className={styles.row}>
        <dt>To</dt>
        <dd>{to}</dd>
      </div>
      <div className={styles.row}>
        <dt>Amount</dt>
        <dd className={styles.money}>{formatMoney(amountValue)}</dd>
      </div>
      <div className={styles.row}>
        <dt>Fee</dt>
        <dd className={styles.money}>{formatMoney(FEE)}</dd>
      </div>
      {note && (
        <div className={styles.row}>
          <dt>Note</dt>
          <dd>{note}</dd>
        </div>
      )}
      <div className={`${styles.row} ${styles.total}`}>
        <dt>Total</dt>
        <dd className={styles.money}>{formatMoney(amountValue + FEE)}</dd>
      </div>
    </dl>
  )
}
