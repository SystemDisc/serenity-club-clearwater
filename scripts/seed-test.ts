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
