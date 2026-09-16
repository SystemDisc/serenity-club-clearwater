import type { DuesReminder } from '@/payload-types'
import { localDateKey, validDateKey } from './calendar'

export const validMonth = (value: unknown): value is string =>
  typeof value === 'string' && validDateKey(`${value}-01`)

export const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00Z`),
  )

export function duesView(notice: Partial<DuesReminder> | null | undefined, today = localDateKey()) {
  const mode = notice?.mode || 'legacy'
  const month = mode === 'chosen' ? notice?.month : today.slice(0, 7)
  const usableMonth = validMonth(month) ? month : null
  const image = typeof notice?.artwork === 'object' ? notice.artwork : null
  const expiredArt = notice?.artworkKind === 'monthly' && notice.artworkMonth !== month
  return {
    mode,
    month: usableMonth,
    heading: usableMonth
      ? `It’s time to pay your ${monthLabel(usableMonth)} membership dues`
      : 'Choose a month for the dues reminder',
    message: notice?.message || '',
    link: notice?.showMembershipLink ? '/shop' : null,
    image: notice?.artworkKind !== 'none' && !expiredArt ? image?.url : undefined,
    imageAlt:
      notice?.artworkKind === 'monthly' && usableMonth
        ? `${monthLabel(usableMonth)} membership dues reminder`
        : '',
    expiredArt,
  }
}
