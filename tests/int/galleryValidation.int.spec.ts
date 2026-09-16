import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, expect, it } from 'vitest'
let payload: Payload
const ids: number[] = []
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  for (const id of ids) await payload.delete({ collection: 'galleryItems', id, context })
  await payload.destroy()
})
it('allows unfinished drafts but requires an image for publication and subsequent edits', async () => {
  const draft = await payload.create({
    collection: 'galleryItems',
    data: { title: 'Image validation test', _status: 'draft' },
    context,
  })
  ids.push(draft.id)
  await expect(
    payload.update({
      collection: 'galleryItems',
      id: draft.id,
      data: { _status: 'published' },
      context,
    }),
  ).rejects.toThrow('image')
  await expect(
    payload.update({
      collection: 'galleryItems',
      id: draft.id,
      data: { _status: 'published', externalImageUrl: 'javascript:alert(1)' },
      context,
    }),
  ).rejects.toThrow()
  const published = await payload.update({
    collection: 'galleryItems',
    id: draft.id,
    data: { _status: 'published', externalImageUrl: 'https://static.wixstatic.com/media/test.png' },
    context,
  })
  expect(published._status).toBe('published')
  await expect(
    payload.update({
      collection: 'galleryItems',
      id: draft.id,
      data: { externalImageUrl: '' },
      context,
    }),
  ).rejects.toThrow()
  const edited = await payload.update({
    collection: 'galleryItems',
    id: draft.id,
    data: { title: 'Updated caption' },
    context,
  })
  expect(edited._status).toBe('published')
})
