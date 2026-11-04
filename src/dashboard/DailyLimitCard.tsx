import type { Customer } from '../api/types'
import { formatMoney } from '../lib/format'
import styles from './dashboard.module.css'

interface DailyLimitCardProps {
  customer: Customer
}

export function DailyLimitCard({ customer }: DailyLimitCardProps) {
  const remaining = customer.dailyTransferLimit - customer.transferredToday

  return (
    <aside
      aria-labelledby="daily-limit"
      className={`${styles.card} ${styles.rail}`}
    >
      <h2 className={styles.railTitle} id="daily-limit">
        Daily limit
      </h2>
      <p className={styles.railAmount}>
        <span className={styles.amount}>{formatMoney(remaining)}</span>{' '}
        remaining today
      </p>
      <p className={styles.muted}>Resets daily. Applies to all transfers.</p>
    </aside>
  )
}
