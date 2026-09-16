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
  return payload.jobs.queue({ task: 'schedulePublish', input: { type, doc: { relationTo: 'pages', value: id } }, waitUntil: new Date(Date.now() - 1000) })
}
