import { randomUUID } from 'node:crypto'
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { APIError, type PayloadHandler, type PayloadRequest } from 'payload'
import type { PhotoBatch, PhotoBatchItem } from '@/payload-types'
import { validDateKey } from '@/serenity/calendar'
import { MAX_BATCH_PHOTOS, PHOTO_TYPES } from './limits'

const fail = (message: string, status = 400): never => {
  throw new APIError(message, status, undefined, true)
}
const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' ? value?.id : value
const text = (value: unknown, limit = 500) =>
  typeof value === 'string' ? value.trim().slice(0, limit) : ''

/** Serialize a batch's edits in one database transaction; all editorial writes still use Payload hooks/access. */
async function transaction<T>(
  req: PayloadRequest,
  batchID: number | undefined,
  action: () => Promise<T>,
): Promise<T> {
  if (!req.user) fail('Sign in to manage photos.', 401)
  const previous = req.transactionID
  const previousContext = req.context
  const tx = await req.payload.db.beginTransaction()
  if (!tx)
    throw new APIError(
      'Photo batches require database transactions. Contact the website manager.',
      503,
    )
  req.transactionID = tx
  req.context = { ...previousContext, photoBatchAction: true }
  try {
    if (batchID) {
      const db = req.payload.db as unknown as PostgresAdapter
      await db.sessions[tx].db.execute(
        sql`select id from photo_batches where id = ${batchID} for update`,
      )
    }
    const result = await action()
    await req.payload.db.commitTransaction(tx)
    return result
  } catch (error) {
    await req.payload.db.rollbackTransaction(tx)
    throw error
  } finally {
    req.transactionID = previous
    req.context = previousContext
  }
}

export async function batchSnapshot(req: PayloadRequest, id: number) {
  const batch = await req.payload.findByID({
    collection: 'photoBatches',
    id,
    req,
    overrideAccess: false,
    depth: 1,
  })
  const items = await req.payload.find({
    collection: 'photoBatchItems',
    req,
    overrideAccess: false,
    where: { batch: { equals: id } },
    limit: MAX_BATCH_PHOTOS,
    sort: ['position', 'id'],
    depth: 1,
  })
  if (idOf(batch.album))
    batch.album = await req.payload.findByID({
      collection: 'albums',
      id: idOf(batch.album)!,
      req,
      overrideAccess: false,
      draft: true,
      depth: 1,
    })
  const photoIDs = items.docs.flatMap((item) => (idOf(item.photo) ? [idOf(item.photo)!] : []))
  if (photoIDs.length) {
    const photos = await req.payload.find({
      collection: 'galleryItems',
      req,
      overrideAccess: false,
      draft: true,
      depth: 1,
      where: { id: { in: photoIDs } },
      limit: MAX_BATCH_PHOTOS,
    })
    const byID = new Map(photos.docs.map((photo) => [photo.id, photo]))
    for (const item of items.docs) item.photo = byID.get(idOf(item.photo)!) || item.photo
  }
  return { batch, items: items.docs }
}

export const startBatch: PayloadHandler = async (req) => {
  if (!req.user) fail('Sign in to add photos.', 401)
  const data = await req.json!()
  const title = text(data.title, 160)
  if (!title) fail('Give these photos a short shared name, such as September picnic.')
  if (data.date && !validDateKey(data.date)) fail('Choose a valid date or leave it empty.')
  if (!['main', 'existing', 'new'].includes(data.destination))
    fail('Choose where the photos should appear.')
  const result = await transaction(req, undefined, async () => {
    let album: number | undefined
    let albumRevision: string | undefined
    if (data.destination === 'new') {
      const created = await req.payload.create({
        collection: 'albums',
        req,
        overrideAccess: false,
        draft: true,
        data: { title, date: data.date || null, _status: 'draft' },
      })
      album = created.id
      albumRevision = created.updatedAt
    }
    if (data.destination === 'existing') {
      const selected = await req.payload.findByID({
        collection: 'albums',
        id: Number(data.album),
        req,
        overrideAccess: false,
        depth: 0,
        draft: true,
      })
      album = selected.id
      albumRevision = selected.updatedAt
    }
    const batch = await req.payload.create({
      collection: 'photoBatches',
      req,
      overrideAccess: false,
      data: {
        title,
        date: data.date || null,
        album,
        albumRevision,
        createdBy: req.user!.id,
        revision: 0,
        state: 'reviewing',
      },
    })
    return batchSnapshot(req, batch.id)
  })
  return Response.json(result, { status: 201 })
}

