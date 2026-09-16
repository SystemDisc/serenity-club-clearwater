import '../tests/helpers/environment'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  fallbackPrimaryNavItems,
  fallbackSecondaryNavItems,
  fallbackClubSettings,
} from '../src/serenity/content'
const payload = await getPayload({ config })
const links = (items: typeof fallbackPrimaryNavItems) =>
  items.map(({ href, label }) => ({ link: { type: 'custom' as const, label, url: href } }))
try {
  // Keep the first-account bootstrap separate from disposable editor fixtures.
  // Permission tests run concurrently and may otherwise become the first user.
  const bootstrapEmail = 'test-bootstrap-admin@example.test'
  const bootstrap = await payload.find({
    collection: 'users',
    where: { email: { equals: bootstrapEmail } },
    limit: 1,
  })
  if (!bootstrap.docs.length) {
    await payload.create({
      collection: 'users',
      data: { email: bootstrapEmail, password: crypto.randomUUID(), role: 'admin' },
      context: { disableRevalidate: true },
    })
  }
  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: links(fallbackPrimaryNavItems),
      secondaryNavItems: links(fallbackSecondaryNavItems),
    },
    context: { disableRevalidate: true },
  })
  await payload.updateGlobal({
    slug: 'footer',
    data: { navItems: links(fallbackPrimaryNavItems) },
    context: { disableRevalidate: true },
  })
  await payload.updateGlobal({
    slug: 'clubSettings',
    data: { ...fallbackClubSettings, heroImageUrl: '', logoImageUrl: '', roomImageUrl: '' },
    context: { disableRevalidate: true },
  })
} finally {
  await payload.destroy()
}
process.exit(0)
