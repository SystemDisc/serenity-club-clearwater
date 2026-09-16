import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getAlbumCover } from '@/serenity/getAlbumCover'
import { afterAll, beforeAll, expect, it } from 'vitest'
import sharp from 'sharp'

let payload: Payload
let user: User
let albumID: number
const photos: number[] = []
const images: number[] = []
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
  user = await payload.create({
    collection: 'users',
    context,
    data: {
      email: `covers-${crypto.randomUUID()}@example.test`,
      password: crypto.randomUUID(),
      role: 'admin',
    },
  })
})
afterAll(async () => {
  for (const id of photos) await payload.delete({ collection: 'galleryItems', id, context })
  if (albumID) await payload.delete({ collection: 'albums', id: albumID, context })
  for (const id of images) await payload.delete({ collection: 'media', id, context })
  await payload.delete({ collection: 'users', id: user.id, context })
  await payload.destroy()
})
it('publishes automatic collages, validates cover membership, and falls back when a selected photo leaves', async () => {
  for (let index = 0; index < 6; index++) {
    const data = await sharp({
      create: { width: 80, height: 50, channels: 3, background: `rgb(${index * 40},100,80)` },
    })
      .png()
      .toBuffer()
    const media = await payload.create({
      collection: 'media',
      context,
      data: { alt: `Cover fixture ${index}` },
      file: { data, name: `cover-${index}.png`, mimetype: 'image/png', size: data.length },
    })
    images.push(media.id)
  }
  const album = await payload.create({
    collection: 'albums',
    draft: true,
    context,
    user,
    data: { title: 'Automatic cover test', _status: 'draft' },
  })
  albumID = album.id
  for (let index = 0; index < 6; index++) {
    const photo = await payload.create({
      collection: 'galleryItems',
      context,
      data: {
        title: `Cover photo ${index}`,
        image: images[index],
        album: albumID,
        order: index,
        _status: index === 0 ? 'draft' : 'published',
      },
    })
    photos.push(photo.id)
  }
  const publish = (cover: number | null) =>
    payload.update({
      collection: 'albums',
      id: albumID,
      user,
      context,
      data: { cover, _status: 'published' },
    })
  const automatic = await publish(null)
  expect((await getAlbumCover(payload, automatic)).images.map((image) => image.id)).toEqual(
    images.slice(1, 5),
  )
  expect((await getAlbumCover(payload, automatic)).totalPhotos).toBe(5)
  await expect(publish(images[0])).rejects.toThrow('albumPhotos') // private draft cannot be a cover
  const selected = await publish(images[5]) // selected beyond the first four
  expect((await getAlbumCover(payload, selected)).images.map((image) => image.id)).toEqual([
    images[5],
  ])
  await payload.update({
    collection: 'galleryItems',
    id: photos[5],
    context,
    data: { album: null },
  })
  expect((await getAlbumCover(payload, selected)).images.map((image) => image.id)).toEqual(
    images.slice(1, 5),
  )
  await expect(publish(images[5])).rejects.toThrow('albumPhotos') // member of another placement
  await publish(null)
  await payload.update({ collection: 'galleryItems', id: photos[4], context, data: { order: -1 } })
  expect((await getAlbumCover(payload, automatic)).images.map((image) => image.id)).toEqual([
    images[4],
    ...images.slice(1, 4),
  ])
})
