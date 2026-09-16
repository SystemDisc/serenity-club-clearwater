import { createHash } from 'node:crypto'
import { createLocalReq, getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { PhotoBatch, PhotoBatchItem, User } from '@/payload-types'
import { beforeAll, afterAll, it, expect } from 'vitest'
import sharp from 'sharp'
import { batchAction, startBatch } from '../../src/photoBatches/service'
let payload: Payload
let user: User
const context = { disableRevalidate: true }
const batches: number[] = []
const albums: number[] = []
const images: number[] = []
type Snapshot = { batch: PhotoBatch; items: PhotoBatchItem[] }
const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' ? value?.id : value
const makeFile = async (color: string) => {
  const data = await sharp({ create: { width: 80, height: 50, channels: 3, background: color } })
    .png()
    .toBuffer()
  return {
    file: { name: `batch-${color.slice(1)}.png`, data, mimetype: 'image/png', size: data.length },
    hash: createHash('sha256').update(data).digest('hex'),
  }
}
async function call(data: Record<string, unknown>, id?: number): Promise<Snapshot> {
  const req = await createLocalReq(
    { user: { ...user, collection: 'users' }, context: { ...context } },
    payload,
  )
  req.json = async () => data
  req.routeParams = id ? { id: String(id) } : {}
  const response = await (id ? batchAction(req) : startBatch(req))
  const result = (await response.json()) as Snapshot
  if (!id) {
    batches.push(result.batch.id)
    if (idOf(result.batch.album)) albums.push(idOf(result.batch.album)!)
  }
  return result
}
const action = (state: Snapshot, data: Record<string, unknown>) =>
  call({ revision: state.batch.revision, ...data }, state.batch.id)
async function upload(
  state: Snapshot,
  item: PhotoBatchItem,
  source: Awaited<ReturnType<typeof makeFile>>,
) {
  const media = await payload.create({
    collection: 'media',
    user,
    overrideAccess: false,
    context,
    data: { uploadKey: item.key },
    file: source.file,
  })
  images.push(media.id)
  return action(state, { action: 'finish', item: item.id, media: media.id })
}
beforeAll(async () => {
  payload = await getPayload({ config })
  user = await payload.create({
    collection: 'users',
    context,
    data: {
      email: `batch-test-${Date.now()}@example.com`,
      password: crypto.randomUUID(),
      role: 'admin',
    },
  })
})
afterAll(async () => {
  for (const id of batches) {
    const items = await payload.find({
      collection: 'photoBatchItems',
      where: { batch: { equals: id } },
      limit: 0,
      depth: 0,
    })
    for (const item of items.docs) {
      await payload.delete({ collection: 'photoBatchItems', id: item.id, context })
      if (idOf(item.photo))
        await payload.delete({
          collection: 'galleryItems',
          id: idOf(item.photo)!,
          trash: true,
          context,
        })
    }
    await payload.delete({ collection: 'photoBatches', id, context })
  }
  for (const id of albums) await payload.delete({ collection: 'albums', id, user, context })
  for (const id of images) await payload.delete({ collection: 'media', id, context })
  await payload.delete({ collection: 'users', id: user.id, context })
  await payload.destroy()
})
it('resumes partial publication, detects duplicates, rejects stale edits and makes retries idempotent', async () => {
  const first = await makeFile('#4477ad')
  const second = await makeFile('#2b715a')
  let state = await call({ title: `Synthetic batch ${Date.now()}`, destination: 'new' })
  state = await action(state, {
    action: 'reserve',
    files: [
      { name: first.file.name, fingerprint: first.hash },
      { name: second.file.name, fingerprint: second.hash },
      { name: 'duplicate.png', fingerprint: first.hash },
    ],
  })
  expect(state.items).toHaveLength(2)
  await expect(
    payload.create({
      collection: 'media',
      user,
      overrideAccess: false,
      context,
      data: { uploadKey: state.items[0].key },
      file: second.file,
    }),
  ).rejects.toThrow('does not match')
  state = await upload(state, state.items[0], first)
  const stale = state
  state = await action(state, {
    action: 'edit',
    item: state.items[0].id,
    title: 'Reviewed photo',
    caption: 'Reviewed caption',
    alt: 'Synthetic color sample',
  })
  await expect(
    action(stale, { action: 'edit', item: stale.items[0].id, title: 'Lost edit' }),
  ).rejects.toThrow('another window')
  state = await action(state, {
    action: 'error',
    item: state.items[1].id,
    message: 'Synthetic interrupted upload',
  })
  await expect(action(state, { action: 'publish' })).rejects.toThrow('need attention')
  state = await action(state, { action: 'publish', allowPartial: true })
  expect(state.items.map((item) => item.status)).toEqual(['published', 'error'])
  expect(
    (
      await payload.find({
        collection: 'galleryItems',
        overrideAccess: false,
        where: { album: { equals: idOf(state.batch.album) } },
      })
    ).docs,
  ).toHaveLength(1)
  state = await upload(state, state.items[1], second)
  state = await action(state, { action: 'publish' })
  expect(state.batch.state).toBe('published')
  const again = await action(stale, { action: 'publish' })
  expect(again.items.map((item) => idOf(item.photo))).toEqual(
    state.items.map((item) => idOf(item.photo)),
  )
  const photos = await payload.find({
    collection: 'galleryItems',
    overrideAccess: false,
    where: { album: { equals: idOf(state.batch.album) } },
  })
  expect(photos.docs).toHaveLength(2)
  expect(photos.docs.find((photo) => photo.title === 'Reviewed photo')?.description).toBe(
    'Reviewed caption',
  )
})
it('rolls back an entire publication when a later photo has changed, and requires explicit review', async () => {
  let state = await call({ title: `Atomic batch ${Date.now()}`, destination: 'main' })
  state = await action(state, {
    action: 'reserve',
    files: images
      .slice(0, 2)
      .map((id) => ({ fingerprint: `media:${id}`, name: 'Existing library image' })),
  })
  expect(state.items.every((item) => item.status === 'ready')).toBe(true)
  const changed = state.items[1]
  await payload.update({
    collection: 'galleryItems',
    id: idOf(changed.photo)!,
    user,
    overrideAccess: false,
    draft: true,
    context,
    data: { description: 'Another editor changed this caption', _status: 'draft' },
  })
  await expect(action(state, { action: 'publish' })).rejects.toThrow('changed in its photo editor')
  expect(
    (
      await payload.find({
        collection: 'galleryItems',
        overrideAccess: false,
        where: { id: { in: state.items.map((item) => idOf(item.photo)) } },
      })
    ).docs,
  ).toHaveLength(0)
  state = await action(state, { action: 'acceptPhotoChanges', item: changed.id })
  state = await action(state, { action: 'publish' })
  expect(state.batch.state).toBe('published')
  expect(
    (
      await payload.findByID({
        collection: 'galleryItems',
        id: idOf(changed.photo)!,
        overrideAccess: false,
      })
    ).description,
  ).toBe('Another editor changed this caption')
})
it('denies anonymous batch reads and direct writes outside the authenticated workflow', async () => {
  await expect(
    payload.find({ collection: 'photoBatches', overrideAccess: false }),
  ).rejects.toThrow()
  await expect(
    payload.update({
      collection: 'photoBatches',
      id: batches[0],
      user,
      overrideAccess: false,
      data: { title: 'Bypass' },
    }),
  ).rejects.toThrow()
})
