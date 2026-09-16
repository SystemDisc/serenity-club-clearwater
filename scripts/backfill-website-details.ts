/** Preserve the first recoverable settings version and introduce the approved News navigation. */
import { getPayload } from 'payload'
import config from '../src/payload.config'
const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })
try {
  const context = { disableRevalidate: true }
  const [settings, header, footer] = await Promise.all([
    payload.findGlobal({ slug: 'clubSettings', depth: 0 }),
    payload.findGlobal({ slug: 'header', depth: 0 }),
    payload.findGlobal({ slug: 'footer', depth: 0 }),
  ])
  const news = { link: { type: 'custom' as const, url: '/posts', label: 'News & updates' } }
  const headerHasNews = [...(header.navItems || []), ...(header.secondaryNavItems || [])].some(
    (item) => item.link.url === '/posts',
  )
  const footerHasNews = (footer.navItems || []).some((item) => item.link.url === '/posts')
  if (!headerHasNews && (header.secondaryNavItems?.length || 0) >= 8)
    throw new Error('Top More menu is full. Choose a place for News before applying this backfill.')
  if (!footerHasNews && (footer.navItems?.length || 0) >= 12)
    throw new Error('Bottom menu is full. Choose a place for News before applying this backfill.')
  const globals = [
    { slug: 'clubSettings', data: settings },
    { slug: 'header', data: header },
    { slug: 'footer', data: footer },
  ] as const
  for (const { slug, data } of globals) {
    const versions = await payload.findGlobalVersions({ slug, limit: 1 })
    if (!versions.totalDocs) {
      console.log(`${apply ? 'Saving' : 'Would save'} a baseline version of ${slug}.`)
      if (apply) await payload.updateGlobal({ slug, data, context })
    }
  }
  if (!headerHasNews) {
    console.log(`${apply ? 'Adding' : 'Would add'} News & updates to the More menu.`)
    if (apply)
      await payload.updateGlobal({
        slug: 'header',
        data: { secondaryNavItems: [...(header.secondaryNavItems || []), news] },
        context,
      })
  }
  if (!footerHasNews) {
    console.log(`${apply ? 'Adding' : 'Would add'} News & updates to the bottom menu.`)
    if (apply)
      await payload.updateGlobal({
        slug: 'footer',
        data: { navItems: [...(footer.navItems || []), news] },
        context,
      })
  }
  console.log(
    apply
      ? 'Applied. Rebuild or revalidate the public website before release.'
      : 'Dry run only. Pass --apply after reviewing a backup.',
  )
} finally {
  await payload.destroy()
}
process.exit(0)
