import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetch } from './client'
import type { CreateTransferRequest, TransferResponse } from './types'

export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateTransferRequest) =>
      apiFetch<TransferResponse>('/api/transfers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      }),

    // Returning the promise keeps the mutation pending until the refresh ends,
    // so the balance is already correct when the success screen appears. A
    // failed refresh doesn't reject it, so a sent transfer always shows success.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ]),

    // The API rejecting a value means this app's numbers are out of date, so
    // fetch fresh ones. Otherwise Back and Continue would pass the same old check.
    onError: (error) => {
      if (!(error instanceof ApiError) || !error.fields) return undefined
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      ])
    },
  })
}
