import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    const dialog = dialogRef.current
    // StrictMode runs effects twice in development.
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => dialogRef.current?.close()

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
        <TransferForm onCancel={close} />
      </div>
    </dialog>
  )
}
