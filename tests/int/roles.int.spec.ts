import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, expect, it } from 'vitest'
let payload: Payload
const ids: number[] = []
beforeAll(async () => {
  payload = await getPayload({ config })
  if (!(await payload.count({ collection: 'users' })).totalDocs) {
    const admin = await payload.create({
      collection: 'users',
      data: { email: 'bootstrap@example.test', password: 'local-test-only', role: 'admin' },
      context: { disableRevalidate: true },
    })
    ids.push(admin.id)
  }
})
afterAll(async () => {
  for (const id of ids.reverse())
    await payload.delete({ collection: 'users', id, context: { disableRevalidate: true } })
  await payload.destroy()
})
it('lets editors manage their profile but not users or their own role', async () => {
  const editor = await payload.create({
    collection: 'users',
    data: {
      email: `editor-${Date.now()}@example.test`,
      password: 'local-test-only',
      role: 'editor',
    },
    context: { disableRevalidate: true },
  })
  ids.push(editor.id)
  expect(editor.role).toBe('editor')
  const other = await payload.create({
    collection: 'users',
    data: { email: `admin-${Date.now()}@example.test`, password: 'local-test-only', role: 'admin' },
    context: { disableRevalidate: true },
  })
  ids.push(other.id)
  const user = { ...editor, collection: 'users' as const }
  const result = await payload.update({
    collection: 'users',
    id: editor.id,
    user,
    overrideAccess: false,
    data: { name: 'Updated editor', role: 'admin' },
    context: { disableRevalidate: true },
  })
  expect(result.name).toBe('Updated editor')
  expect(result.role).toBe('editor')
  await expect(
    payload.create({
      collection: 'users',
      user,
      overrideAccess: false,
      data: { email: 'forbidden@example.test', password: 'local-test-only', role: 'editor' },
    }),
  ).rejects.toThrow()
  await expect(
    payload.findByID({ collection: 'users', id: other.id, user, overrideAccess: false }),
  ).rejects.toThrow()
})
