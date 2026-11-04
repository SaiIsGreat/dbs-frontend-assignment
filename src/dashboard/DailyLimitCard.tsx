import type { Customer } from '../api/types'
import { getRemainingDailyLimit } from '../lib/banking'
import { formatMoney } from '../lib/format'
import styles from './dashboard.module.css'

interface DailyLimitCardProps {
  customer: Customer
}

export function DailyLimitCard({ customer }: DailyLimitCardProps) {
  const remaining = getRemainingDailyLimit(customer)

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
