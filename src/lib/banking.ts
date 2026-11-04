import type { Account, Customer } from '../api/types'

/** Accounts holding the customer's own money, which excludes credit cards. */
export function getDepositAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => account.type !== 'credit')
}

export function getRemainingDailyLimit(customer: Customer): number {
  const remaining = customer.dailyTransferLimit - customer.transferredToday
  // Subtracting decimals can leave values like 4879.649999999999.
  return Math.round(remaining * 100) / 100
}
