import { useEffect, useRef } from 'react'
import type { Account, Payee } from '../../../api/types'
import { ReviewSummary } from './ReviewSummary'
import styles from './review.module.css'

interface ReviewStepProps {
  accounts: Account[]
  payees: Payee[]
  sendError: string | null
}

export function ReviewStep({ accounts, payees, sendError }: ReviewStepProps) {
  const alertRef = useRef<HTMLParagraphElement>(null)

  // Confirm lost focus when it was disabled, so keyboard users need a new place
  // to continue from. Not Confirm itself, where a stray Enter would send again.
  useEffect(() => {
    if (sendError) alertRef.current?.focus()
  }, [sendError])

  return (
    <>
      <ReviewSummary accounts={accounts} payees={payees} />
      <p className={styles.arrival}>Usually arrives in minutes.</p>
      {sendError && (
        <p
          className={styles.sendError}
          ref={alertRef}
          role="alert"
          tabIndex={-1}
        >
          {sendError}
        </p>
      )}
    </>
  )
}
