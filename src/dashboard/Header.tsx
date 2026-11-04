import type { Customer } from '../api/types'
import { SegmentSwitch } from '../theme/SegmentSwitch'
import { ThemeToggle } from '../theme/ThemeToggle'
import styles from './dashboard.module.css'

// Decoration only: the brief puts these pages out of scope.
const DISABLED_NAV_ITEMS = ['Cards', 'Payments', 'Insights']

interface HeaderProps {
  /** Missing while the customer loads, or if that request failed. */
  customer?: Customer
}

export function Header({ customer }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.logo}>
          <span aria-hidden="true" className={styles.logoMark}>
            M
          </span>
          Meridian
        </div>

        <nav aria-label="Main" className={styles.nav}>
          <span aria-current="page" className={styles.navCurrent}>
            Overview
          </span>
          {DISABLED_NAV_ITEMS.map((item) => (
            <button
              className={styles.navItem}
              disabled
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className={styles.segmentSlot}>
          <SegmentSwitch defaultSegment={customer?.segment} />
        </div>
        <ThemeToggle />
        {customer ? (
          <div
            aria-label={`${customer.firstName} ${customer.lastName}`}
            className={styles.avatar}
            role="img"
          >
            {customer.firstName[0]}
            {customer.lastName[0]}
          </div>
        ) : (
          <div aria-hidden="true" className={styles.avatar} />
        )}
      </div>
    </header>
  )
}
