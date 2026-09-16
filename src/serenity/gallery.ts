import { unstable_cache } from 'next/cache'
import { getAlbumCover } from './getAlbumCover'
import { fallbackGalleryItems } from './content'
import { getPayloadClient, normalizeGalleryItem } from './data'

export const galleryPageSize = 24

export const getGalleryPage = unstable_cache(
  async (page: number) => {
    const payload = await getPayloadClient()
    if (!payload)
      return {
        albums: [],
        items: fallbackGalleryItems.slice((page - 1) * galleryPageSize, page * galleryPageSize),
        totalDocs: fallbackGalleryItems.length,
        totalPages: Math.max(1, Math.ceil(fallbackGalleryItems.length / galleryPageSize)),
      }
    const albums = await payload.find({
      collection: 'albums',
      page,
      limit: galleryPageSize,
      overrideAccess: false,
      draft: false,
      depth: 1,
      sort: ['order', '-date', 'id'],
      populate: { media: { url: true, sizes: true, filename: true, prefix: true, alt: true } },
    })
    const result = await payload.find({
      collection: 'galleryItems',
      where: { album: { exists: false } },
      page,
      limit: galleryPageSize,
      pagination: true,
      overrideAccess: false,
      draft: false,
      depth: 1,
      sort: ['order', 'id'],
      populate: { media: { url: true, filename: true, prefix: true, alt: true } },
    })
    return {
      albums: await Promise.all(
        albums.docs.map(async (album) => ({
          ...album,
          preview: await getAlbumCover(payload, album),
        })),
      ),
      items: result.docs.map((doc) =>
        normalizeGalleryItem(doc as unknown as Record<string, unknown>),
      ),
      totalDocs: result.totalDocs + albums.totalDocs,
      totalPages: Math.max(1, result.totalPages, albums.totalPages),
    }
  },
  ['public-gallery-page'],
  { revalidate: 300, tags: ['public-galleryItems', 'public-albums', 'public-media'] },
)

export const getAlbumPage = unstable_cache(
  async (slug: string, page: number) => {
    const payload = await getPayloadClient()
    if (!payload) return null
    const result = await payload.find({
      collection: 'albums',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      draft: false,
      overrideAccess: false,
    })
    const album = result.docs[0]
    if (!album) return null
    const photos = await payload.find({
      collection: 'galleryItems',
      where: { album: { equals: album.id } },
      page,
      limit: galleryPageSize,
      depth: 1,
      draft: false,
      overrideAccess: false,
      sort: ['order', 'id'],
    })
    return {
      album,
      items: photos.docs.map((doc) =>
        normalizeGalleryItem(doc as unknown as Record<string, unknown>),
      ),
      totalDocs: photos.totalDocs,
      totalPages: Math.max(1, photos.totalPages),
    }
  },
  ['public-album-page'],
  { revalidate: 300, tags: ['public-albums', 'public-galleryItems', 'public-media'] },
)
