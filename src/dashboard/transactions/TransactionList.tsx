import { useRef, useState } from 'react'
import { useTransactions } from '../../api/queries/useTransactions'
import { Button } from '../../components/Button'
import { SearchInput } from './SearchInput'
import { TransactionRow } from './TransactionRow'
import { useDebouncedValue } from './useDebouncedValue'
import styles from './transactions.module.css'

export const RECENT_TRANSACTIONS_LIMIT = 8
// The API's maximum, so a search shows every match rather than the newest 8.
const SEARCH_LIMIT = 50
const SEARCH_DELAY_MS = 300

export function TransactionList() {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const typedTerm = search.trim()
  const debouncedTerm = useDebouncedValue(typedTerm, SEARCH_DELAY_MS)
  const isSearching = typedTerm !== ''
  // Clearing skips the delay, so the full list comes back straight away.
  const term = isSearching ? debouncedTerm : ''

  const query = useTransactions({
    limit: term ? SEARCH_LIMIT : RECENT_TRANSACTIONS_LIMIT,
    q: term,
  })
  const transactions = query.data?.transactions ?? []
  const total = query.data?.total ?? 0

  // Old rows stay on screen during this, so they mustn't be counted as results.
  const isUpdating = query.isPlaceholderData || typedTerm !== term
  const hasFailed = query.isError && query.data === undefined

  let status = ''
  if (isSearching && !hasFailed) {
    if (isUpdating) {
      status = 'Searching…'
    } else if (total === 0) {
      status = 'No transactions match your search.'
    } else {
      status = total === 1 ? '1 result' : `${total} results`
    }
  }

  function clearSearch() {
    setSearch('')
    // The button is about to disappear, which would otherwise lose focus.
    inputRef.current?.focus()
  }

  return (
    <section aria-labelledby="transactions-title">
      <div className={styles.header}>
        <h2 className={styles.title} id="transactions-title">
          Recent transactions
        </h2>
        <SearchInput onChange={setSearch} ref={inputRef} value={search} />
      </div>

      <div className={styles.summary}>
        {/* Always mounted, so screen readers announce changes to its text. */}
        <p className={styles.status} role="status">
          {status}
        </p>
        {isSearching && (
          <Button onClick={clearSearch} variant="secondary">
            Clear search
          </Button>
        )}
      </div>

      {hasFailed && (
        <div className={styles.message}>
          <p role="alert">We couldn&apos;t search your transactions.</p>
          <Button onClick={() => void query.refetch()}>Retry</Button>
        </div>
      )}

      {!hasFailed && !isSearching && !isUpdating && total === 0 && (
        <p className={styles.message}>No transactions yet.</p>
      )}

      {!hasFailed && transactions.length > 0 && (
        <ul className={styles.list}>
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}
    </section>
  )
}
