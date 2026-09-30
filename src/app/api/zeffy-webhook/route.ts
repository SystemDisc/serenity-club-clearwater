import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { fundraiserCampaignId } from '@/utilities/fundraiserProgress'

export const runtime = 'nodejs'
const maxBodyBytes = 64 * 1024

export async function POST(request: Request) {
  const secret = process.env.ZEFFY_WEBHOOK_SECRET
  if (!secret) return new Response(null, { status: 503 })
  const signature = request.headers.get('Zeffy-Signature') ?? ''
  const timestamp = signature.match(/(?:^|,)\s*t=(\d+)(?:,|$)/)?.[1]
  const digest = signature.match(/(?:^|,)\s*v1=([a-fA-F0-9]{64})(?:,|$)/)?.[1]
  if (!timestamp || !digest || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return new Response(null, { status: 401 })
  }
  if (Number(request.headers.get('Content-Length')) > maxBodyBytes) {
    return new Response(null, { status: 413 })
  }
  // Bound the body before allocation, and verify its original bytes before parsing.
  const reader = request.body?.getReader()
  if (!reader) return new Response(null, { status: 400 })
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBodyBytes) {
        await reader.cancel()
        return new Response(null, { status: 413 })
      }
      chunks.push(value)
    }
  } catch {
    return new Response(null, { status: 400 })
  }
  const body = Buffer.concat(chunks, length)
  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest()
  if (!timingSafeEqual(expected, Buffer.from(digest, 'hex'))) {
    return new Response(null, { status: 401 })
  }
  let event: unknown
  try {
    event = JSON.parse(body.toString('utf8'))
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!event || typeof event !== 'object') return new Response(null, { status: 400 })
  const { type, data, version, id } = event as Record<string, unknown>
  if (typeof id !== 'string' || version !== 1 || typeof type !== 'string') {
    return new Response(null, { status: 400 })
  }
  // Do not persist/log donor data or add payment amounts. Invalidating a cache
  // is safe to repeat when Zeffy retries the same event, even across instances.
  if (type === 'payment.completed') {
    if (!data || typeof data !== 'object') return new Response(null, { status: 400 })
    const payment = data as Record<string, unknown>
    if (payment.campaign_id === fundraiserCampaignId && payment.status === 'succeeded') {
      revalidateTag('fundraiser-progress', { expire: 0 })
    }
  }
  return new Response(null, { status: 204 })
}
