import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { beforeAll, afterAll, it, expect } from 'vitest'
import sharp from 'sharp'
let payload: Payload
let editor: User
let photoID: number | undefined
const imageIDs: number[] = []
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
  editor = await payload.create({
    collection: 'users',
    context,
    data: {
      email: `recovery-test-${Date.now()}@example.com`,
      password: crypto.randomUUID(),
      role: 'editor',
    },
  })
})
afterAll(async () => {
  if (photoID)
    await payload.delete({ collection: 'galleryItems', id: photoID, trash: true, context })
  for (const id of imageIDs) await payload.delete({ collection: 'media', id, trash: true, context })
  await payload.delete({ collection: 'users', id: editor.id, context })
  await payload.destroy()
})
it('retains files through trash and restore and guards historical file usage and editor permissions', async () => {
  for (const color of ['#12725c', '#49337c']) {
    const data = await sharp({ create: { width: 80, height: 50, channels: 3, background: color } })
      .png()
      .toBuffer()
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'Synthetic recovery test' },
      context,
      file: { data, name: 'recovery-test.png', mimetype: 'image/png', size: data.length },
    })
    imageIDs.push(image.id)
  }
  const photo = await payload.create({
    collection: 'galleryItems',
    context,
    data: { title: 'Recovery test photo', image: imageIDs[0], _status: 'published' },
  })
  photoID = photo.id
  await expect(payload.delete({ collection: 'media', id: imageIDs[0], context })).rejects.toThrow(
    'still used',
  )
  await payload.update({
    collection: 'galleryItems',
    id: photo.id,
    context,
    data: { image: imageIDs[1] },
  })
  await expect(payload.delete({ collection: 'media', id: imageIDs[0], context })).rejects.toThrow(
    'previous or draft version',
  )
  await expect(
    payload.delete({
      collection: 'media',
      id: imageIDs[1],
      context,
      user: editor,
      overrideAccess: false,
    }),
  ).rejects.toThrow()
  await expect(
    payload.delete({
      collection: 'galleryItems',
      id: photo.id,
      context,
      user: editor,
      overrideAccess: false,
    }),
  ).rejects.toThrow()
  await payload.update({
    collection: 'galleryItems',
    id: photo.id,
    context,
    user: editor,
    overrideAccess: false,
    data: { deletedAt: new Date().toISOString() },
  })
  expect(
    (
      await payload.find({
        collection: 'galleryItems',
        overrideAccess: false,
        trash: true,
        where: { id: { equals: photo.id } },
      })
    ).docs,
  ).toHaveLength(0)
  await expect(payload.delete({ collection: 'media', id: imageIDs[1], context })).rejects.toThrow(
    'still used',
  )
  await payload.update({
    collection: 'galleryItems',
    id: photo.id,
    context,
    user: editor,
    overrideAccess: false,
    trash: true,
    data: { deletedAt: null },
  })
  expect(
    (
      await payload.find({
        collection: 'galleryItems',
        overrideAccess: false,
        where: { id: { equals: photo.id } },
      })
    ).docs,
  ).toHaveLength(1)
  const file = await payload.findByID({ collection: 'media', id: imageIDs[1], depth: 0 })
  expect(file.filename).toContain('recovery-test')
})
