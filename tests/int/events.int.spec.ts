import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { beforeAll, afterAll, it, expect } from 'vitest'
let payload: Payload
const ids: number[] = []
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  for (const id of ids) await payload.delete({ collection: 'events', id, context })
  await payload.destroy()
})
it('allows an unfinished draft but validates dated publication and time choices', async () => {
  const doc = await payload.create({
    collection: 'events',
    data: { title: 'Synthetic event', summary: 'Test only', kind: 'dated', _status: 'draft' },
    context,
  })
  ids.push(doc.id)
  await expect(
    payload.update({ collection: 'events', id: doc.id, data: { _status: 'published' }, context }),
  ).rejects.toThrow('date')
  await expect(
    payload.update({
      collection: 'events',
      id: doc.id,
      data: { date: '2026-09-19', timeMode: 'known', _status: 'published' },
      context,
    }),
  ).rejects.toThrow('startTime')
  const published = await payload.update({
    collection: 'events',
    id: doc.id,
    data: { date: '2026-09-19', timeMode: 'unannounced', _status: 'published' },
    context,
  })
  expect(published._status).toBe('published')
  await expect(
    payload.update({ collection: 'events', id: doc.id, data: { endDate: '2026-09-18' }, context }),
  ).rejects.toThrow('endDate')
  await expect(
    payload.update({
      collection: 'events',
      id: doc.id,
      data: { url: 'javascript:alert(1)' },
      context,
    }),
  ).rejects.toThrow('url')
})
