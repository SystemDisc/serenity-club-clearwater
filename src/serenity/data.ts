import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { Event } from '@/payload-types'
import { eventCalendarDetails, sortEvents } from './events'

import {
  type ClubSettings,
  type EventItem,
  type GalleryItem,
  type Meeting,
  type NavItem,
  type Policy,
  type Product,
  type SerenityData,
  type SiteNavigation,
  type Sponsor,
  type TeamMember,
  fallbackClubSettings,
  fallbackEvents,
  fallbackGalleryItems,
  fallbackMeetings,
  fallbackPolicies,
  fallbackPrimaryNavItems,
  fallbackProducts,
  fallbackSecondaryNavItems,
  fallbackSerenityData,
  fallbackSponsors,
  fallbackTeamMembers,
} from './content'

type SerenityCollection =
  'events' | 'galleryItems' | 'meetings' | 'policies' | 'products' | 'sponsors' | 'teamMembers'

export const hasUsableDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL

  return Boolean(
    databaseUrl && !databaseUrl.includes('<password>') && !databaseUrl.includes('YOUR_'),
  )
}

const getText = (value: unknown, fallback = '') => {
  return value === null ? '' : typeof value === 'string' ? value.trim() : fallback
}

const getNumber = (value: unknown, fallback = 100) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const getUploadedUrl = (value: unknown) => {
  if (!value || typeof value !== 'object') return undefined

  const record = value as { url?: unknown }
  return typeof record.url === 'string' && record.url ? record.url : undefined
}

const getImageUrl = (doc: Record<string, unknown>, uploadField: string, externalField: string) => {
  return getUploadedUrl(doc[uploadField]) || getText(doc[externalField]) || undefined
}

const getImageAlt = (doc: Record<string, unknown>) => {
  const media =
    doc.image && typeof doc.image === 'object' ? (doc.image as { alt?: unknown }) : undefined
  return getText(doc.imageAlt) || getText(media?.alt) || undefined
}

const fallbackSiteNavigation = (): SiteNavigation => ({
  footerNavItems: [...fallbackPrimaryNavItems, ...fallbackSecondaryNavItems],
  primaryNavItems: fallbackPrimaryNavItems,
  secondaryNavItems: fallbackSecondaryNavItems,
})

const sortByOrder = <T extends { order: number }>(docs: T[]) =>
  [...docs].sort((a, b) => a.order - b.order)

export const getPayloadClient = cache(async () => {
  if (process.env.DEMO_MODE === 'true') return null
  if (!hasUsableDatabaseUrl()) throw new Error('Public content requires a configured database')
  return getPayload({ config: configPromise })
})

const collectionDocuments = (collection: SerenityCollection) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      if (!payload) return null
      const result = await payload.find({
        collection,
        depth: 1,
        draft: false,
        limit: 0,
        overrideAccess: false,
        pagination: false,
        sort: ['order', 'id'],
        populate: { media: { url: true, filename: true, prefix: true, alt: true } },
      })
      return result.docs
    },
    ['public-collection', collection],
    {
      revalidate: 300,
      tags: [
        `public-${collection}`,
        'public-media',
        ...(collection === 'events' ? ['public-meetings'] : []),
      ],
    },
  )()

async function findCollection<T>(
  collection: SerenityCollection,
  fallback: T[],
  normalize: (doc: Record<string, unknown>) => T,
  selected?: readonly SerenityCollection[],
): Promise<T[]> {
  if (selected && !selected.includes(collection)) return []
  const docs = await collectionDocuments(collection)
  return docs === null
    ? fallback
    : docs.map((doc) => normalize(doc as unknown as Record<string, unknown>))
}

export const normalizeGalleryItem = (doc: Record<string, unknown>): GalleryItem => ({
  category: (getText(doc.category, 'Clubhouse') as GalleryItem['category']) || 'Clubhouse',
  description: getText(doc.description) || undefined,
  id: String(doc.id),
  imageAlt: getImageAlt(doc),
  imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
  order: getNumber(doc.order),
  title: getText(doc.title),
})

