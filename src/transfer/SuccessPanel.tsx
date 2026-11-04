import { useEffect, useRef } from 'react'
import type { Transfer } from '../api/types'
import { Button } from '../components/Button'
import { formatMoney } from '../lib/format'
import styles from './transfer.module.css'

interface SuccessPanelProps {
  transfer: Transfer
  onDone: () => void
}

export function SuccessPanel({ transfer, onDone }: SuccessPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { name, bank, accountNumberMasked } = transfer.recipient

  // The Confirm button that had focus has gone, so focus needs a new home.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className={styles.success}>
      <h3 className={styles.stepTitle} ref={headingRef} tabIndex={-1}>
        Transfer sent
      </h3>
      <p className={styles.successAmount}>{formatMoney(transfer.amount)}</p>
      <p>
        to {name} · {bank} · {accountNumberMasked}
      </p>
      <p>
        Reference <strong>{transfer.reference}</strong>
      </p>
      <p className={styles.successNote}>
        The money should arrive within minutes.
      </p>
      <Button onClick={onDone}>Back to dashboard</Button>
    </div>
  )
}
