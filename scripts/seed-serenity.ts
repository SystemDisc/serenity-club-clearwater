import dotenv from 'dotenv'
import { getPayload } from 'payload'

import configPromise from '../src/payload.config'
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

const ensureDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl || databaseUrl.includes('<password>') || databaseUrl.includes('YOUR_')) {
    throw new Error('DATABASE_URL must point to the Vercel/Neon database before seeding.')
  }
}

type SerenityCollection = 'events' | 'meetings' | 'policies' | 'products' | 'sponsors' | 'teamMembers'

async function upsertCollectionDoc<TCollection extends SerenityCollection>({
  collection,
  data,
  field,
  value,
}: {
  collection: TCollection
  data: Record<string, unknown>
  field: string
  value: string
}) {
  const payload = await getPayload({ config: configPromise })
  const existing = await payload.find({
    collection,
    limit: 1,
    pagination: false,
    where: {
      [field]: {
        equals: value,
      },
    },
  })

  const publishableData = {
    ...data,
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

  if (existing.docs[0]) {
    await collectionPayload.update({
      collection,
      data: publishableData,
      id: existing.docs[0].id,
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
      value: meeting.name,
    })
  }

  for (const event of fallbackEvents) {
    await upsertCollectionDoc({
      collection: 'events',
      data: event,
      field: 'title',
      value: event.title,
    })
  }

  for (const member of fallbackTeamMembers) {
    await upsertCollectionDoc({
      collection: 'teamMembers',
      data: member,
      field: 'name',
      value: member.name,
    })
  }

  for (const product of fallbackProducts) {
    await upsertCollectionDoc({
      collection: 'products',
      data: product,
      field: 'slug',
      value: product.slug,
    })
  }

  for (const policy of fallbackPolicies) {
    await upsertCollectionDoc({
      collection: 'policies',
      data: policy,
      field: 'title',
      value: policy.title,
    })
  }

  for (const sponsor of fallbackSponsors) {
    await upsertCollectionDoc({
      collection: 'sponsors',
      data: sponsor,
      field: 'name',
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
