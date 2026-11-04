import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { Payee } from '../../../api/types'
import { FieldError } from '../../FieldError'
import {
  NEW_RECIPIENT,
  type TransferFormValues,
} from '../../transferSchema'
import fieldStyles from '../../transfer.module.css'
import { NewRecipientFields } from './NewRecipientFields'
import { PayeeOption } from './PayeeOption'
import styles from './recipient.module.css'

const ERROR_ID = 'field-payeeId-error'

interface RecipientStepProps {
  payees: Payee[]
}

export function RecipientStep({ payees }: RecipientStepProps) {
  const [search, setSearch] = useState('')
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<TransferFormValues>()
  const payeeId = useWatch({ control, name: 'payeeId' })
  const error = errors.payeeId?.message

  // All 4 payees are already loaded, so filtering here needs no API search.
  const term = search.trim().toLowerCase()
  const visiblePayees = payees.filter(
    ({ name, bank }) =>
      name.toLowerCase().includes(term) || bank.toLowerCase().includes(term),
  )

  return (
    <>
      <div className={fieldStyles.field}>
        <label className={fieldStyles.label} htmlFor="payee-search">
          Search payees
        </label>
        <input
          className={fieldStyles.input}
          id="payee-search"
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            // Enter here shouldn't press Continue.
            if (event.key === 'Enter') event.preventDefault()
          }}
          type="search"
          value={search}
        />
      </div>

      <div
        aria-describedby={error ? ERROR_ID : undefined}
        aria-label="Recipient"
        className={styles.options}
        role="radiogroup"
      >
        {visiblePayees.map((payee) => (
          <PayeeOption key={payee.id} payee={payee} />
        ))}
        {visiblePayees.length === 0 && (
          <p className={styles.noPayees}>
            {payees.length === 0
              ? 'No saved payees yet.'
              : 'No payees match your search.'}
          </p>
        )}
        <label className={styles.option}>
          <input
            type="radio"
            value={NEW_RECIPIENT}
            {...register('payeeId')}
          />
          <span className={styles.optionName}>Send to someone new</span>
        </label>
      </div>
      <FieldError id={ERROR_ID} message={error} />

      {payeeId === NEW_RECIPIENT && <NewRecipientFields />}
    </>
  )
}
