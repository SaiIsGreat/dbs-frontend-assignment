import { useFormContext } from 'react-hook-form'
import { FieldError } from '../../FieldError'
import { TextField } from '../../TextField'
import type { TransferFormValues } from '../../transferSchema'
import fieldStyles from '../../transfer.module.css'
import styles from './recipient.module.css'

// The banks in the mock API's data. It has no endpoint that lists banks.
const BANKS = ['DBS', 'OCBC', 'UOB', 'POSB']

export function NewRecipientFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<TransferFormValues>()
  const bankError = errors.recipient?.bank?.message

  return (
    <div className={styles.newRecipient}>
      <TextField
        autoComplete="off"
        label="Recipient name"
        name="recipient.name"
      />
      <TextField
        autoComplete="off"
        inputMode="numeric"
        label="Account number (8 digits)"
        name="recipient.accountNumber"
      />
      <div className={fieldStyles.field}>
        <label className={fieldStyles.label} htmlFor="field-recipient.bank">
          Bank
        </label>
        <select
          aria-describedby={bankError ? 'field-recipient.bank-error' : undefined}
          aria-invalid={bankError ? true : undefined}
          className={fieldStyles.input}
          id="field-recipient.bank"
          {...register('recipient.bank')}
        >
          <option value="">Choose a bank</option>
          {BANKS.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
        <FieldError id="field-recipient.bank-error" message={bankError} />
      </div>
    </div>
  )
}
