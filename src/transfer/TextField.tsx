import type { ComponentProps, ReactNode } from 'react'
import { useFormContext, type FieldPath } from 'react-hook-form'
import { FieldError } from './FieldError'
import type { TransferFormValues } from './transferSchema'
import styles from './transfer.module.css'

interface TextFieldProps extends ComponentProps<'input'> {
  name: FieldPath<TransferFormValues>
  label: string
  /** Shown at the end of the label row, such as a character counter. */
  labelAside?: ReactNode
}

export function TextField({
  name,
  label,
  labelAside,
  ...inputProps
}: TextFieldProps) {
  const { register, formState, getFieldState } =
    useFormContext<TransferFormValues>()
  const message = getFieldState(name, formState).error?.message
  const id = `field-${name}`
  const errorId = `${id}-error`

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {labelAside}
      </div>
      <input
        aria-describedby={message ? errorId : undefined}
        aria-invalid={message ? true : undefined}
        className={styles.input}
        id={id}
        {...inputProps}
        {...register(name)}
      />
      <FieldError id={errorId} message={message} />
    </div>
  )
}
