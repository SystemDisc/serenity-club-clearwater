import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { revalidateTag } from 'next/cache'
import { POST } from '@/app/api/zeffy-webhook/route'
import { fundraiserCampaignId } from '@/utilities/fundraiserProgress'
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))
const secret = 'whsec_test_only'
const event = { id: 'test-event', version: 1, type: 'payment.completed', data: {
  campaign_id: fundraiserCampaignId, status: 'succeeded', buyer: { email: 'private@example.test' },
} }
function request(value: unknown = event, age = 0, wrongSecret = secret) {
  const body = JSON.stringify(value)
  const t = Math.floor(Date.now() / 1000) - age
  const hash = createHmac('sha256', wrongSecret).update(`${t}.${body}`).digest('hex')
  return new Request('https://example.test/api/zeffy-webhook', { method: 'POST', body,
    headers: { 'Zeffy-Signature': `t=${t},v1=${hash}` },
  })
}
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
describe('Zeffy receiver', () => {
  it('expires only the campaign aggregate cache and repeats safely on delivery retries', async () => {
    vi.stubEnv('ZEFFY_WEBHOOK_SECRET', secret)
    for (let i = 0; i < 2; i++) {
      const response = await POST(request())
      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')
    }
    expect(revalidateTag).toHaveBeenCalledWith('fundraiser-progress', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledTimes(2)
  })
  it.each([301, -301])('rejects stale or future signatures (%s)', async (age) => {
    vi.stubEnv('ZEFFY_WEBHOOK_SECRET', secret)
    expect((await POST(request(event, age))).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
  it('rejects tampered signatures', async () => {
    vi.stubEnv('ZEFFY_WEBHOOK_SECRET', secret)
    expect((await POST(request(event, 0, 'wrong'))).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
  it('rejects unconfigured delivery without processing private payloads', async () => {
    vi.stubEnv('ZEFFY_WEBHOOK_SECRET', '')
    expect((await POST(request())).status).toBe(503)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
  it.each([
    { ...event, type: 'contact.created' },
    { ...event, data: { ...event.data, campaign_id: 'other' } },
    { ...event, data: { ...event.data, status: 'pending' } },
  ])('ignores unrelated or unsuccessful payments', async (value) => {
    vi.stubEnv('ZEFFY_WEBHOOK_SECRET', secret)
    expect((await POST(request(value))).status).toBe(204)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
  it('rejects oversized bodies before parsing', async () => {
    vi.stubEnv('ZEFFY_WEBHOOK_SECRET', secret)
    const response = await POST(request({ ...event, extra: 'x'.repeat(65536) }))
    expect(response.status).toBe(413)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
