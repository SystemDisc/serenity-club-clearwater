import { unstable_cache } from 'next/cache'
import { getPayloadClient } from './data'
import { localDateKey } from './calendar'

export function displayMonth(month: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T12:00:00Z`))
}

export const getMonthlyFlyers = (month = localDateKey().slice(0, 7)) =>
  unstable_cache(
    async (through: string) => {
      const payload = await getPayloadClient()
      if (!payload) return { current: null, archive: [] }
      const result = await payload.find({
        collection: 'monthlyFlyers',
        overrideAccess: false,
        draft: false,
        depth: 1,
        limit: 24,
        sort: '-month',
        where: { month: { less_than_equal: through } },
        populate: { media: { url: true, alt: true, filename: true } },
      })
      return {
        current: result.docs.find((doc) => doc.month === through) || null,
        archive: result.docs.filter((doc) => doc.month !== through),
      }
    },
    ['monthly-flyers'],
    { revalidate: 300, tags: ['public-monthlyFlyers', 'public-media'] },
  )(month)
