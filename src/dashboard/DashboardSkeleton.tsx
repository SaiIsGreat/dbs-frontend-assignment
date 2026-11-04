import { Skeleton } from '../components/Skeleton'
import styles from './dashboard.module.css'

const ACCOUNT_CARDS = 3
const TRANSACTION_ROWS = 8

export function DashboardSkeleton() {
  return (
    <main className={styles.page}>
      <p className={styles.visuallyHidden} role="status">
        Loading your dashboard
      </p>
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <div className={styles.greeting}>
            <Skeleton height="calc(1em * var(--leading-tight))" width="16rem" />
          </div>
          <div className={styles.hero}>
            <Skeleton height="100%" />
          </div>
          <div className={styles.accounts}>
            {Array.from({ length: ACCOUNT_CARDS }, (_, index) => (
              <div className={styles.accountCard} key={index}>
                <Skeleton height="100%" />
              </div>
            ))}
          </div>
          <div className={styles.transactions}>
            {Array.from({ length: TRANSACTION_ROWS }, (_, index) => (
              <div className={styles.transactionRow} key={index}>
                <Skeleton height="1.5rem" />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.rail}>
          <Skeleton height="100%" />
        </div>
      </div>
    </main>
  )
}
