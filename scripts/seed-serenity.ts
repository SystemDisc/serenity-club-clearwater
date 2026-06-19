import dotenv from 'dotenv'
import { getPayload, type Payload } from 'payload'

import {
  fallbackClubSettings,
  fallbackEvents,
  fallbackMeetings,
  fallbackPolicies,
  fallbackProducts,
  fallbackSponsors,
  fallbackTeamMembers,
} from '../src/serenity/content'

dotenv.config({ path: '.env.local' })
dotenv.config()

const getPayloadConfig = async () => {
  const { default: configPromise } = await import('../src/payload.config')

  return configPromise
}

const ensureDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl || databaseUrl.includes('<password>') || databaseUrl.includes('YOUR_')) {
    throw new Error('DATABASE_URL must point to the Vercel/Neon database before seeding.')
  }
}

type SerenityCollection =
  | 'events'
  | 'meetings'
  | 'policies'
  | 'products'
  | 'sponsors'
  | 'teamMembers'

const legacyLookupValues: Partial<Record<SerenityCollection, Record<string, string[]>>> = {
  events: {
    'May 2026 Events': ['Monthly Events Flyer'],
  },
  policies: {
    'Guest and Membership Use': ['Respect the Meetings'],
    'Clubhouse Safety': ['Keep the Clubhouse Safe'],
    'House Rules': ['Help Keep the Space Clean'],
    'Posting, Discipline, and Permissions': ['Group and Event Use'],
  },
}

const collectionsWithExternalImages = new Set<SerenityCollection>([
  'events',
  'products',
  'sponsors',
  'teamMembers',
])

const normalizeSeedData = (collection: SerenityCollection, data: Record<string, unknown>) => {
  const { imageUrl, ...rest } = data

  if (collectionsWithExternalImages.has(collection) && typeof imageUrl === 'string' && imageUrl) {
    return {
      ...rest,
      externalImageUrl: imageUrl,
    }
  }

  return data
}

async function upsertCollectionDoc<TCollection extends SerenityCollection>({
  collection,
  data,
  field,
  payload,
  value,
}: {
  collection: TCollection
  data: Record<string, unknown>
  field: string
  payload: Payload
  value: string
}) {
  const lookupValues = [value, ...(legacyLookupValues[collection]?.[value] || [])]
  let existingDoc: { id: number | string } | undefined

  for (const lookupValue of lookupValues) {
    const existing = await payload.find({
      collection,
      limit: 1,
      pagination: false,
      where: {
        [field]: {
          equals: lookupValue,
        },
      },
    })

    existingDoc = existing.docs[0] as { id: number | string } | undefined

    if (existingDoc) break
  }

  const publishableData = {
    ...normalizeSeedData(collection, data),
    _status: 'published' as const,
  }
  const collectionPayload = payload as unknown as {
    create: (options: { collection: TCollection; data: typeof publishableData }) => Promise<unknown>
    update: (options: {
      collection: TCollection
      data: typeof publishableData
      id: number | string
    }) => Promise<unknown>
  }

  if (existingDoc) {
    await collectionPayload.update({
      collection,
      data: publishableData,
      id: existingDoc.id,
    })
    return
  }

  await collectionPayload.create({
    collection,
    data: publishableData,
  })
}

async function seedSerenity() {
  ensureDatabaseUrl()

  const configPromise = await getPayloadConfig()
  const payload = await getPayload({ config: configPromise })

  await payload.updateGlobal({
    slug: 'clubSettings',
    data: fallbackClubSettings,
  })

  for (const meeting of fallbackMeetings) {
    await upsertCollectionDoc({
      collection: 'meetings',
      data: meeting,
      field: 'name',
      payload,
      value: meeting.name,
    })
  }

  for (const event of fallbackEvents) {
    await upsertCollectionDoc({
      collection: 'events',
      data: event,
      field: 'title',
      payload,
      value: event.title,
    })
  }

  for (const member of fallbackTeamMembers) {
    await upsertCollectionDoc({
      collection: 'teamMembers',
      data: member,
      field: 'name',
      payload,
      value: member.name,
    })
  }

  for (const product of fallbackProducts) {
    await upsertCollectionDoc({
      collection: 'products',
      data: product,
      field: 'slug',
      payload,
      value: product.slug,
    })
  }

  for (const policy of fallbackPolicies) {
    await upsertCollectionDoc({
      collection: 'policies',
      data: policy,
      field: 'title',
      payload,
      value: policy.title,
    })
  }

  for (const sponsor of fallbackSponsors) {
    await upsertCollectionDoc({
      collection: 'sponsors',
      data: sponsor,
      field: 'name',
      payload,
      value: sponsor.name,
    })
  }

  payload.logger.info('Seeded Serenity Club content.')
}

seedSerenity()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