const getReferenceHref = (reference: unknown) => {
  if (!reference || typeof reference !== 'object') return ''

  const record = reference as { relationTo?: unknown; value?: unknown }
  const relationTo = getText(record.relationTo)
  const value = record.value

  if (!value || typeof value !== 'object') return ''

  const slug = getText((value as { slug?: unknown }).slug)
  if (!slug) return ''

  if (relationTo === 'posts') return `/posts/${slug}`
  if (relationTo === 'pages') return slug === 'home' ? '/' : `/${slug}`

  return ''
}

const normalizeNavItem = (doc: unknown): NavItem | null => {
  if (!doc || typeof doc !== 'object') return null

  const link = (doc as { link?: unknown }).link
  if (!link || typeof link !== 'object') return null

  const record = link as {
    label?: unknown
    newTab?: unknown
    reference?: unknown
    type?: unknown
    url?: unknown
  }
  const label = getText(record.label)
  const href =
    getText(record.type) === 'reference' ? getReferenceHref(record.reference) : getText(record.url)

  if (!label || !href) return null

  return {
    href,
    label,
    newTab: record.newTab === true,
  }
}

const getNavItems = (global: unknown, fieldName: string) => {
  if (!global || typeof global !== 'object') return []

  const field = (global as Record<string, unknown>)[fieldName]
  if (!Array.isArray(field)) return []

  return field.map(normalizeNavItem).filter((item): item is NavItem => Boolean(item))
}

export const getSiteNavigation = cache(async (): Promise<SiteNavigation> => {
  const payload = await getPayloadClient()

  if (!payload) return fallbackSiteNavigation()

  const [header, footer] = await Promise.all([
    payload.findGlobal({
      depth: 1,
      slug: 'header',
      overrideAccess: false,
    }),
    payload.findGlobal({
      depth: 1,
      slug: 'footer',
      overrideAccess: false,
    }),
  ])

  const primaryNavItems = getNavItems(header, 'navItems')
  const secondaryNavItems = getNavItems(header, 'secondaryNavItems')
  const resolvedPrimary = primaryNavItems
  const resolvedSecondary = secondaryNavItems
  const footerNavItems = getNavItems(footer, 'navItems')

  return {
    footerNavItems,
    primaryNavItems: resolvedPrimary,
    secondaryNavItems: resolvedSecondary,
  }
})

export const getSerenitySettings = cache(async (): Promise<ClubSettings> => {
  const payload = await getPayloadClient()

  if (!payload) return fallbackClubSettings

  const settings = (await payload.findGlobal({
    depth: 1,
    slug: 'clubSettings',
    overrideAccess: false,
  })) as unknown as Record<string, unknown>

  return {
    address: getText(settings.address, fallbackClubSettings.address),
    cityStateZip: getText(settings.cityStateZip, fallbackClubSettings.cityStateZip),
    donationUrl: getText(settings.donationUrl, fallbackClubSettings.donationUrl),
    email: getText(settings.email, fallbackClubSettings.email),
    facebookUrl: getText(settings.facebookUrl, fallbackClubSettings.facebookUrl),
    heroImageUrl: getImageUrl(settings, 'heroImage', 'heroImageUrl'),
    hours: getText(settings.hours, fallbackClubSettings.hours),
    instagramUrl: getText(settings.instagramUrl, fallbackClubSettings.instagramUrl),
    legalName: getText(settings.legalName, fallbackClubSettings.legalName),
    logoImageUrl: getImageUrl(settings, 'logoImage', 'logoImageUrl'),
    name: getText(settings.name, fallbackClubSettings.name),
    phone: getText(settings.phone, fallbackClubSettings.phone),
    roomImageUrl: getImageUrl(settings, 'roomImage', 'roomImageUrl'),
    summary: getText(settings.summary, fallbackClubSettings.summary),
    tagline: getText(settings.tagline, fallbackClubSettings.tagline),
  }
})

