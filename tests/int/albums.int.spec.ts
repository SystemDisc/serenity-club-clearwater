import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { beforeAll, afterAll, it, expect } from 'vitest'
import sharp from 'sharp'
let payload: Payload
let editor: User
let albumID: number | undefined
let imageID: number | undefined
let photoID: number | undefined
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
  editor = await payload.create({
    collection: 'users',
    context,
    data: {
      email: `album-test-${Date.now()}@example.com`,
      password: crypto.randomUUID(),
      role: 'admin',
    },
  })
})
afterAll(async () => {
  if (photoID) await payload.delete({ collection: 'galleryItems', id: photoID, context })
  if (albumID) await payload.delete({ collection: 'albums', user: editor, id: albumID, context })
  if (imageID) await payload.delete({ collection: 'media', id: imageID, context })
  await payload.delete({ collection: 'users', id: editor.id, context })
  await payload.destroy()
})
it('keeps album photos hidden until album publication and preserves placement when unpublished', async () => {
  const buffer = await sharp({
    create: { width: 80, height: 50, channels: 3, background: '#32816a' },
  })
    .png()
    .toBuffer()
  const image = await payload.create({
    collection: 'media',
    context,
    data: { alt: 'Synthetic album test' },
    file: { data: buffer, name: 'album-test.png', mimetype: 'image/png', size: buffer.length },
  })
  imageID = image.id
  const album = await payload.create({
    collection: 'albums',
    draft: true,
    user: editor,
    context,
    data: { title: `Album regression ${Date.now()}`, cover: image.id, _status: 'draft' },
  })
  albumID = album.id
  await expect(
    payload.update({
      collection: 'albums',
      user: editor,
      id: album.id,
      context,
      data: { _status: 'published' },
    }),
  ).rejects.toThrow('title')
  const photo = await payload.create({
    collection: 'galleryItems',
    context,
    data: { title: 'Album test photo', image: image.id, album: album.id, _status: 'published' },
  })
  photoID = photo.id
  const publicPhoto = () =>
    payload.find({
      collection: 'galleryItems',
      overrideAccess: false,
      where: { id: { equals: photo.id } },
      depth: 0,
    })
  expect((await publicPhoto()).docs).toHaveLength(0)
  // Trusted maintenance updates in this isolated test intentionally use the Local API override.
  await payload.update({
    collection: 'albums',
    user: editor,
    id: album.id,
    context,
    data: { _status: 'published' },
  })
  expect((await publicPhoto()).docs).toHaveLength(1)
  await payload.update({
    collection: 'albums',
    user: editor,
    id: album.id,
    context,
    data: { _status: 'draft' },
  })
  expect((await publicPhoto()).docs).toHaveLength(0)
  expect(
    (await payload.findByID({ collection: 'galleryItems', id: photo.id, depth: 0 })).album,
  ).toBe(album.id)
  await expect(
    payload.delete({ collection: 'albums', user: editor, id: album.id, context }),
  ).rejects.toThrow('still contains photos')
  await payload.update({ collection: 'galleryItems', id: photo.id, context, data: { album: null } })
  expect((await publicPhoto()).docs).toHaveLength(1)
})
