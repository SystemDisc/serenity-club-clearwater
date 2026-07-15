import type { CollectionAfterChangeHook, Config, Plugin } from 'payload'

import type { Media } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { convertDocxViaService } from '@/utilities/docxToImage/convertDocxViaService'
import { isDocxMimeType } from '@/utilities/docxToImage/mime'

const skipDocxToImageContextKey = 'skipDocxToImageConversion'

type RequestContextWithDocxFlag = Record<string, unknown> & {
  [skipDocxToImageContextKey]?: boolean
}

const getRequestOrigin = (req: Parameters<CollectionAfterChangeHook<Media>>[0]['req']) => {
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || req.headers.get('host')

  if (host) {
    return `${forwardedProto || 'https'}://${host}`
  }

  if (typeof req.url === 'string') {
    try {
      return new URL(req.url).origin
    } catch {
      // Fall through to configured URL when Payload exposes a relative request URL.
    }
  }

  return getServerSideURL()
}

const resolveMediaUrl = (
  mediaUrl: string,
  req: Parameters<CollectionAfterChangeHook<Media>>[0]['req'],
) => {
  try {
    return new URL(mediaUrl).toString()
  } catch {
    return new URL(mediaUrl, `${getRequestOrigin(req).replace(/\/+$/, '')}/`).toString()
  }
}

const getMediaUrl = (doc: Media, req: Parameters<CollectionAfterChangeHook<Media>>[0]['req']) => {
  if (typeof doc.url === 'string' && doc.url) {
    return resolveMediaUrl(doc.url, req)
  }

  return null
}

const getFolderID = (folder: Media['folder']) => {
  if (typeof folder === 'object' && folder !== null) {
    return folder.id
  }

  return folder || undefined
}

const convertDocxMediaUpload: CollectionAfterChangeHook<Media> = async ({ doc, req }) => {
  const context = req.context as RequestContextWithDocxFlag

  if (context?.[skipDocxToImageContextKey]) {
    return doc
  }

  if (!isDocxMimeType(doc.mimeType)) {
    return doc
  }

  const docxUrl = getMediaUrl(doc, req)

  if (!docxUrl) {
    req.payload.logger.warn(`Skipping DOCX image conversion for media ${doc.id}: missing file URL.`)
    return doc
  }

  const image = await convertDocxViaService({
    docxUrl,
    filename: doc.filename,
    requestOrigin: getRequestOrigin(req),
  })

  if (!req.context) {
    req.context = {}
  }

  req.context[skipDocxToImageContextKey] = true

  try {
    const updatedDoc = await req.payload.update({
      id: doc.id,
      collection: 'media',
      data: {
        alt: doc.alt,
        caption: doc.caption,
        folder: getFolderID(doc.folder),
      },
      depth: 0,
      file: {
        data: image.buffer,
        mimetype: image.mimeType,
        name: image.filename,
        size: image.buffer.length,
      },
      overrideAccess: true,
      req,
    })

    req.payload.logger.info(`Converted DOCX media ${doc.id} to ${image.mimeType}.`)

    return updatedDoc as Media
  } finally {
    delete req.context[skipDocxToImageContextKey]
  }
}

export const docxToImagePlugin = (): Plugin => {
  return (config: Config): Config => {
    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (collection.slug !== 'media') {
          return collection
        }

        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: [...(collection.hooks?.afterChange || []), convertDocxMediaUpload],
          },
        }
      }),
    }
  }
}
