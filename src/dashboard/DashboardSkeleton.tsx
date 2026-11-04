import { Skeleton } from '../components/Skeleton'
import sharedStyles from '../components/components.module.css'
import { TransactionListSkeleton } from './transactions/TransactionListSkeleton'
import styles from './dashboard.module.css'

const ACCOUNT_CARDS = 3
const LINE_HEIGHT = 'calc(1em * var(--leading-tight))'

export function DashboardSkeleton() {
  return (
    <main className={styles.page}>
      <p className={sharedStyles.visuallyHidden} role="status">
        Loading your dashboard
      </p>
      <div className={styles.layout}>
        <div className={styles.greeting}>
          <Skeleton height={LINE_HEIGHT} width="16rem" />
        </div>
        <div className={`${styles.card} ${styles.hero}`}>
          <Skeleton height="100%" />
        </div>
        <div>
          <div className={styles.sectionTitle}>
            <Skeleton height={LINE_HEIGHT} width="6rem" />
          </div>
          <div className={styles.accounts}>
            {Array.from({ length: ACCOUNT_CARDS }, (_, index) => (
              <div
                className={`${styles.card} ${styles.accountCard}`}
                key={index}
              >
                <Skeleton height="100%" />
              </div>
            ))}
          </div>
        </div>
        <div className={`${styles.card} ${styles.rail}`}>
          <Skeleton height="100%" />
        </div>
        <TransactionListSkeleton />
      </div>
    </main>
  )
}
