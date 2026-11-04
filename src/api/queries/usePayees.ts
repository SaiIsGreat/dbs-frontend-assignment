import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { PayeesResponse } from '../types'

export function usePayees() {
  return useQuery({
    queryKey: ['payees'],
    queryFn: () => apiFetch<PayeesResponse>('/api/payees'),
    select: (data) => data.payees,
  })
}