async function finishItem(
  req: PayloadRequest,
  batch: PhotoBatch,
  item: PhotoBatchItem,
  mediaID: number,
) {
  const media = await req.payload.findByID({
    collection: 'media',
    id: mediaID,
    req,
    overrideAccess: false,
    depth: 0,
  })
  if (!media.width || !media.height || !media.url || !PHOTO_TYPES.includes(media.mimeType || ''))
    fail('This image is not ready. Choose a supported image with a working preview.')
  if (item.fingerprint !== `media:${media.id}` && item.fingerprint !== media.contentHash)
    fail('This image does not match the selected file. Reselect the original file.')
  let photoID = idOf(item.photo)
  if (!photoID) {
    const existing = await req.payload.find({
      collection: 'galleryItems',
      req,
      overrideAccess: false,
      draft: true,
      depth: 0,
      limit: 1,
      where: { importKey: { equals: item.key } },
    })
    photoID = existing.docs[0]?.id
  }
  if (!photoID)
    photoID = (
      await req.payload.create({
        collection: 'galleryItems',
        req,
        overrideAccess: false,
        draft: true,
        data: {
          title: item.title,
          description: item.caption,
          imageAlt: item.alt,
          image: media.id,
          album: idOf(batch.album),
          takenOn: batch.date,
          order: item.position,
          importKey: item.key,
          _status: 'draft',
        },
      })
    ).id
  const savedPhoto = await req.payload.findByID({
    collection: 'galleryItems',
    id: photoID,
    req,
    overrideAccess: false,
    draft: true,
    depth: 0,
  })
  return req.payload.update({
    collection: 'photoBatchItems',
    id: item.id,
    req,
    overrideAccess: false,
    data: {
      media: media.id,
      photo: photoID,
      photoRevision: savedPhoto.updatedAt,
      status: 'ready',
      error: null,
      receipt: null,
    },
  })
}

