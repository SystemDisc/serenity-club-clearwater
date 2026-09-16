import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'
import { put, list, del } from '@vercel/blob'
import sharp from 'sharp'
import { isLocalDatabase } from '../src/utilities/databaseSafety'

// This opt-in smoke test uses a disposable DB and temporary, uniquely named Blob objects.
// It is separate from routine tests, which must never write to remote storage.
if (
  !isLocalDatabase(process.env.DATABASE_URL) ||
  !new URL(process.env.DATABASE_URL!).pathname.endsWith('_test') ||
  process.env.ALLOW_TEST_BLOB_WRITES !== 'true' ||
  !process.env.BLOB_READ_WRITE_TOKEN
) {
  throw new Error(
    'Requires a loopback *_test database, Blob token, and ALLOW_TEST_BLOB_WRITES=true',
  )
}
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const prefix = `storage-regression-${Date.now()}-`
const ids: number[] = []
let checked = 0
async function verify(id: number, width: number, height: number) {
  const doc = await payload.findByID({ collection: 'media', id, depth: 0 })
  if (doc.width !== width || doc.height !== height) throw new Error('Original dimensions changed')
  const files = [
    { filename: doc.filename, url: doc.url },
    ...Object.values(doc.sizes || {}).filter((size) => size?.filename),
  ]
  if (new Set(files.map((file) => file.filename)).size !== files.length)
    throw new Error('A derivative overwrote an original or another size')
  for (const file of files) {
    const response = await fetch(file.url!, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) throw new Error(`Stored ${file.filename} returned ${response.status}`)
    const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    if (!meta.width || !meta.height) throw new Error('Invalid image data')
    checked++
  }
  return doc
}
try {
  const buffer = await sharp(randomBytes(1600 * 1200 * 3), {
    raw: { width: 1600, height: 1200, channels: 3 },
  })
    .png()
    .toBuffer()
  const filename = `${prefix}same-name.png`
  const client = await put(filename, buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'image/png',
  })
  const documents = await Promise.all(
    [false, true].map(async (clientUploaded) => {
      const file = {
        data: buffer,
        name: clientUploaded ? client.pathname : filename,
        size: buffer.length,
        mimetype: 'image/png',
        ...(clientUploaded ? { clientUploadContext: {} } : {}),
      }
      const doc = await payload.create({
        collection: 'media',
        data: { alt: 'Disposable storage regression image' },
        file,
        context: { disableRevalidate: true },
      })
      ids.push(doc.id)
      return verify(doc.id, 1600, 1200)
    }),
  )
  if (documents[0].filename === documents[1].filename)
    throw new Error('Repeated original names collided')
  if (documents[1].filename !== client.pathname)
    throw new Error('Client original filename was overwritten')
  const portrait = await sharp({
    create: { width: 700, height: 1100, channels: 3, background: '#17633a' },
  })
    .jpeg()
    .toBuffer()
  await payload.update({
    collection: 'media',
    id: ids[0],
    data: {},
    file: {
      data: portrait,
      name: `${prefix}portrait.jpg`,
      size: portrait.length,
      mimetype: 'image/jpeg',
    },
    context: { disableRevalidate: true },
  })
  await verify(ids[0], 700, 1100)
  await payload.update({
    collection: 'media',
    id: ids[0],
    data: { focalX: 30, focalY: 40 },
    context: { disableRevalidate: true },
  })
  await verify(ids[0], 700, 1100)
  const small = await sharp({
    create: { width: 20, height: 20, channels: 3, background: '#e9c445' },
  })
    .webp()
    .toBuffer()
  const tiny = await payload.create({
    collection: 'media',
    data: {},
    file: { data: small, name: `${prefix}tiny.webp`, size: small.length, mimetype: 'image/webp' },
    context: { disableRevalidate: true },
  })
  ids.push(tiny.id)
  const tinyDoc = await verify(tiny.id, 20, 20)
  if (tinyDoc.thumbnailURL !== tinyDoc.url)
    throw new Error('Small image thumbnail did not fall back to its original')
  console.log(
    JSON.stringify({
      verified: true,
      checkedImageURLs: checked,
      originalBytes: buffer.length,
      cases: [
        'concurrent duplicate names',
        'client original above 4.5 MB',
        'server upload',
        'replace',
        'focal point',
        'small-image fallback',
        'JPEG PNG WebP',
      ],
    }),
  )
} finally {
  for (const id of ids)
    await payload.delete({ collection: 'media', id, context: { disableRevalidate: true } })
  const leftovers = await list({ prefix, limit: 1000 })
  // Only this invocation's uniquely named synthetic objects are eligible for cleanup.
  if (leftovers.blobs.length) await del(leftovers.blobs.map((blob) => blob.url))
  const remaining = await list({ prefix, limit: 1000 })
  if (remaining.blobs.length) throw new Error('Storage test cleanup is incomplete')
  console.log('Temporary media records and Blob objects cleaned up')
  await payload.destroy()
}
process.exit(0)
