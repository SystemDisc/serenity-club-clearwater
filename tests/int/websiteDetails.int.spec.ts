import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { ClubSetting, Header, User } from '@/payload-types'
import { beforeAll, afterAll, it, expect } from 'vitest'
let payload: Payload, editor: User, admin: User, original: ClubSetting, header: Header
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
  original = await payload.findGlobal({ slug: 'clubSettings', depth: 0 })
  header = await payload.findGlobal({ slug: 'header', depth: 0 })
  editor = await payload.create({
    collection: 'users',
    data: {
      email: `details-editor-${Date.now()}@example.invalid`,
      password: 'test-settings',
      role: 'editor',
    },
    context,
  })
  expect(editor.role).toBe('editor')
  admin = await payload.create({
    collection: 'users',
    data: {
      email: `details-admin-${Date.now()}@example.invalid`,
      password: 'test-settings',
      role: 'admin',
    },
    context,
  })
})
afterAll(async () => {
  await payload.updateGlobal({ slug: 'clubSettings', data: original, context })
  await payload.updateGlobal({ slug: 'header', data: header, context })
  await payload.delete({ collection: 'users', id: editor.id, context })
  await payload.delete({ collection: 'users', id: admin.id, context })
  await payload.destroy()
})
it('allows ordinary wording updates, protects payment/menu settings, and restores saved versions', async () => {
  await expect(
    payload.updateGlobal({
      slug: 'clubSettings',
      overrideAccess: false,
      data: { hours: 'Unauthorized' },
      context,
    }),
  ).rejects.toThrow()
  const baseline = await payload.updateGlobal({ slug: 'clubSettings', data: original, context })
  const versions = await payload.findGlobalVersions({
    slug: 'clubSettings',
    limit: 1,
    sort: '-createdAt',
  })
  const changed = await payload.updateGlobal({
    slug: 'clubSettings',
    user: editor,
    overrideAccess: false,
    data: {
      hours: 'Fixture hours',
      sponsorshipInformation: 'Fixture terms',
      donationUrl: 'https://example.invalid/changed',
    },
    context,
  })
  expect(changed.hours).toBe('Fixture hours')
  expect(changed.donationUrl).toBe(original.donationUrl)
  await expect(
    payload.updateGlobal({
      slug: 'header',
      user: editor,
      overrideAccess: false,
      data: { navItems: [] },
      context,
    }),
  ).rejects.toThrow()
  await expect(
    payload.findGlobalVersions({ slug: 'clubSettings', overrideAccess: false }),
  ).rejects.toThrow()
  await expect(
    payload.restoreGlobalVersion({
      slug: 'clubSettings',
      id: versions.docs[0].id,
      user: editor,
      overrideAccess: false,
      context,
    }),
  ).rejects.toThrow('website manager')
  expect(versions.docs[0].version.hours).toBe(baseline.hours)
  await payload.restoreGlobalVersion({
    slug: 'clubSettings',
    id: versions.docs[0].id,
    user: admin,
    overrideAccess: false,
    context,
  })
  const restored = await payload.findGlobal({ slug: 'clubSettings', depth: 0 })
  expect(restored.hours).toBe(baseline.hours)
  expect(restored.sponsorshipInformation).toBe(baseline.sponsorshipInformation)
  await expect(
    payload.updateGlobal({
      slug: 'clubSettings',
      user: admin,
      overrideAccess: false,
      data: { donationUrl: 'javascript:alert(1)' },
      context,
    }),
  ).rejects.toThrow()
})
