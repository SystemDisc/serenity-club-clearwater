import { beforeAll, afterAll, expect, it } from 'vitest'
import { createLocalReq, getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import config from '@/payload.config'
import type { User, GalleryItem } from '@/payload-types'
import { organizePhotos } from '@/gallery/organize'
let payload: Payload, user: User
let mediaID: number, albumID: number
const photos: GalleryItem[] = []
const context = { disableRevalidate: true }
async function action(data: Record<string, unknown>, authenticated = true) {
  const req = await createLocalReq(
    { user: authenticated ? { ...user, collection: 'users' } : undefined, context: { ...context } },
    payload,
  )
  req.json = async () => data
  return organizePhotos(req)
}
const snapshot = (items: GalleryItem[]) =>
  items.map((photo) => ({ id: photo.id, updatedAt: photo.updatedAt }))
beforeAll(async () => {
  payload = await getPayload({ config })
  user = await payload.create({
    collection: 'users',
    context,
    data: {
      email: `organize-${Date.now()}@example.com`,
      password: crypto.randomUUID(),
      role: 'editor',
    },
  })
  expect(user.role).toBe('editor')
  const data = await sharp({
    create: { width: 80, height: 60, channels: 3, background: '#114433' },
  })
    .png()
    .toBuffer()
  mediaID = (
    await payload.create({
      collection: 'media',
      context,
      data: { alt: 'Synthetic organization fixture' },
      file: { name: 'organize-fixture.png', data, mimetype: 'image/png', size: data.length },
    })
  ).id
  albumID = (
    await payload.create({
      collection: 'albums',
      draft: true,
      context,
      data: { title: `Organizer fixture ${Date.now()}`, _status: 'draft' },
    })
  ).id
  for (let i = 0; i < 4; i++)
    photos.push(
      await payload.create({
        collection: 'galleryItems',
        context,
        data: {
          title: `Organizer fixture ${i}`,
          image: mediaID,
          album: albumID,
          order: 100,
          _status: 'published',
        },
      }),
    )
  await payload.update({
    collection: 'albums',
    user,
    id: albumID,
    context,
    data: { cover: mediaID, _status: 'published' },
  })
})
afterAll(async () => {
  for (const photo of photos)
    await payload.delete({ collection: 'galleryItems', id: photo.id, trash: true, context })
  if (albumID) await payload.delete({ collection: 'albums', id: albumID, trash: true, context })
  if (mediaID) await payload.delete({ collection: 'media', id: mediaID, context })
  if (user) await payload.delete({ collection: 'users', id: user.id, context })
  await payload.destroy()
})
it('preserves other photos while ordering legacy positions, moves placements and recovers trash without deleting files', async () => {
  await expect(
    action({ action: 'move', photos: snapshot([photos[0]]), album: null }, false),
  ).rejects.toThrow('Sign in')
  await action({
    action: 'reorder',
    photos: snapshot(photos.slice(0, 2)),
    ids: [photos[1].id, photos[0].id],
  })
  const ordered = await payload.find({
    collection: 'galleryItems',
    draft: true,
    depth: 0,
    where: { album: { equals: albumID } },
    sort: ['order', 'id'],
  })
  expect(ordered.docs.map((photo) => photo.id)).toEqual([
    photos[1].id,
    photos[0].id,
    photos[2].id,
    photos[3].id,
  ])
  await expect(
    action({ action: 'move', photos: snapshot([photos[0]]), album: null }),
  ).rejects.toThrow('changed in another editor')
  const selected = ordered.docs[0]
  await action({ action: 'move', photos: snapshot([selected]), album: null })
  const moved = await payload.findByID({ collection: 'galleryItems', id: selected.id, depth: 0 })
  expect(moved.album).toBeNull()
  expect(moved._status).toBe('published')
  await action({ action: 'trash', photos: snapshot([moved]) })
  expect(
    (
      await payload.find({
        collection: 'galleryItems',
        overrideAccess: false,
        where: { id: { equals: moved.id } },
      })
    ).totalDocs,
  ).toBe(0)
  expect((await payload.findByID({ collection: 'media', id: mediaID })).url).toBeTruthy()
  await payload.update({
    collection: 'galleryItems',
    id: moved.id,
    trash: true,
    context,
    data: { deletedAt: null },
  })
  expect(
    (await payload.findByID({ collection: 'galleryItems', id: moved.id, overrideAccess: false }))
      .id,
  ).toBe(moved.id)
})
it('does not publish pending edits or silently overwrite a concurrent change', async () => {
  const before = await payload.findByID({ collection: 'galleryItems', id: photos[2].id, depth: 0 })
  await payload.update({
    collection: 'galleryItems',
    id: before.id,
    draft: true,
    context,
    data: { title: 'Private pending caption correction', _status: 'draft' },
  })
  const draft = await payload.findByID({
    collection: 'galleryItems',
    id: before.id,
    draft: true,
    depth: 0,
  })
  await expect(action({ action: 'move', photos: snapshot([draft]), album: null })).rejects.toThrow(
    'unpublished edits',
  )
  const last = await payload.findByID({
    collection: 'galleryItems',
    id: photos[3].id,
    draft: true,
    depth: 0,
  })
  const results = await Promise.allSettled([
    action({ action: 'move', photos: snapshot([last]), album: null }),
    action({ action: 'trash', photos: snapshot([last]) }),
  ])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
})
