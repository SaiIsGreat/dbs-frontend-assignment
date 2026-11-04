import type { Account } from '../api/types'
import { formatMoney } from '../lib/format'
import styles from './dashboard.module.css'

interface AccountCardProps {
  account: Account
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <li className={`${styles.card} ${styles.accountCard}`}>
      <span className={styles.accountName}>{account.name}</span>
      <span className={`${styles.muted} ${styles.amount}`}>
        {account.maskedNumber}
      </span>
      <div className={styles.accountFooter}>
        {account.type === 'credit' && (
          <span className={styles.muted}>Amount due</span>
        )}
        <span className={`${styles.accountBalance} ${styles.amount}`}>
          {formatMoney(account.balance)}
        </span>
      </div>
    </li>
  )
}
