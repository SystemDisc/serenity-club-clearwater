import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import type { GalleryItem } from '@/payload-types'

export function supportedExternalImage(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      (url.hostname === 'static.wixstatic.com' ||
        url.hostname.endsWith('.public.blob.vercel-storage.com'))
    )
  } catch {
    return false
  }
}

export const validateGalleryImage: CollectionBeforeChangeHook<GalleryItem> = async ({
  data,
  originalDoc,
  req,
}) => {
  if ((data._status ?? originalDoc?._status) !== 'published') return data
  const image = data.image === undefined ? originalDoc?.image : data.image
  const external =
    data.externalImageUrl === undefined ? originalDoc?.externalImageUrl : data.externalImageUrl
  let message = 'Choose a photo before publishing. You can save an unfinished photo as a draft.'
  if (image) {
    const id = typeof image === 'object' ? image.id : image
    const media = await req.payload.findByID({
      collection: 'media',
      id,
      req,
      overrideAccess: false,
      depth: 0,
      disableErrors: true,
    })
    if (
      media &&
      /^image\/(jpeg|png|webp|avif|gif|tiff)$/.test(media.mimeType || '') &&
      media.width &&
      media.height &&
      media.filename &&
      media.url
    )
      return data
    message =
      'This file is not a ready photo. Choose a supported image with a working preview before publishing.'
  } else if (external && supportedExternalImage(external)) return data
  else if (external)
    message =
      'Use an HTTPS image from the club’s Blob library or existing Wix images, or upload the photo to the library.'
  throw new ValidationError({
    collection: 'galleryItems',
    req,
    errors: [{ path: image || !external ? 'image' : 'externalImageUrl', message }],
  })
}
