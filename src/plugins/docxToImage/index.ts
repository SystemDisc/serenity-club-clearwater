import type { CollectionAfterChangeHook, Config, Plugin } from 'payload'

import type { Media } from '@/payload-types'
import { convertDocxUrlToImage, isDocxMimeType } from '@/utilities/docxToImage/convertDocxToImage'

const skipDocxToImageContextKey = 'skipDocxToImageConversion'

type RequestContextWithDocxFlag = Record<string, unknown> & {
  [skipDocxToImageContextKey]?: boolean
}

const getMediaUrl = (doc: Media) => {
  if (typeof doc.url === 'string' && doc.url) {
    return doc.url
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

  const docxUrl = getMediaUrl(doc)

  if (!docxUrl) {
    req.payload.logger.warn(`Skipping DOCX image conversion for media ${doc.id}: missing file URL.`)
    return doc
  }

  const image = await convertDocxUrlToImage(docxUrl, doc.filename)

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
