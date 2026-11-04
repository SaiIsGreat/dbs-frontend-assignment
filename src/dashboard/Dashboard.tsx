import type { ReactNode } from 'react'
import { useAccounts } from '../api/queries/useAccounts'
import { useCustomer } from '../api/queries/useCustomer'
import { useTransactions } from '../api/queries/useTransactions'
import { DashboardSkeleton } from './DashboardSkeleton'
import { Header } from './Header'
import styles from './dashboard.module.css'

const RECENT_TRANSACTIONS_LIMIT = 8

export function Dashboard() {
  const customer = useCustomer()
  const accounts = useAccounts()
  const transactions = useTransactions({ limit: RECENT_TRANSACTIONS_LIMIT })

  // A failed background refresh keeps its old data, so the dashboard stays up.
  // The error screen is only for queries with nothing to show.
  const failedQueries = [customer, accounts, transactions].filter(
    (query) => query.isError && query.data === undefined,
  )

  let body: ReactNode

  if (failedQueries.length > 0) {
    body = (
      <main className={styles.page}>
        <p role="alert">We couldn&apos;t load your dashboard.</p>
        <button
          className={styles.retryButton}
          onClick={() => failedQueries.forEach((query) => void query.refetch())}
          type="button"
        >
          Retry
        </button>
      </main>
    )
  } else if (!customer.data || !accounts.data || !transactions.data) {
    body = <DashboardSkeleton />
  } else {
    // Placeholder content: the styled sections replace this in the next slices.
    body = (
      <main className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <h1 className={styles.greeting}>
              Good evening, {customer.data.firstName}
            </h1>
            <section className={styles.hero} />
            <section className={styles.accounts}>
              {accounts.data.map((account) => (
                <div className={styles.accountCard} key={account.id}>
                  {account.name}
                </div>
              ))}
            </section>
            <section className={styles.transactions}>
              {transactions.data.transactions.map((transaction) => (
                <div className={styles.transactionRow} key={transaction.id}>
                  {transaction.description}
                </div>
              ))}
            </section>
          </div>
          <aside className={styles.rail} />
        </div>
      </main>
    )
  }

  return (
    <>
      <Header customer={customer.data} />
      {body}
    </>
  )
}
