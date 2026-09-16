import { expect, it } from 'vitest'
import { duesView } from '../../src/serenity/dues'
import { localDateKey } from '../../src/serenity/calendar'

it('rolls over in Clearwater without a saved month and crosses the year boundary', () => {
  const notice = { mode: 'automatic' as const, artworkKind: 'none' as const }
  expect(duesView(notice, localDateKey(new Date('2026-10-01T03:59:59Z'))).heading).toContain(
    'September 2026',
  )
  expect(duesView(notice, localDateKey(new Date('2026-10-01T04:00:00Z'))).heading).toContain(
    'October 2026',
  )
  expect(duesView(notice, localDateKey(new Date('2027-01-01T05:00:00Z'))).heading).toContain(
    'January 2027',
  )
})

it('never puts next month above artwork lettered for the previous month', () => {
  const art = { id: 1, url: '/poster.png', updatedAt: '', createdAt: '' }
  const notice = {
    mode: 'automatic' as const,
    artworkKind: 'monthly' as const,
    artworkMonth: '2026-09',
    artwork: art,
  }
  expect(duesView(notice, '2026-09-30').image).toBe('/poster.png')
  expect(duesView(notice, '2026-10-01').image).toBeUndefined()
  expect(duesView({ ...notice, mode: 'chosen', month: '2026-09' }, '2026-10-01').image).toBe(
    '/poster.png',
  )
  expect(duesView({ ...notice, artworkKind: 'decoration' }, '2026-10-01').image).toBe('/poster.png')
})

it('preserves the legacy option and explicitly supports turning the notice off', () => {
  expect(duesView(null).mode).toBe('legacy')
  expect(duesView({ mode: 'off' }).mode).toBe('off')
  expect(duesView({ mode: 'chosen', month: '2026-99' }).month).toBeNull()
})
