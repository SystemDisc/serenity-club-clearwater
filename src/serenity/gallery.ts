import { unstable_cache } from 'next/cache'
import { fallbackGalleryItems } from './content'
import { getPayloadClient, normalizeGalleryItem } from './data'

export const galleryPageSize = 24

export const getGalleryPage = unstable_cache(
  async (page: number) => {
    const payload = await getPayloadClient()
    if (!payload)
      return {
        items: fallbackGalleryItems.slice((page - 1) * galleryPageSize, page * galleryPageSize),
        totalDocs: fallbackGalleryItems.length,
        totalPages: Math.max(1, Math.ceil(fallbackGalleryItems.length / galleryPageSize)),
      }
    const result = await payload.find({
      collection: 'galleryItems',
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
      items: result.docs.map((doc) =>
        normalizeGalleryItem(doc as unknown as Record<string, unknown>),
      ),
      totalDocs: result.totalDocs,
      totalPages: Math.max(1, result.totalPages),
    }
  },
  ['public-gallery-page'],
  { revalidate: 300, tags: ['public-galleryItems', 'public-media'] },
)
