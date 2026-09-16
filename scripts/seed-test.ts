import '../tests/helpers/environment'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import sharp from 'sharp'
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
  // The public viewer needs two published images even on an empty CI database.
  // These synthetic fixtures never depend on copied production content.
  for (const [index, color] of ['#245b49', '#415a91'].entries()) {
    const importKey = `test-gallery-viewer-${index}`
    const existing = await payload.find({
      collection: 'galleryItems',
      where: { importKey: { equals: importKey } },
      limit: 1,
    })
    if (existing.docs.length) continue
    const data = await sharp({
      create: { width: 640, height: 480, channels: 3, background: color },
    }).png().toBuffer()
    const media = await payload.create({
      collection: 'media',
      data: { alt: `Synthetic gallery fixture ${index + 1}` },
      file: { data, name: `${importKey}.png`, mimetype: 'image/png', size: data.length },
      context: { disableRevalidate: true },
    })
    await payload.create({
      collection: 'galleryItems',
      data: { importKey, title: `Gallery fixture ${index + 1}`, image: media.id, _status: 'published' },
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
