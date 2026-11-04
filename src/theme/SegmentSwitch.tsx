import { useEffect, useState } from 'react'
import type { Segment } from '../api/types'
import { readStored, SEGMENT_KEY, writeStored } from './preferences'
import styles from './theme.module.css'

const OPTIONS: { value: Segment; label: string }[] = [
  { value: 'retail', label: 'Retail' },
  { value: 'premium', label: 'Premium' },
]

function readSavedSegment(): Segment | null {
  const saved = readStored(SEGMENT_KEY)
  return saved === 'retail' || saved === 'premium' ? saved : null
}

interface SegmentSwitchProps {
  /** The customer's default, used until they choose for themselves. */
  defaultSegment?: Segment
}

export function SegmentSwitch({ defaultSegment }: SegmentSwitchProps) {
  const [saved, setSaved] = useState(readSavedSegment)
  const segment = saved ?? defaultSegment ?? 'retail'

  useEffect(() => {
    document.documentElement.dataset.segment = segment
  }, [segment])

  function choose(value: Segment) {
    writeStored(SEGMENT_KEY, value)
    setSaved(value)
  }

  return (
    <div aria-label="Customer segment" className={styles.segments} role="group">
      {OPTIONS.map(({ value, label }) => (
        <button
          aria-pressed={segment === value}
          className={styles.segment}
          key={value}
          onClick={() => choose(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
