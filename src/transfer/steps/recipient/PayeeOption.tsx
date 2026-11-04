import { useFormContext } from 'react-hook-form'
import type { Payee } from '../../../api/types'
import type { TransferFormValues } from '../../transferSchema'
import styles from './recipient.module.css'

interface PayeeOptionProps {
  payee: Payee
}

export function PayeeOption({ payee }: PayeeOptionProps) {
  const { register } = useFormContext<TransferFormValues>()

  return (
    <label className={styles.option}>
      <input type="radio" value={payee.id} {...register('payeeId')} />
      <span aria-hidden="true" className={styles.initials}>
        {payee.initials}
      </span>
      <span className={styles.optionText}>
        <span className={styles.optionName}>{payee.name}</span>
        <span className={styles.optionMeta}>
          {payee.bank} · {payee.accountNumberMasked}
        </span>
      </span>
    </label>
  )
}
