import type { Payload } from 'payload'
import type { Album } from '@/payload-types'
import { albumCoverImages } from './albumCover'

/** Read only published, accessible members, including when a saved cover was moved or hidden. */
export async function getAlbumCover(payload: Payload, album: Album) {
  const photos = await payload.find({
    collection: 'galleryItems',
    where: { album: { equals: album.id } },
    limit: 4,
    depth: 1,
    draft: false,
    overrideAccess: false,
    sort: ['order', 'id'],
    select: { image: true },
    populate: { media: { url: true, sizes: true, filename: true, prefix: true } },
  })
  const images = albumCoverImages(photos.docs)
  const coverID = typeof album.cover === 'object' ? album.cover?.id : album.cover
  if (coverID) {
    const selected = images.find((image) => image.id === coverID)
    if (selected) return { images: [selected], totalPhotos: photos.totalDocs }
    const member = await payload.find({
      collection: 'galleryItems',
      where: { and: [{ album: { equals: album.id } }, { image: { equals: coverID } }] },
      limit: 1,
      depth: 1,
      draft: false,
      overrideAccess: false,
      select: { image: true },
      populate: { media: { url: true, sizes: true, filename: true, prefix: true } },
    })
    const selectedImages = albumCoverImages(member.docs)
    if (selectedImages.length) return { images: selectedImages, totalPhotos: photos.totalDocs }
  }
  return { images, totalPhotos: photos.totalDocs }
}
