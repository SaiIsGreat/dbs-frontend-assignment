import { Skeleton } from '../../components/Skeleton'
import { RECENT_TRANSACTIONS_LIMIT } from './TransactionList'
import styles from './transactions.module.css'

export function TransactionListSkeleton() {
  return (
    <div>
      <div className={styles.header}>
        <div className={styles.title}>
          <Skeleton
            height="calc(1em * var(--leading-tight))"
            width="12rem"
          />
        </div>
        <div className={styles.search}>
          <Skeleton height="100%" />
        </div>
      </div>
      <div className={styles.list}>
        {Array.from({ length: RECENT_TRANSACTIONS_LIMIT }, (_, index) => (
          <div className={styles.row} key={index}>
            <Skeleton height="1.5rem" />
          </div>
        ))}
      </div>
    </div>
  )
}
