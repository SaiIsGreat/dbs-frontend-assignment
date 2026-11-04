import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { AccountsResponse } from '../types'

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiFetch<AccountsResponse>('/api/accounts'),
    select: (data) => data.accounts,
  })
}
