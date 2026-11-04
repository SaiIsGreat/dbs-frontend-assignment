import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { CustomerResponse } from '../types'

export function useCustomer() {
  return useQuery({
    queryKey: ['customer'],
    queryFn: () => apiFetch<CustomerResponse>('/api/customer'),
    select: (data) => data.customer,
  })
}
