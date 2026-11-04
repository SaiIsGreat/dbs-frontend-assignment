import { useState } from 'react'
import { THEME_KEY, writeStored } from './preferences'
import styles from './theme.module.css'

export function ThemeToggle() {
  // The inline script in index.html has already set this attribute.
  const [isDark, setIsDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )

  function toggle() {
    const theme = isDark ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    writeStored(THEME_KEY, theme)
    setIsDark(!isDark)
  }

  return (
    <button
      aria-label="Dark mode"
      aria-pressed={isDark}
      className={styles.themeToggle}
      onClick={toggle}
      type="button"
    >
      <svg aria-hidden="true" height="20" viewBox="0 0 20 20" width="20">
        <circle
          cx="10"
          cy="10"
          fill="none"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M10 2a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
    </button>
  )
}
