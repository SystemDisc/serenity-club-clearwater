import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { APIError, type PayloadHandler } from 'payload'
import { convertDocxViaService } from '@/utilities/docxToImage/convertDocxViaService'
import { isLocalDatabase } from '@/utilities/databaseSafety'

/** The original upload is committed first, so conversion failure leaves it available for retry. */
export const convertSourceDocument: PayloadHandler = async (req) => {
  if (!req.user) throw new APIError('Sign in to convert a flyer.', 401)
  const id = Number(req.routeParams?.id)
  if (!Number.isSafeInteger(id) || id < 1) throw new APIError('Choose an original document.', 400)
  const source = await req.payload.findByID({
    collection: 'sourceDocuments',
    id,
    req,
    overrideAccess: false,
    depth: 0,
  })
  const existing = await req.payload.find({
    collection: 'media',
    where: { sourceDocument: { equals: id } },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: false,
  })
  if (existing.docs[0]) return Response.json({ image: existing.docs[0], reused: true })
  let image: { buffer: Buffer; filename: string; mimeType: string }
  if (process.env.DOCX_CONVERTER_MODE === 'local') {
    if (
      !isLocalDatabase(process.env.DATABASE_URL) ||
      process.env.VERCEL === '1' ||
      process.env.BLOB_READ_WRITE_TOKEN
    )
      throw new APIError(
        'Local document conversion is only available with isolated local storage and database.',
        500,
      )
    if (!source.filename || path.basename(source.filename) !== source.filename)
      throw new APIError('The original document filename is invalid.', 400)
    const { convertDocxBufferToImage } = await import('@/utilities/docxToImage/convertDocxToImage')
    try {
      image = await convertDocxBufferToImage(
        await readFile(path.resolve(process.cwd(), 'storage/source-documents', source.filename)),
        source.filename,
      )
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 422)
        throw new APIError(
          error instanceof Error ? error.message : 'Choose a one-page Word document.',
          422,
          undefined,
          true,
        )
      throw error
    }
  } else {
    if (!source.url)
      throw new APIError('The original document is missing its download address.', 400)
    image = await convertDocxViaService({
      docxUrl: source.url,
      filename: source.filename,
      requestOrigin: '',
    })
  }
  const media = await req.payload.create({
    collection: 'media',
    req,
    overrideAccess: false,
    context: { ...req.context, sourceConversion: true },
    data: { alt: '', sourceDocument: source.id },
    file: {
      data: image.buffer,
      name: image.filename,
      mimetype: image.mimeType,
      size: image.buffer.length,
    },
  })
  return Response.json({ image: media, reused: false })
}
