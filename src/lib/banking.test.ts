import { describe, expect, it } from 'vitest'
import type { Customer } from '../api/types'
import { getRemainingDailyLimit } from './banking'

const customer = (dailyTransferLimit: number, transferredToday: number) =>
  ({ dailyTransferLimit, transferredToday }) as Customer

describe('getRemainingDailyLimit', () => {
  it('subtracts what has been used', () => {
    expect(getRemainingDailyLimit(customer(5000, 120))).toBe(4880)
  })

  it('removes decimal rounding errors', () => {
    // 5000 - 4999.7 is 0.3000000000001819 in JavaScript.
    expect(getRemainingDailyLimit(customer(5000, 4999.7))).toBe(0.3)
  })
})