export const batchAction: PayloadHandler = async (req) => {
  if (!req.user) fail('Sign in to continue this photo batch.', 401)
  const id = Number(req.routeParams?.id)
  if (!Number.isSafeInteger(id) || id < 1) fail('Choose a saved photo batch.')
  const data = await req.json!()
  const result = await transaction(req, id, async () => {
    const batch = await req.payload.findByID({
      collection: 'photoBatches',
      id,
      req,
      overrideAccess: false,
      depth: 0,
    })
    const items = (
      await req.payload.find({
        collection: 'photoBatchItems',
        req,
        overrideAccess: false,
        where: { batch: { equals: id } },
        limit: MAX_BATCH_PHOTOS,
        sort: ['position', 'id'],
        depth: 0,
      })
    ).docs
    if (data.action === 'read' || (batch.state === 'published' && data.action === 'publish'))
      return batchSnapshot(req, id)
    if (batch.state === 'published')
      fail('This batch has been published. Open its photos or album to make further changes.', 409)
    if (
      [
        'reserve',
        'edit',
        'reorder',
        'cover',
        'exclude',
        'publish',
        'acceptAlbumChanges',
        'acceptPhotoChanges',
      ].includes(data.action) &&
      data.revision !== batch.revision
    )
      fail(
        'This batch changed in another window. Reload it before continuing; your saved uploads are safe.',
        409,
      )
    const item = items.find((candidate) => candidate.id === Number(data.item))
    if (
      ['receipt', 'finish', 'error', 'edit', 'exclude', 'cover', 'acceptPhotoChanges'].includes(
        data.action,
      ) &&
      !item
    )
      fail('Choose a photo from this batch.')
    if (item?.status === 'excluded') fail('This photo was excluded from the batch.', 409)
    if (item?.status === 'published' && !['cover', 'finish'].includes(data.action))
      fail('This photo is already published. Open its editor to change it.', 409)
    const currentPhoto = async (entry: PhotoBatchItem) => {
      const photo = await req.payload.findByID({
        collection: 'galleryItems',
        id: idOf(entry.photo)!,
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
      })
      if (photo.updatedAt !== entry.photoRevision)
        fail(
          `“${entry.title}” changed in its photo editor. Review the saved edits before publishing this batch.`,
          409,
        )
      return photo
    }
    if (item && idOf(item.photo) && ['edit', 'exclude'].includes(data.action))
      await currentPhoto(item)
    if (data.action === 'reserve') {
      if (!Array.isArray(data.files) || data.files.length > MAX_BATCH_PHOTOS)
        fail('Choose up to 100 photos per batch.')
      const lastPhoto = await req.payload.find({
        collection: 'galleryItems',
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
        where: idOf(batch.album)
          ? { album: { equals: idOf(batch.album) } }
          : { album: { exists: false } },
        sort: '-order',
        limit: 1,
      })
      let position =
        Math.max(-1, ...items.map((entry) => entry.position), lastPhoto.docs[0]?.order ?? -1) + 1
      const mediaIDs = new Set(
        items.flatMap((entry) => (idOf(entry.media) ? [idOf(entry.media)!] : [])),
      )
      const fingerprints = new Set(items.map((entry) => entry.fingerprint))
      for (const file of data.files) {
        const fingerprint = text(file.fingerprint, 80)
        if (!/^(?:[a-f0-9]{64}|media:\d+)$/.test(fingerprint))
          fail('A selected file could not be identified. Choose it again.')
        if (fingerprints.has(fingerprint)) continue
        if (fingerprints.size >= MAX_BATCH_PHOTOS)
          fail('This batch already has 100 photos. Start another batch for the rest.')
        const existing = await req.payload.find({
          collection: 'media',
          req,
          overrideAccess: false,
          depth: 0,
          limit: 1,
          where: fingerprint.startsWith('media:')
            ? { id: { equals: Number(fingerprint.slice(6)) } }
            : { contentHash: { equals: fingerprint } },
        })
        if (existing.docs[0] && mediaIDs.has(existing.docs[0].id)) continue
        fingerprints.add(fingerprint)
        const created = await req.payload.create({
          collection: 'photoBatchItems',
          req,
          overrideAccess: false,
          data: {
            batch: id,
            key: randomUUID(),
            fingerprint,
            filename: text(file.name, 240) || 'Library photo',
            title: `${batch.title} — ${fingerprints.size}`,
            position: position++,
            status: 'pending',
          },
        })
        if (existing.docs[0]) {
          await finishItem(req, batch, created, existing.docs[0].id)
          mediaIDs.add(existing.docs[0].id)
        }
      }
    } else if (data.action === 'receipt') {
      if (item!.status === 'published' || item!.status === 'excluded')
        fail('This photo no longer needs an upload.')
      const receipt = data.receipt
      if (
        !receipt ||
        receipt.collectionSlug !== 'media' ||
        typeof receipt.filename !== 'string' ||
        receipt.filename.includes('/') ||
        receipt.filename.includes('\\') ||
        !PHOTO_TYPES.includes(receipt.mimeType) ||
        typeof receipt.size !== 'number' ||
        receipt.size <= 0 ||
        receipt.size > 30 * 1024 * 1024 ||
        !receipt.clientUploadContext ||
        typeof receipt.clientUploadContext !== 'object'
      )
        fail('The upload receipt is invalid. Reselect the original photo.')
      await req.payload.update({
        collection: 'photoBatchItems',
        id: item!.id,
        req,
        overrideAccess: false,
        data: { receipt, status: 'pending', error: null },
      })
    } else if (data.action === 'finish') {
      if (!['ready', 'published'].includes(item!.status))
        await finishItem(req, batch, item!, Number(data.media))
    } else if (data.action === 'error') {
      if (item!.status !== 'ready')
        await req.payload.update({
          collection: 'photoBatchItems',
          id: item!.id,
          req,
          overrideAccess: false,
          data: {
            status: 'error',
            error: text(data.message) || 'The upload did not finish. Try this photo again.',
          },
        })
    } else if (data.action === 'edit') {
      const title = text(data.title, 200) || item!.title
      const caption = text(data.caption, 2000)
      const alt = text(data.alt, 1000)
      await req.payload.update({
        collection: 'photoBatchItems',
        id: item!.id,
        req,
        overrideAccess: false,
        data: { title, caption, alt },
      })
      if (idOf(item!.photo))
        await req.payload.update({
          collection: 'galleryItems',
          id: idOf(item!.photo)!,
          req,
          overrideAccess: false,
          draft: true,
          data: { title, description: caption, imageAlt: alt, _status: 'draft' },
        })
      if (idOf(item!.photo)) {
        const photo = await req.payload.findByID({
          collection: 'galleryItems',
          id: idOf(item!.photo)!,
          req,
          overrideAccess: false,
          draft: true,
          depth: 0,
        })
        await req.payload.update({
          collection: 'photoBatchItems',
          id: item!.id,
          req,
          overrideAccess: false,
          data: { photoRevision: photo.updatedAt },
        })
      }
    } else if (data.action === 'exclude') {
      await req.payload.update({
        collection: 'photoBatchItems',
        id: item!.id,
        req,
        overrideAccess: false,
        data: { status: 'excluded', receipt: null },
      })
      if (idOf(item!.photo))
        await req.payload.update({
          collection: 'galleryItems',
          id: idOf(item!.photo)!,
          req,
          overrideAccess: false,
          data: { deletedAt: new Date().toISOString() },
        })
      if (idOf(batch.cover) === idOf(item!.media))
        await req.payload.update({
          collection: 'photoBatches',
          id,
          req,
          overrideAccess: false,
          data: { cover: null },
        })
    } else if (data.action === 'cover') {
      if (!idOf(batch.album) || !['ready', 'published'].includes(item!.status))
        fail('Choose a ready photo for an album cover.')
      await req.payload.update({
        collection: 'photoBatches',
        id,
        req,
        overrideAccess: false,
        data: { cover: idOf(item!.media) },
      })
    } else if (data.action === 'reorder') {
      if (
        !Array.isArray(data.ids) ||
        data.ids.length !== items.length ||
        new Set(data.ids).size !== items.length ||
        data.ids.some((value: unknown) => !items.some((entry) => entry.id === value))
      )
        fail('Reload the batch before changing its order.', 409)
      const firstPosition = Math.min(...items.map((entry) => entry.position))
      for (const [offset, itemID] of data.ids.entries()) {
        const position = firstPosition + offset
        const entry = items.find((value) => value.id === itemID)!
        if (['published', 'excluded'].includes(entry.status)) continue
        if (idOf(entry.photo)) await currentPhoto(entry)
        await req.payload.update({
          collection: 'photoBatchItems',
          id: itemID,
          req,
          overrideAccess: false,
          data: { position },
        })
        if (idOf(entry.photo))
          await req.payload.update({
            collection: 'galleryItems',
            id: idOf(entry.photo)!,
            req,
            overrideAccess: false,
            draft: true,
            data: { order: position, _status: 'draft' },
          })
      }
      for (const entry of items)
        if (!['published', 'excluded'].includes(entry.status) && idOf(entry.photo)) {
          const photo = await req.payload.findByID({
            collection: 'galleryItems',
            id: idOf(entry.photo)!,
            req,
            overrideAccess: false,
            draft: true,
            depth: 0,
          })
          await req.payload.update({
            collection: 'photoBatchItems',
            id: entry.id,
            req,
            overrideAccess: false,
            data: { photoRevision: photo.updatedAt },
          })
        }
    } else if (data.action === 'acceptAlbumChanges') {
      if (!idOf(batch.album)) fail('This batch has no album.')
      const album = await req.payload.findByID({
        collection: 'albums',
        id: idOf(batch.album)!,
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
      })
      await req.payload.update({
        collection: 'photoBatches',
        id,
        req,
        overrideAccess: false,
        data: { albumRevision: album.updatedAt },
      })
    } else if (data.action === 'acceptPhotoChanges') {
      if (!idOf(item!.photo)) fail('This photo has no saved editor record yet.')
      const photo = await req.payload.findByID({
        collection: 'galleryItems',
        id: idOf(item!.photo)!,
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
      })
      if (idOf(photo.album) !== idOf(batch.album))
        fail('The photo was moved to another destination. Finish it in its photo editor.', 409)
      await req.payload.update({
        collection: 'photoBatchItems',
        id: item!.id,
        req,
        overrideAccess: false,
        data: {
          title: photo.title,
          caption: photo.description,
          alt: photo.imageAlt,
          media: idOf(photo.image),
          photoRevision: photo.updatedAt,
          status: photo._status === 'published' ? 'published' : 'ready',
        },
      })
    } else if (data.action === 'publish') {
      const ready = items.filter((entry) => entry.status === 'ready')
      const unresolved = items.filter((entry) => ['pending', 'error'].includes(entry.status))
      if (
        !ready.length &&
        (unresolved.length || !items.some((entry) => entry.status === 'published'))
      )
        fail('No ready photos are waiting to be published.')
      if (unresolved.length && data.allowPartial !== true)
        fail(
          `${unresolved.length} photos need attention. Fix them, exclude them, or explicitly publish only the ready photos.`,
          409,
        )
      if (idOf(batch.album)) {
        const album = await req.payload.findByID({
          collection: 'albums',
          id: idOf(batch.album)!,
          req,
          overrideAccess: false,
          draft: true,
          depth: 0,
        })
        if (album.updatedAt !== batch.albumRevision)
          fail(
            'The album has changed since this batch started. Review its saved details before publishing.',
            409,
          )
      }
      for (const entry of ready) {
        if (!idOf(entry.photo)) fail('A ready photo is missing its draft. Reopen the batch.', 409)
        await currentPhoto(entry)
        await req.payload.update({
          collection: 'galleryItems',
          id: idOf(entry.photo)!,
          req,
          overrideAccess: false,
          draft: false,
          data: { _status: 'published' },
        })
        await req.payload.update({
          collection: 'photoBatchItems',
          id: entry.id,
          req,
          overrideAccess: false,
          data: { status: 'published' },
        })
      }
      if (idOf(batch.album)) {
        const album = await req.payload.findByID({
          collection: 'albums',
          id: idOf(batch.album)!,
          req,
          overrideAccess: false,
          draft: true,
          depth: 0,
        })
        await req.payload.update({
          collection: 'albums',
          id: album.id,
          req,
          overrideAccess: false,
          data: {
            _status: 'published',
            cover: idOf(batch.cover) || idOf(album.cover) || idOf(ready[0]?.media),
          },
        })
      }
      if (idOf(batch.album)) {
        const album = await req.payload.findByID({
          collection: 'albums',
          id: idOf(batch.album)!,
          req,
          overrideAccess: false,
          depth: 0,
        })
        await req.payload.update({
          collection: 'photoBatches',
          id,
          req,
          overrideAccess: false,
          data: { albumRevision: album.updatedAt },
        })
      }
      if (!unresolved.length)
        await req.payload.update({
          collection: 'photoBatches',
          id,
          req,
          overrideAccess: false,
          data: { state: 'published' },
        })
    } else fail('Choose a supported batch action.')
    await req.payload.update({
      collection: 'photoBatches',
      id,
      req,
      overrideAccess: false,
      data: { revision: batch.revision + 1 },
    })
    return batchSnapshot(req, id)
  })
  return Response.json(result)
}
