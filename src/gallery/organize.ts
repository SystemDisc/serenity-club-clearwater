import { APIError, type PayloadHandler, type PayloadRequest, type Where } from 'payload'
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { GalleryItem } from '@/payload-types'
const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' ? value?.id : value
function fail(message: string, status = 409): never {
  throw new APIError(message, status, undefined, true)
}
const destinationWhere = (album: number | null): Where =>
  album ? { album: { equals: album } } : { album: { exists: false } }

async function checkedPhoto(req: PayloadRequest, id: number, updatedAt: string) {
  const photo = await req.payload.findByID({
    collection: 'galleryItems',
    id,
    req,
    overrideAccess: false,
    draft: true,
    depth: 0,
  })
  if (photo.updatedAt !== updatedAt)
    fail(`“${photo.title}” changed in another editor. Reload the photos before continuing.`)
  const live = await req.payload.findByID({
    collection: 'galleryItems',
    id,
    req,
    overrideAccess: false,
    draft: false,
    depth: 0,
  })
  if (live._status === 'published' && photo._status !== 'published')
    fail(
      `“${photo.title}” has unpublished edits. Open its editor and publish or restore them before organizing it.`,
    )
  return photo
}

/** Changes placements only. Library files are never removed, replaced, or republished here. */
export const organizePhotos: PayloadHandler = async (req) => {
  if (!req.user) fail('Sign in to organize photos.', 401)
  const data = await req.json!()
  if (
    !['move', 'trash', 'reorder'].includes(data.action) ||
    !Array.isArray(data.photos) ||
    !data.photos.length ||
    data.photos.length > 100
  )
    fail('Select between 1 and 100 photos and choose an action.', 400)
  if (
    data.photos.some(
      (photo: { id?: number; updatedAt?: string }) =>
        !Number.isSafeInteger(photo.id) || !photo.updatedAt,
    ) ||
    new Set(data.photos.map((p: { id: number }) => p.id)).size !== data.photos.length
  )
    fail('Reload the selected photos before continuing.', 400)
  const previous = req.transactionID
  const tx = await req.payload.db.beginTransaction()
  if (!tx)
    fail('Photo organization needs a database transaction. Contact the website manager.', 503)
  req.transactionID = tx
  try {
    const db = req.payload.db as unknown as PostgresAdapter
    // Serialize this workspace; row locks also protect the snapshot checks against saved native edits.
    await db.sessions[tx].db.execute(sql`select pg_advisory_xact_lock(734921)`)
    for (const id of data.photos
      .map((p: { id: number }) => p.id)
      .sort((a: number, b: number) => a - b))
      await db.sessions[tx].db.execute(
        sql`select id from gallery_items where id = ${id} for update`,
      )
    const photos: GalleryItem[] = []
    for (const selected of data.photos)
      photos.push(await checkedPhoto(req, selected.id, selected.updatedAt))
    const update = (photo: GalleryItem, change: Partial<GalleryItem>) =>
      req.payload.update({
        collection: 'galleryItems',
        id: photo.id,
        req,
        overrideAccess: false,
        overrideLock: false,
        draft: photo._status !== 'published',
        data: { ...change, _status: photo._status },
      })
    if (data.action === 'move') {
      const album = data.album === null ? null : Number(data.album)
      if (album !== null && (!Number.isSafeInteger(album) || album < 1))
        fail('Choose a destination album or the main gallery.', 400)
      if (album)
        await req.payload.findByID({
          collection: 'albums',
          id: album,
          req,
          overrideAccess: false,
          draft: true,
          depth: 0,
        })
      const last = await req.payload.find({
        collection: 'galleryItems',
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
        where: destinationWhere(album),
        sort: '-order',
        limit: 1,
      })
      let order = (last.docs[0]?.order ?? -1) + 1
      for (const photo of photos)
        if ((idOf(photo.album) || null) !== album) await update(photo, { album, order: order++ })
    } else if (data.action === 'trash') {
      for (const photo of photos) await update(photo, { deletedAt: new Date().toISOString() })
    } else {
      // Reorder the displayed page using its existing slots; other pages keep their order.
      const album = idOf(photos[0].album) || null
      if (photos.some((photo) => (idOf(photo.album) || null) !== album))
        fail('Choose photos from one album or the main gallery.', 400)
      if (
        !Array.isArray(data.ids) ||
        data.ids.length !== photos.length ||
        new Set(data.ids).size !== photos.length ||
        data.ids.some((id: number) => !photos.some((photo) => photo.id === id))
      )
        fail('Reload this page before changing its order.', 400)
      const ordered = [...photos].sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.id - b.id)
      const slots = ordered.map((photo) => photo.order ?? 100)
      const adjacentTies = await req.payload.find({
        collection: 'galleryItems',
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
        limit: 1,
        where: {
          and: [
            destinationWhere(album),
            { id: { not_in: data.ids } },
            {
              or: [
                { order: { in: slots } },
                ...(slots.includes(100) ? [{ order: { exists: false } }] : []),
              ],
            },
          ],
        },
      })
      if (new Set(slots).size !== photos.length || adjacentTies.totalDocs) {
        // Older imports can share a numeric position. Preserve their established order while
        // giving the requested page distinct slots. Bound work so a large archive cannot time out.
        const all = await req.payload.find({
          collection: 'galleryItems',
          req,
          overrideAccess: false,
          draft: true,
          depth: 0,
          where: destinationWhere(album),
          sort: ['order', 'id'],
          limit: 1001,
        })
        if (all.totalDocs > 1000)
          fail(
            'This album needs its older photo positions updated by the website manager before reordering. Moving photos is still available.',
          )
        const selected = new Set(photos.map((photo) => photo.id))
        let index = 0
        const reordered = all.docs.map((photo) => {
          if (!selected.has(photo.id)) return photo
          const nextID = data.ids[index++]
          return photos.find((item) => item.id === nextID)!
        })
        for (const [position, photo] of reordered.entries()) {
          if (photo.order === position) continue
          await db.sessions[tx].db.execute(
            sql`select id from gallery_items where id = ${photo.id} for update`,
          )
          const current = await checkedPhoto(req, photo.id, photo.updatedAt)
          await update(current, { order: position })
        }
      } else {
        for (const [index, id] of data.ids.entries()) {
          const photo = photos.find((photo) => photo.id === id)!
          if (photo.order !== ordered[index].order)
            await update(photo, { order: ordered[index].order })
        }
      }
    }
    await req.payload.db.commitTransaction(tx)
    return Response.json({
      message:
        data.action === 'trash'
          ? 'Photos moved to Trash. Their library files are retained.'
          : data.action === 'move'
            ? 'Photos moved. Published photos keep their publication state; a draft album hides its photos.'
            : 'Photo order saved.',
    })
  } catch (error) {
    await req.payload.db.rollbackTransaction(tx)
    throw error
  } finally {
    req.transactionID = previous
  }
}
