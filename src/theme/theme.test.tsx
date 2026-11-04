import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { SegmentSwitch } from './SegmentSwitch'
import { ThemeToggle } from './ThemeToggle'
import { SEGMENT_KEY, THEME_KEY } from './preferences'

const root = document.documentElement

beforeEach(() => {
  localStorage.clear()
  root.dataset.theme = 'light'
  root.dataset.segment = 'retail'
})

describe('ThemeToggle', () => {
  it('switches the theme and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    const toggle = screen.getByRole('button', { name: 'Dark mode' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(root.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggle)

    expect(root.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })

  it('starts from the theme already set on the page', () => {
    root.dataset.theme = 'dark'

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('SegmentSwitch', () => {
  it("follows the customer's default until a choice is made", () => {
    render(<SegmentSwitch defaultSegment="premium" />)

    expect(root.dataset.segment).toBe('premium')
    expect(screen.getByRole('button', { name: 'Premium' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('applies and remembers a choice', async () => {
    const user = userEvent.setup()
    render(<SegmentSwitch defaultSegment="retail" />)

    await user.click(screen.getByRole('button', { name: 'Premium' }))

    expect(root.dataset.segment).toBe('premium')
    expect(localStorage.getItem(SEGMENT_KEY)).toBe('premium')
  })

  it("prefers a saved choice over the customer's default", () => {
    localStorage.setItem(SEGMENT_KEY, 'retail')

    render(<SegmentSwitch defaultSegment="premium" />)

    expect(root.dataset.segment).toBe('retail')
  })

  it('ignores an invalid saved value', () => {
    localStorage.setItem(SEGMENT_KEY, 'platinum')

    render(<SegmentSwitch defaultSegment="premium" />)

    expect(root.dataset.segment).toBe('premium')
  })
})
