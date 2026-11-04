import type { Transaction } from '../../api/types'
import { formatMoney, formatShortDate } from '../../lib/format'
import styles from './transactions.module.css'

interface TransactionRowProps {
  transaction: Transaction
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isMoneyIn = transaction.direction === 'in'

  return (
    <li className={styles.row}>
      <div className={styles.details}>
        <span className={styles.description}>{transaction.description}</span>
        <span className={styles.meta}>
          <span className={styles.category}>{transaction.category}</span>
          {' · '}
          {formatShortDate(transaction.date)}
        </span>
      </div>
      <div className={styles.values}>
        <span className={isMoneyIn ? styles.moneyIn : styles.moneyOut}>
          {isMoneyIn
            ? `+${formatMoney(transaction.amount)}`
            : formatMoney(-transaction.amount)}
        </span>
        {transaction.status === 'pending' && (
          <span className={styles.pending}>Pending</span>
        )}
      </div>
    </li>
  )
}
