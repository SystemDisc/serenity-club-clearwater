import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/fundraiser-progress/route'
import { fundraiserCampaignId, parseFundraiserProgress } from '@/utilities/fundraiserProgress'

const campaign = {
  id: fundraiserCampaignId,
  object: 'campaign',
  goal_amount: 10_000_000,
  target: 10_000_000,
  volume: 50_000,
  currency: 'usd',
  is_archived: false,
  deleted_at: null,
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('fundraiser progress', () => {
  it('converts cents to dollars and exposes only aggregate fields', () => {
    const progress = parseFundraiserProgress({
      ...campaign,
      contact: { email: 'private@example.test' },
    })
    expect(progress).toMatchObject({ raised: 500, goal: 100000, currency: 'USD' })
    expect(Object.keys(progress).sort()).toEqual(['checkedAt', 'currency', 'goal', 'raised'])
  })

  it('accepts zero and over-goal totals', () => {
    expect(parseFundraiserProgress({ ...campaign, volume: 0 }).raised).toBe(0)
    expect(parseFundraiserProgress({ ...campaign, volume: 11_000_000 }).raised).toBe(110000)
  })

  it.each([
    { volume: undefined },
    { volume: null },
    { volume: '50000' },
    { volume: -1 },
    { goal_amount: 0 },
    { currency: 'cad' },
    { id: 'wrong-campaign' },
    { is_archived: true },
  ])('rejects invalid campaign data: %j', (change) => {
    expect(() => parseFundraiserProgress({ ...campaign, ...change })).toThrow()
  })

  it('never fetches without a configured server key', async () => {
    vi.stubEnv('ZEFFY_API_KEY', '')
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    const result = await GET()
    expect(result.status).toBe(503)
    expect(request).not.toHaveBeenCalled()
  })

  it('fetches only the fixed campaign and keeps the key out of the public response', async () => {
    vi.stubEnv('ZEFFY_API_KEY', 'test-key-not-a-real-credential')
    const request = vi.fn().mockResolvedValue(Response.json(campaign))
    vi.stubGlobal('fetch', request)
    const result = await GET()
    const body = await result.text()
    expect(result.status).toBe(200)
    expect(request.mock.calls[0][0]).toBe(
      `https://api.zeffy.com/api/v1/campaigns/${fundraiserCampaignId}`,
    )
    expect(request.mock.calls[0][1].headers.Authorization).toBe(
      'Bearer test-key-not-a-real-credential',
    )
    expect(JSON.parse(body).progress.raised).toBe(500)
    expect(body).not.toContain('test-key-not-a-real-credential')
  })

  it('fails safely without caching upstream errors or returning fabricated totals', async () => {
    vi.stubEnv('ZEFFY_API_KEY', 'test-key-not-a-real-credential')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('private upstream details', { status: 401 })),
    )
    const result = await GET()
    expect(result.status).toBe(503)
    expect(result.headers.get('Cache-Control')).toBe('no-store')
    expect(result.headers.has('Vercel-CDN-Cache-Control')).toBe(false)
    expect(await result.json()).toMatchObject({ mode: 'unavailable', progress: null })
  })
})
