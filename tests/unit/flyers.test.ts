import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('../../src/serenity/data', () => ({ getPayloadClient: async () => mocks }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

import { getMonthlyFlyers } from '../../src/serenity/flyers'
import type { EventItem } from '../../src/serenity/content'

const september = { id: 1, month: '2026-09' }
const october = { id: 2, month: '2026-10' }

const event = (date: string, extra: Partial<EventItem> = {}): EventItem => ({
  title: 'Club event',
  category: 'Community',
  summary: '',
  dateLabel: '',
  order: 100,
  date,
  endDate: date,
  ...extra,
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.find.mockResolvedValue({ docs: [october, september] })
})

it('shows October after all September events finish, even with October events upcoming', async () => {
  expect(await getMonthlyFlyers([event('2026-09-20'), event('2026-10-04')], '2026-09-28')).toEqual({
    current: october,
    archive: [september],
  })
  expect(mocks.find).toHaveBeenCalledWith(
    expect.objectContaining({ overrideAccess: false, draft: false, sort: '-month' }),
  )
  expect(mocks.find.mock.calls[0][0].where).toEqual({ month: { less_than_equal: '2026-10' } })
})

it('keeps the same published flyer visible when its month begins', async () => {
  expect(await getMonthlyFlyers([event('2026-10-04')], '2026-10-01')).toEqual({
    current: october,
    archive: [september],
  })
})

it.each(['2026-09-28', '2026-09-30'])(
  'keeps September while an event remains on %s and hides the upcoming flyer from the archive',
  async (date) => {
    expect(await getMonthlyFlyers([event(date)], '2026-09-28')).toEqual({
      current: september,
      archive: [],
    })
  },
)

it('counts an ongoing event that started earlier and extends into next month', async () => {
  expect(
    (await getMonthlyFlyers([event('2026-08-31', { endDate: '2026-10-02' })], '2026-09-28')).current,
  ).toEqual(september)
})

it('counts a recurring meeting occurrence among the remaining events', async () => {
  expect(
    (await getMonthlyFlyers([event('2026-09-30', { category: 'Meeting' })], '2026-09-28')).current,
  ).toEqual(september)
})

it('does not let archived or hidden events delay the next flyer', async () => {
  const events = [
    event('2026-09-30', { archived: true }),
    event('2026-09-30', { visible: false }),
  ]
  expect((await getMonthlyFlyers(events, '2026-09-28')).current).toEqual(october)
})

it('keeps September when no October flyer has been published', async () => {
  mocks.find.mockResolvedValue({ docs: [september] })
  expect((await getMonthlyFlyers([], '2026-09-28')).current).toEqual(september)
})

it('does not jump past next month to a later published flyer', async () => {
  mocks.find.mockResolvedValue({ docs: [{ id: 3, month: '2026-11' }, september] })
  expect(await getMonthlyFlyers([], '2026-09-28')).toEqual({ current: september, archive: [] })
})

it('advances correctly from December to January', async () => {
  const january = { id: 5, month: '2027-01' }
  const december = { id: 4, month: '2026-12' }
  mocks.find.mockResolvedValue({ docs: [january, december] })
  expect(await getMonthlyFlyers([], '2026-12-28')).toEqual({
    current: january,
    archive: [december],
  })
})

it('keeps expired flyers in the archive when no current or future flyer is published', async () => {
  mocks.find.mockResolvedValue({ docs: [september] })

  expect(await getMonthlyFlyers([], '2026-10-01')).toEqual({ current: null, archive: [september] })
})

it('handles an empty published flyer collection', async () => {
  mocks.find.mockResolvedValue({ docs: [] })

  expect(await getMonthlyFlyers([], '2026-09-28')).toEqual({ current: null, archive: [] })
})
