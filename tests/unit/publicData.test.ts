import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ find: vi.fn(), findGlobal: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: async () => mocks }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
import { getSerenityData, getSiteNavigation } from '../../src/serenity/data'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('DATABASE_URL', 'postgres://localhost/serenity_test')
  vi.stubEnv('DEMO_MODE', 'false')
  mocks.findGlobal.mockResolvedValue({ hours: '', navItems: [], secondaryNavItems: [] })
})

it('keeps a successfully empty collection empty and only loads requested content', async () => {
  mocks.find.mockResolvedValue({ docs: [] })
  const data = await getSerenityData(['galleryItems'])
  expect(data.galleryItems).toEqual([])
  expect(data.settings.hours).toBe('')
  expect(mocks.find).toHaveBeenCalledOnce()
})
it('fails regeneration on database errors instead of caching demo content', async () => {
  mocks.find.mockRejectedValue(new Error('database unavailable'))
  await expect(getSerenityData(['galleryItems'])).rejects.toThrow('database unavailable')
})
it('retains numeric IDs and does not silently truncate at 100', async () => {
  mocks.find.mockResolvedValue({ docs: [{ id: 45, title: 'Gallery photo', order: 100 }] })
  const data = await getSerenityData(['galleryItems'])
  expect(data.galleryItems[0].id).toBe('45')
  expect(mocks.find).toHaveBeenCalledWith(
    expect.objectContaining({ limit: 0, sort: ['order', 'id'], overrideAccess: false }),
  )
})
it('honors intentional empty navigation', async () => {
  expect(await getSiteNavigation()).toEqual({
    primaryNavItems: [],
    secondaryNavItems: [],
    footerNavItems: [],
  })
})

it('retains earlier meeting format descriptions for public fallback labels', async () => {
  mocks.find.mockResolvedValue({
    docs: [{ id: 4, name: 'TGIF', format: 'Open discussion and book study' }],
  })
  const data = await getSerenityData(['meetings'])
  expect(data.meetings[0].format).toBe('Open discussion and book study')
})
