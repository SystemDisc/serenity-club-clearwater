import { invalidatePublicChanges, publicCollections } from '@/utilities/publicCache'

export async function POST(request: Request): Promise<Response> {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 })
  }
  const body = await request.json().catch(() => null)
  if (
    !Array.isArray(body?.collections) ||
    !body.collections.length ||
    body.collections.some(
      (name: unknown) => !publicCollections.includes(name as (typeof publicCollections)[number]),
    )
  ) {
    return new Response('Supply known public collection names', { status: 400 })
  }
  invalidatePublicChanges(body.collections.map((collection: string) => ({ collection })))
  return Response.json({ revalidated: true })
}
