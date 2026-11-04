import { useFormContext, useWatch } from 'react-hook-form'
import type { Account } from '../../../api/types'
import { getDepositAccounts } from '../../../lib/banking'
import { formatMoney } from '../../../lib/format'
import { FieldError } from '../../FieldError'
import { TextField } from '../../TextField'
import type { TransferFormValues } from '../../transferSchema'
import fieldStyles from '../../transfer.module.css'
import { AmountField } from './AmountField'
import styles from './amount.module.css'

const ACCOUNT_ERROR_ID = 'field-fromAccountId-error'

interface AmountStepProps {
  accounts: Account[]
  remainingLimit: number
}

export function AmountStep({ accounts, remainingLimit }: AmountStepProps) {
  const {
    control,
    getValues,
    register,
    trigger,
    formState: { errors },
  } = useFormContext<TransferFormValues>()
  const fromAccountId = useWatch({ control, name: 'fromAccountId' })
  const note = useWatch({ control, name: 'note' })

  const depositAccounts = getDepositAccounts(accounts)
  const account = depositAccounts.find(({ id }) => id === fromAccountId)
  const accountError = errors.fromAccountId?.message

  return (
    <div className={styles.fields}>
      <div className={fieldStyles.field}>
        <label className={fieldStyles.label} htmlFor="field-fromAccountId">
          From account
        </label>
        <select
          aria-describedby={accountError ? ACCOUNT_ERROR_ID : undefined}
          aria-invalid={accountError ? true : undefined}
          className={fieldStyles.input}
          id="field-fromAccountId"
          {...register('fromAccountId', {
            // An amount that fits one account can be too much for another.
            onChange: () => {
              if (getValues('amount')) void trigger('amount')
            },
          })}
        >
          {depositAccounts.map(({ id, name, maskedNumber }) => (
            <option key={id} value={id}>
              {name} · {maskedNumber}
            </option>
          ))}
        </select>
        <FieldError id={ACCOUNT_ERROR_ID} message={accountError} />
      </div>

      <AmountField />

      <dl className={styles.limits}>
        <div className={styles.limit}>
          <dt>Available</dt>
          <dd className={styles.limitValue}>
            {account ? formatMoney(account.balance) : '—'}
          </dd>
        </div>
        <div className={styles.limit}>
          <dt>Remaining daily limit</dt>
          <dd className={styles.limitValue}>{formatMoney(remainingLimit)}</dd>
        </div>
      </dl>

      <TextField
        autoComplete="off"
        label="Note (optional)"
        labelAside={<span className={styles.counter}>{note.length}/50</span>}
        name="note"
      />
    </div>
  )
}
