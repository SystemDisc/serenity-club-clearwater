import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import {
  APIError,
  type CollectionBeforeOperationHook,
  type CollectionBeforeChangeHook,
} from 'payload'
import { MAX_PHOTO_BYTES, MAX_PHOTO_PIXELS, PHOTO_TYPES } from './limits'

/** Read original bytes before Payload resizes; client upload bytes may be in its managed temp file. */
export const inspectBatchUpload: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (!['create', 'update'].includes(operation) || !req.file) return args
  const key = 'data' in args ? (args.data as Record<string, unknown>)?.uploadKey : undefined
  const file = req.file
  // Hash ordinary images too so future batches can recognize existing originals.
  if (!key && !PHOTO_TYPES.includes(file.mimetype)) return args
  const size = file.tempFilePath ? (await stat(file.tempFilePath)).size : file.data.length
  if (size > MAX_PHOTO_BYTES)
    throw new APIError('Choose an image no larger than 30 MB.', 400, undefined, true)
  const bytes = file.tempFilePath ? await readFile(file.tempFilePath) : file.data
  const hash = createHash('sha256').update(bytes).digest('hex')
  if (key) {
    if (!req.user) throw new APIError('Sign in to resume this upload.', 401)
    const result = await req.payload.find({
      collection: 'photoBatchItems',
      req,
      overrideAccess: false,
      where: { key: { equals: key } },
      limit: 1,
      depth: 0,
    })
    const item = result.docs[0]
    if (!item || item.fingerprint !== hash || ['published', 'excluded'].includes(item.status))
      throw new APIError(
        'This file does not match the saved batch item. Reopen the batch and choose the original file.',
        400,
        undefined,
        true,
      )
    const metadata = await sharp(bytes, { limitInputPixels: MAX_PHOTO_PIXELS })
      .metadata()
      .catch(() => null)
    if (
      !metadata?.width ||
      !metadata.height ||
      !['jpeg', 'png', 'webp', 'avif', 'heif', 'gif'].includes(metadata.format || '') ||
      !PHOTO_TYPES.includes(file.mimetype) ||
      (metadata.format === 'heif' && metadata.compression !== 'av1')
    )
      throw new APIError(
        'Choose a JPEG, PNG, WebP, AVIF, or GIF image up to 50 megapixels. Export HEIC photos as JPEG first.',
        400,
        undefined,
        true,
      )
    req.context.batchUpload = true
  }
  req.context.mediaContentHash = hash
  return args
}
export const saveContentHash: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.context.mediaContentHash) data.contentHash = req.context.mediaContentHash
  return data
}
