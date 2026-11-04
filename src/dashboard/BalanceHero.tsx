import type { Account } from '../api/types'
import { formatMoney } from '../lib/format'
import styles from './dashboard.module.css'

interface BalanceHeroProps {
  accounts: Account[]
}

export function BalanceHero({ accounts }: BalanceHeroProps) {
  // The credit card is money owed, so it isn't part of what's available.
  const depositAccounts = accounts.filter((account) => account.type !== 'credit')
  const total = depositAccounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  )
  const accountWord = depositAccounts.length === 1 ? 'account' : 'accounts'

  return (
    <section
      aria-labelledby="total-available"
      className={`${styles.hero} ${styles.heroLoaded}`}
    >
      <h2 className={styles.heroLabel} id="total-available">
        Total available
      </h2>
      <p className={`${styles.heroAmount} ${styles.amount}`}>
        {formatMoney(total)}
      </p>
      <p className={styles.heroCaption}>
        Across {depositAccounts.length} deposit {accountWord}
      </p>
    </section>
  )
}
