import { useFormContext } from 'react-hook-form'
import { FieldError } from '../../FieldError'
import type { TransferFormValues } from '../../transferSchema'
import fieldStyles from '../../transfer.module.css'
import styles from './amount.module.css'

const QUICK_AMOUNTS = ['50', '100', '250', '500']
const ERROR_ID = 'field-amount-error'

export function AmountField() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<TransferFormValues>()
  const error = errors.amount?.message

  return (
    <div className={fieldStyles.field}>
      <label className={fieldStyles.label} htmlFor="field-amount">
        Amount
      </label>
      <div className={styles.amountInput}>
        <span aria-hidden="true" className={styles.currency}>
          SGD
        </span>
        <input
          aria-describedby={error ? ERROR_ID : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          className={styles.amountValue}
          id="field-amount"
          inputMode="decimal"
          {...register('amount')}
        />
      </div>
      <FieldError id={ERROR_ID} message={error} />
      <div aria-label="Quick amounts" className={styles.quickAmounts} role="group">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            className={styles.quickAmount}
            key={amount}
            onClick={() =>
              setValue('amount', amount, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
            type="button"
          >
            {amount}
          </button>
        ))}
      </div>
    </div>
  )
}
