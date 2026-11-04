import type { Ref } from 'react'
import styles from './transactions.module.css'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  ref: Ref<HTMLInputElement>
}

export function SearchInput({ value, onChange, ref }: SearchInputProps) {
  return (
    <input
      aria-label="Search transactions"
      className={styles.search}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search transactions"
      ref={ref}
      type="search"
      value={value}
    />
  )
}
