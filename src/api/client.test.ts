import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '../test/setup'
import { apiFetch } from './client'
import type { AccountsResponse } from './types'

afterEach(() => {
  window.history.pushState({}, '', '/')
})

describe('demo params', () => {
  it('leaves requests alone when the page URL has no demo params', async () => {
    const { accounts } = await apiFetch<AccountsResponse>('/api/accounts')

    expect(accounts).toHaveLength(3)
  })

  it('forwards scenario from the page URL to GET requests', async () => {
    window.history.pushState({}, '', '/?scenario=empty')

    const { accounts } = await apiFetch<AccountsResponse>('/api/accounts')

    expect(accounts).toEqual([])
  })

  it('keeps query params the request already has', async () => {
    window.history.pushState({}, '', '/?scenario=empty')
    let params = new URLSearchParams()
    server.use(
      http.get('*/api/transactions', ({ request }) => {
        params = new URL(request.url).searchParams
        return HttpResponse.json({ transactions: [], total: 0 })
      }),
    )

    await apiFetch('/api/transactions?limit=8')

    expect(params.get('limit')).toBe('8')
    expect(params.get('scenario')).toBe('empty')
  })

  it('forwards delay to POST requests', async () => {
    window.history.pushState({}, '', '/?delay=1500')
    let params = new URLSearchParams()
    server.use(
      http.post('*/api/transfers', ({ request }) => {
        params = new URL(request.url).searchParams
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    await apiFetch('/api/transfers', { method: 'POST', body: '{}' })

    expect(params.get('delay')).toBe('1500')
  })
})
