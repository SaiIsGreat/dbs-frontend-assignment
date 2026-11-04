import styles from './transfer.module.css'

interface FieldErrorProps {
  id: string
  message?: string
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null

  return (
    <p className={styles.fieldError} id={id}>
      {message}
    </p>
  )
}
