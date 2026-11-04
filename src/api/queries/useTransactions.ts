import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { TransactionsResponse } from '../types'

interface TransactionsParams {
  limit: number
  q?: string
}

export function useTransactions({ limit, q = '' }: TransactionsParams) {
  return useQuery({
    queryKey: ['transactions', { limit, q }],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (q) params.set('q', q)
      return apiFetch<TransactionsResponse>(`/api/transactions?${params}`)
    },
    // Keeps the current rows on screen while a new search loads.
    placeholderData: keepPreviousData,
  })
}
