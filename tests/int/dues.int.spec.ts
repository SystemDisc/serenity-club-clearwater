import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { DuesReminder } from '@/payload-types'
import { beforeAll, afterAll, it, expect } from 'vitest'
let payload: Payload
let original: DuesReminder
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
  original = await payload.findGlobal({ slug: 'duesReminder', depth: 0 })
})
afterAll(async () => {
  await payload.updateGlobal({ slug: 'duesReminder', data: original, context })
  await payload.destroy()
})
it('protects unpublished wording and rejects mismatched monthly artwork', async () => {
  await payload.updateGlobal({
    slug: 'duesReminder',
    data: {
      mode: 'automatic',
      message: 'Published reminder',
      artworkKind: 'none',
      _status: 'published',
    },
    context,
  })
  await payload.updateGlobal({
    slug: 'duesReminder',
    draft: true,
    data: { message: 'PRIVATE draft wording', _status: 'draft' },
    context,
  })
  for (const draft of [false, true]) {
    const publicDoc = await payload.findGlobal({
      slug: 'duesReminder',
      draft,
      overrideAccess: false,
    })
    expect(publicDoc.message).toBe('Published reminder')
  }
  await expect(
    payload.updateGlobal({
      slug: 'duesReminder',
      data: {
        mode: 'chosen',
        month: '2026-10',
        artworkKind: 'monthly',
        artworkMonth: '2026-09',
        _status: 'published',
      },
      context,
    }),
  ).rejects.toThrow('artworkMonth')
  await expect(
    payload.updateGlobal({
      slug: 'duesReminder',
      overrideAccess: false,
      data: { message: 'Unauthorized' },
      context,
    }),
  ).rejects.toThrow()
  await expect(
    payload.findGlobalVersions({ slug: 'duesReminder', overrideAccess: false }),
  ).rejects.toThrow()
})