export const getSerenityData = cache(
  async (selected?: readonly SerenityCollection[]): Promise<SerenityData> => {
    const [settings, meetings, events, galleryItems, teamMembers, products, policies, sponsors] =
      await Promise.all([
        getSerenitySettings(),
        findCollection<Meeting>(
          'meetings',
          fallbackMeetings,
          (doc) => ({
            days: getText(doc.days),
            description: getText(doc.publicNotes) || undefined,
            externalUrl: getText(doc.externalUrl) || undefined,
            fellowship: (getText(doc.fellowship, 'AA') as Meeting['fellowship']) || 'AA',
            sessions: doc.sessions as Meeting['sessions'],
            exceptions: doc.exceptions as Meeting['exceptions'],
            id: String(doc.id),
            name: getText(doc.name),
            order: getNumber(doc.order),
            room: getText(doc.room) || undefined,
            time: getText(doc.time),
          }),
          selected,
        ),
        findCollection<EventItem>(
          'events',
          fallbackEvents,
          (doc) => ({
            category: (getText(doc.category, 'Community') as EventItem['category']) || 'Community',
            featured: doc.featured !== false,
            location: getText(doc.location) || undefined,
            id: String(doc.id),
            imageAlt: getImageAlt(doc),
            imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
            order: getNumber(doc.order),
            summary: getText(doc.summary),
            title: getText(doc.title),
            url: getText(doc.url) || undefined,
            ...eventCalendarDetails(doc as unknown as Event),
          }),
          selected,
        ),
        findCollection('galleryItems', fallbackGalleryItems, normalizeGalleryItem, selected),
        findCollection<TeamMember>(
          'teamMembers',
          fallbackTeamMembers,
          (doc) => ({
            bio: getText(doc.bio),
            id: String(doc.id),
            imageAlt: getImageAlt(doc),
            imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
            name: getText(doc.name),
            order: getNumber(doc.order),
            role: getText(doc.role),
          }),
          selected,
        ),
        findCollection<Product>(
          'products',
          fallbackProducts,
          (doc) => ({
            badge: getText(doc.badge) || undefined,
            checkoutUrl: getText(doc.checkoutUrl) || undefined,
            description: getText(doc.description),
            fulfillmentNote: getText(doc.fulfillmentNote),
            id: String(doc.id),
            imageAlt: getImageAlt(doc),
            imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
            order: getNumber(doc.order),
            price: getText(doc.price),
            slug: getText(doc.slug),
            title: getText(doc.title),
          }),
          selected,
        ),
        findCollection<Policy>(
          'policies',
          fallbackPolicies,
          (doc) => ({
            body: getText(doc.body),
            id: String(doc.id),
            order: getNumber(doc.order),
            title: getText(doc.title),
          }),
          selected,
        ),
        findCollection<Sponsor>(
          'sponsors',
          fallbackSponsors,
          (doc) => ({
            id: String(doc.id),
            imageAlt: getImageAlt(doc),
            imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
            name: getText(doc.name),
            order: getNumber(doc.order),
            url: getText(doc.url) || undefined,
          }),
          selected,
        ),
      ])

    return {
      ...fallbackSerenityData,
      events: sortEvents(events.filter((event) => event.visible !== false)),
      galleryItems: sortByOrder(galleryItems),
      meetings: sortByOrder(meetings),
      policies: sortByOrder(policies),
      products: sortByOrder(products),
      settings,
      sponsors: sortByOrder(sponsors),
      teamMembers: sortByOrder(teamMembers),
    }
  },
)

export const getProductBySlug = cache(async (slug: string) => {
  const data = await getSerenityData(['products'])

  return data.products.find((product) => product.slug === slug) || null
})
