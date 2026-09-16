import { reservedPageSlugs } from '@/utilities/pagePaths'
import type { MetadataRoute } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { hasUsableDatabaseUrl } from '@/serenity/data'
import { getCanonicalSiteURL } from '@/utilities/siteURL'

export const revalidate = 300

type SitemapEntry = MetadataRoute.Sitemap[number]

const publicRoutes: Array<{
  changeFrequency: SitemapEntry['changeFrequency']
  path: string
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/meeting-schedule', changeFrequency: 'daily', priority: 0.9 },
  { path: '/events', changeFrequency: 'daily', priority: 0.8 },
  { path: '/shop', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/reach-out', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/ways-to-give', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/policies', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/groups', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/posts', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/gallery', changeFrequency: 'weekly', priority: 0.7 },
]

const normalizeSlug = (slug: string) => slug.trim().replace(/^\/+|\/+$/g, '')

const getLastModified = (value: unknown) => {
  if (typeof value !== 'string' || !value) return undefined

  const date = new Date(value)

  return Number.isNaN(date.valueOf()) ? undefined : date
}

const dedupeEntries = (entries: SitemapEntry[]) => {
  const deduped = new Map<string, SitemapEntry>()

  entries.forEach((entry) => {
    deduped.set(entry.url, entry)
  })

  return [...deduped.values()]
}

const getCmsEntries = unstable_cache(
  async (siteUrl: string): Promise<SitemapEntry[]> => {
    if (!hasUsableDatabaseUrl()) return []

    const payload = await getPayload({ config: configPromise })

    const [pages, products, posts, albums] = await Promise.all([
      payload.find({
        collection: 'pages',
        depth: 0,
        draft: false,
        limit: 0,
        overrideAccess: false,
        pagination: false,
        select: {
          slug: true,
          updatedAt: true,
        },
        where: {
          _status: {
            equals: 'published',
          },
        },
      }),
      payload.find({
        collection: 'products',
        depth: 0,
        draft: false,
        limit: 0,
        overrideAccess: false,
        pagination: false,
        select: {
          slug: true,
          updatedAt: true,
        },
        where: {
          _status: {
            equals: 'published',
          },
        },
      }),
      payload.find({
        collection: 'posts',
        depth: 0,
        draft: false,
        limit: 0,
        pagination: false,
        overrideAccess: false,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'albums',
        depth: 0,
        draft: false,
        limit: 0,
        pagination: false,
        overrideAccess: false,
        select: { slug: true, updatedAt: true },
      }),
    ])

    const pageEntries = pages.docs.flatMap((page): SitemapEntry[] => {
      const slug = normalizeSlug(page.slug || '')

      if (!slug || reservedPageSlugs.has(slug)) return []

      return [
        {
          url: slug === 'home' ? `${siteUrl}/` : `${siteUrl}/${slug}`,
          lastModified: getLastModified(page.updatedAt),
          changeFrequency: 'weekly',
          priority: slug === 'home' ? 1 : 0.7,
        },
      ]
    })

    const productEntries = products.docs.flatMap((product): SitemapEntry[] => {
      const slug = normalizeSlug(product.slug || '')

      if (!slug) return []

      return [
        {
          url: `${siteUrl}/shop/${slug}`,
          lastModified: getLastModified(product.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.6,
        },
      ]
    })

    return [
      ...posts.docs.map((post): SitemapEntry => ({
        url: `${siteUrl}/posts/${post.slug}`,
        lastModified: getLastModified(post.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      })),
      ...pageEntries,
      ...productEntries,
      ...albums.docs.map((album): SitemapEntry => ({
        url: `${siteUrl}/gallery/albums/${album.slug}`,
        lastModified: getLastModified(album.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.6,
      })),
    ]
  },
  ['public-sitemap'],
  {
    revalidate: 300,
    tags: ['posts-sitemap', 'pages-sitemap', 'products-sitemap', 'albums-sitemap'],
  },
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getCanonicalSiteURL()
  const staticEntries = publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
  const cmsEntries = await getCmsEntries(siteUrl)

  return dedupeEntries([...staticEntries, ...cmsEntries])
}
