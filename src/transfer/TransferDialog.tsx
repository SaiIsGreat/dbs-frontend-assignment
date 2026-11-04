import { useEffect, useRef, type ReactNode } from 'react'
import { useAccounts } from '../api/queries/useAccounts'
import { useCustomer } from '../api/queries/useCustomer'
import { usePayees } from '../api/queries/usePayees'
import { Button } from '../components/Button'
import { Skeleton } from '../components/Skeleton'
import sharedStyles from '../components/components.module.css'
import { Stepper } from './Stepper'
import { TransferForm } from './TransferForm'
import styles from './transfer.module.css'

interface TransferDialogProps {
  onClose: () => void
}

/**
 * The parent mounts this only while the dialog is open, so closing it throws
 * away everything entered, and each new transfer starts fresh.
 *
 * Native <dialog> provides the focus trap, Esc to close, and returning focus to
 * the button that opened it. Those only happen through `close()`, so that always
 * runs first, and its `close` event then tells the parent to unmount this.
 */
export function TransferDialog({ onClose }: TransferDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const accounts = useAccounts()
  const customer = useCustomer()
  const payees = usePayees()

  useEffect(() => {
    const dialog = dialogRef.current
    // StrictMode runs effects twice in development.
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => dialogRef.current?.close()

  const failedQueries = [accounts, customer, payees].filter(
    (query) => query.isError && query.data === undefined,
  )

  // The form only renders once its data exists, so it never handles missing data.
  let content: ReactNode
  if (failedQueries.length > 0) {
    content = (
      <>
        <Stepper currentStep={0} />
        <div className={styles.body}>
          <p role="alert">We couldn&apos;t load your payees.</p>
          <Button
            onClick={() =>
              failedQueries.forEach((query) => void query.refetch())
            }
          >
            Retry
          </Button>
        </div>
      </>
    )
  } else if (!accounts.data || !customer.data || !payees.data) {
    content = (
      <>
        <Stepper currentStep={0} />
        <div className={styles.body}>
          <p className={sharedStyles.visuallyHidden} role="status">
            Loading your payees
          </p>
          <div className={styles.loading}>
            <Skeleton height="1.75rem" width="70%" />
            <Skeleton height="2.75rem" />
            <Skeleton height="14rem" />
          </div>
        </div>
      </>
    )
  } else {
    content = (
      <TransferForm
        accounts={accounts.data}
        customer={customer.data}
        onCancel={close}
        payees={payees.data}
      />
    )
  }

  return (
    <dialog
      aria-labelledby="transfer-title"
      className={styles.dialog}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title} id="transfer-title">
            New transfer
          </h2>
          <button
            aria-label="Close"
            className={styles.closeButton}
            onClick={close}
            type="button"
          >
            <svg aria-hidden="true" height="20" viewBox="0 0 20 20" width="20">
              <path
                d="M5 5l10 10M15 5L5 15"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </header>
        {content}
      </div>
    </dialog>
  )
}
