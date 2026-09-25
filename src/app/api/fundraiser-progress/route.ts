import {
  fundraiserCampaignId,
  fundraiserCampaignTitle,
  fundraiserCampaignUrl,
  parseFundraiserProgress,
} from '@/utilities/fundraiserProgress'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.ZEFFY_API_KEY
  const base = {
    title: fundraiserCampaignTitle,
    campaignUrl: fundraiserCampaignUrl,
    refreshSeconds: 60,
  }

  if (!key) {
    return Response.json(
      { ...base, mode: 'unavailable', progress: null },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const response = await fetch(`https://api.zeffy.com/api/v1/campaigns/${fundraiserCampaignId}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error('Upstream unavailable')
    const progress = parseFundraiserProgress(await response.json())

    return Response.json(
      { ...base, mode: 'live', progress },
      {
        headers: {
          'Cache-Control': 'no-store',
          // Share only aggregate totals at Vercel's edge. Browsers still refresh.
          'Vercel-CDN-Cache-Control': 'max-age=30',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch {
    // Never expose Zeffy's error body, account data, or the server-side key.
    return Response.json(
      { ...base, mode: 'unavailable', progress: null },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
