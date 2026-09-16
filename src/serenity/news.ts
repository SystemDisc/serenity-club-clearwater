import { unstable_cache } from 'next/cache'
import { getPayloadClient } from './data'

export const newsPageSize = 12
/** Deliberately propagate read failures so ISR retains its last successful public result. */
export const getNewsPage = unstable_cache(
  async (page: number) => {
    const payload = await getPayloadClient()
    if (!payload) return { docs: [], totalDocs: 0, totalPages: 1 }
    return payload.find({
      collection: 'posts',
      draft: false,
      overrideAccess: false,
      depth: 1,
      page,
      limit: newsPageSize,
      sort: ['-publishedAt', '-id'],
      select: {
        title: true,
        slug: true,
        excerpt: true,
        heroImage: true,
        publishedAt: true,
        meta: true,
      },
    })
  },
  ['public-news-page'],
  { revalidate: 300, tags: ['public-posts', 'public-media'] },
)

export function richTextSummary(value: unknown): string {
  const parts: string[] = []
  function visit(node: unknown) {
    if (!node || typeof node !== 'object' || parts.join(' ').length > 220) return
    const data = node as { text?: unknown; children?: unknown; root?: unknown }
    if (typeof data.text === 'string') parts.push(data.text)
    if (Array.isArray(data.children)) data.children.forEach(visit)
    if (data.root) visit(data.root)
  }
  visit(value)
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 180)
}
