import styles from './components.module.css'

interface SkeletonProps {
  width?: string
  height: string
}

export function Skeleton({ width = '100%', height }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={styles.skeleton}
      style={{ width, height }}
    />
  )
}
