import './environment'
import { getPayload } from 'payload'
import { assertTestDatabase } from '../../src/utilities/databaseSafety'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  assertTestDatabase()
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    context: { disableRevalidate: true },
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    context: { disableRevalidate: true },
    collection: 'users',
    data: { ...testUser, role: 'admin' },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  assertTestDatabase()
  const payload = await getPayload({ config })

  await payload.delete({
    context: { disableRevalidate: true },
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
  await payload.destroy()
}

export async function queuePublication(id: number, type: 'publish' | 'unpublish') {
  assertTestDatabase()
  const payload = await getPayload({ config })
  return payload.jobs.queue({
    task: 'schedulePublish',
    input: { type, doc: { relationTo: 'pages', value: id } },
    waitUntil: new Date(Date.now() - 1000),
  })
}

export async function cleanupFlyerTest(
  flyerID: number | undefined,
  imageIDs: number[],
  sourceIDs: number[],
) {
  assertTestDatabase()
  const payload = await getPayload({ config })
  const context = { disableRevalidate: true }
  if (flyerID) await payload.delete({ collection: 'monthlyFlyers', id: flyerID, context })
  const linked = sourceIDs.length
    ? await payload.find({
        collection: 'media',
        where: { sourceDocument: { in: sourceIDs } },
        limit: 0,
        depth: 0,
      })
    : { docs: [] }
  for (const id of new Set([...imageIDs, ...linked.docs.map((doc) => doc.id)]))
    await payload.delete({ collection: 'media', id, context })
  // Test teardown is a trusted maintenance operation, outside the editor's immutable-source API.
  for (const id of sourceIDs) await payload.delete({ collection: 'sourceDocuments', id, context })
}
