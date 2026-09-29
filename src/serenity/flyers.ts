import { unstable_cache } from 'next/cache'
import { getPayloadClient } from './data'
import { localDateKey } from './calendar'
import type { EventItem } from './content'

export { displayMonth } from './calendar'

export async function getMonthlyFlyers(events: EventItem[], today = localDateKey()) {
  const month = today.slice(0, 7)
  const nextMonthDate = new Date(`${month}-01T12:00:00Z`)
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1)
  const nextMonth = nextMonthDate.toISOString().slice(0, 7)
  const flyers = await unstable_cache(
    async (through: string) => {
      const payload = await getPayloadClient()
      if (!payload) return []
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
      return result.docs
    },
    ['monthly-flyers'],
    { revalidate: 3600, tags: ['public-monthlyFlyers', 'public-media'] },
  )(nextMonth)

  // Use the same published events and recurrence dates as the public listings.
  // Today's events and multi-day events count until their last local day ends.
  const hasRemainingEvents = events.some(
    (event) =>
      !event.archived &&
      event.visible !== false &&
      event.date &&
      event.date < `${nextMonth}-01` &&
      (event.endDate || event.date) >= today,
  )
  const upcomingFlyer = flyers.find((flyer) => flyer.month === nextMonth)
  const displayedMonth = !hasRemainingEvents && upcomingFlyer ? nextMonth : month

  return {
    current: flyers.find((flyer) => flyer.month === displayedMonth) || null,
    archive: flyers.filter((flyer) => flyer.month < displayedMonth),
  }
}
