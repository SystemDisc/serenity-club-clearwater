import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  type ClubSettings,
  type EventItem,
  type GalleryItem,
  type Meeting,
  type Policy,
  type Product,
  type SerenityData,
  type Sponsor,
  type TeamMember,
  fallbackClubSettings,
  fallbackEvents,
  fallbackGalleryItems,
  fallbackMeetings,
  fallbackPolicies,
  fallbackProducts,
  fallbackSerenityData,
  fallbackSponsors,
  fallbackTeamMembers,
} from './content'

type SerenityCollection =
  | 'events'
  | 'galleryItems'
  | 'meetings'
  | 'policies'
  | 'products'
  | 'sponsors'
  | 'teamMembers'

export const hasUsableDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL

  return Boolean(
    databaseUrl && !databaseUrl.includes('<password>') && !databaseUrl.includes('YOUR_'),
  )
}

const getText = (value: unknown, fallback = '') => {
  return typeof value === 'string' && value.trim() ? value : fallback
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

const sortByOrder = <T extends { order: number }>(docs: T[]) =>
  [...docs].sort((a, b) => a.order - b.order)

async function getPayloadClient() {
  if (!hasUsableDatabaseUrl()) return null

  try {
    return await getPayload({ config: configPromise })
  } catch (_error) {
    return null
  }
}

async function findCollection<T>(
  collection: SerenityCollection,
  fallback: T[],
  normalize: (doc: Record<string, unknown>) => T,
) {
  const payload = await getPayloadClient()

  if (!payload) return fallback

  try {
    const result = await payload.find({
      collection,
      depth: 1,
      draft: false,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: 'order',
    })

    if (!result.docs.length) return fallback

    return result.docs.map((doc) => normalize(doc as unknown as Record<string, unknown>))
  } catch (_error) {
    return fallback
  }
}

export async function getSerenitySettings(): Promise<ClubSettings> {
  const payload = await getPayloadClient()

  if (!payload) return fallbackClubSettings

  try {
    const settings = (await payload.findGlobal({
      depth: 1,
      slug: 'clubSettings',
    })) as unknown as Record<string, unknown>

    return {
      address: getText(settings.address, fallbackClubSettings.address),
      cityStateZip: getText(settings.cityStateZip, fallbackClubSettings.cityStateZip),
      donationUrl: getText(settings.donationUrl, fallbackClubSettings.donationUrl),
      email: getText(settings.email, fallbackClubSettings.email),
      facebookUrl: getText(settings.facebookUrl, fallbackClubSettings.facebookUrl),
      heroImageUrl:
        getImageUrl(settings, 'heroImage', 'heroImageUrl') || fallbackClubSettings.heroImageUrl,
      hours: getText(settings.hours, fallbackClubSettings.hours),
      instagramUrl: getText(settings.instagramUrl, fallbackClubSettings.instagramUrl),
      legalName: getText(settings.legalName, fallbackClubSettings.legalName),
      logoImageUrl:
        getImageUrl(settings, 'logoImage', 'logoImageUrl') || fallbackClubSettings.logoImageUrl,
      name: getText(settings.name, fallbackClubSettings.name),
      phone: getText(settings.phone, fallbackClubSettings.phone),
      roomImageUrl:
        getImageUrl(settings, 'roomImage', 'roomImageUrl') || fallbackClubSettings.roomImageUrl,
      summary: getText(settings.summary, fallbackClubSettings.summary),
      tagline: getText(settings.tagline, fallbackClubSettings.tagline),
    }
  } catch (_error) {
    return fallbackClubSettings
  }
}

export async function getSerenityData(): Promise<SerenityData> {
  const [settings, meetings, events, galleryItems, teamMembers, products, policies, sponsors] =
    await Promise.all([
      getSerenitySettings(),
      findCollection<Meeting>('meetings', fallbackMeetings, (doc) => ({
        days: getText(doc.days),
        description: getText(doc.description) || undefined,
        externalUrl: getText(doc.externalUrl) || undefined,
        fellowship: (getText(doc.fellowship, 'AA') as Meeting['fellowship']) || 'AA',
        format: getText(doc.format) || undefined,
        id: getText(doc.id),
        name: getText(doc.name),
        order: getNumber(doc.order),
        room: getText(doc.room) || undefined,
        time: getText(doc.time),
      })),
      findCollection<EventItem>('events', fallbackEvents, (doc) => ({
        category: (getText(doc.category, 'Community') as EventItem['category']) || 'Community',
        dateLabel: getText(doc.dateLabel),
        id: getText(doc.id),
        imageAlt: getText(doc.imageAlt) || undefined,
        imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
        order: getNumber(doc.order),
        summary: getText(doc.summary),
        timeLabel: getText(doc.timeLabel) || undefined,
        title: getText(doc.title),
        url: getText(doc.url) || undefined,
      })),
      findCollection<GalleryItem>('galleryItems', fallbackGalleryItems, (doc) => ({
        category: (getText(doc.category, 'Clubhouse') as GalleryItem['category']) || 'Clubhouse',
        description: getText(doc.description) || undefined,
        id: getText(doc.id),
        imageAlt: getText(doc.imageAlt) || undefined,
        imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
        order: getNumber(doc.order),
        title: getText(doc.title),
      })),
      findCollection<TeamMember>('teamMembers', fallbackTeamMembers, (doc) => ({
        bio: getText(doc.bio),
        id: getText(doc.id),
        imageAlt: getText(doc.imageAlt) || undefined,
        imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
        name: getText(doc.name),
        order: getNumber(doc.order),
        role: getText(doc.role),
      })),
      findCollection<Product>('products', fallbackProducts, (doc) => ({
        badge: getText(doc.badge) || undefined,
        checkoutUrl: getText(doc.checkoutUrl) || undefined,
        description: getText(doc.description),
        fulfillmentNote: getText(doc.fulfillmentNote),
        id: getText(doc.id),
        imageAlt: getText(doc.imageAlt) || undefined,
        imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
        order: getNumber(doc.order),
        price: getText(doc.price),
        slug: getText(doc.slug),
        title: getText(doc.title),
      })),
      findCollection<Policy>('policies', fallbackPolicies, (doc) => ({
        body: getText(doc.body),
        id: getText(doc.id),
        order: getNumber(doc.order),
        title: getText(doc.title),
      })),
      findCollection<Sponsor>('sponsors', fallbackSponsors, (doc) => ({
        id: getText(doc.id),
        imageAlt: getText(doc.imageAlt) || undefined,
        imageUrl: getImageUrl(doc, 'image', 'externalImageUrl'),
        name: getText(doc.name),
        order: getNumber(doc.order),
        url: getText(doc.url) || undefined,
      })),
    ])

  return {
    ...fallbackSerenityData,
    events: sortByOrder(events),
    galleryItems: sortByOrder(galleryItems),
    meetings: sortByOrder(meetings),
    policies: sortByOrder(policies),
    products: sortByOrder(products),
    settings,
    sponsors: sortByOrder(sponsors),
    teamMembers: sortByOrder(teamMembers),
  }
}

export async function getProductBySlug(slug: string) {
  const data = await getSerenityData()

  return data.products.find((product) => product.slug === slug) || null
}
