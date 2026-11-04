import type { ReactNode } from 'react'
import { useAccounts } from '../api/queries/useAccounts'
import { useCustomer } from '../api/queries/useCustomer'
import { useTransactions } from '../api/queries/useTransactions'
import { Button } from '../components/Button'
import { AccountCard } from './AccountCard'
import { BalanceHero } from './BalanceHero'
import { DailyLimitCard } from './DailyLimitCard'
import { DashboardSkeleton } from './DashboardSkeleton'
import { Header } from './Header'
import {
  RECENT_TRANSACTIONS_LIMIT,
  TransactionList,
} from './transactions/TransactionList'
import styles from './dashboard.module.css'

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
        <Button
          onClick={() => failedQueries.forEach((query) => void query.refetch())}
        >
          Retry
        </Button>
      </main>
    )
  } else if (!customer.data || !accounts.data || !transactions.data) {
    body = <DashboardSkeleton />
  } else {
    body = (
      <main className={styles.page}>
        <div className={styles.layout}>
          <h1 className={styles.greeting}>
            Good evening, {customer.data.firstName}
          </h1>
          <BalanceHero accounts={accounts.data} />
          <section aria-labelledby="accounts-title">
            <h2 className={styles.sectionTitle} id="accounts-title">
              Accounts
            </h2>
            {accounts.data.length > 0 ? (
              <ul className={styles.accounts}>
                {accounts.data.map((account) => (
                  <AccountCard account={account} key={account.id} />
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>No accounts to show.</p>
            )}
          </section>
          <DailyLimitCard customer={customer.data} />
          <TransactionList />
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
