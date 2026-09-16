import type { GalleryItem, Media } from '@/payload-types'

export type AlbumCoverImage = { id: number; src: string }

export function albumCoverImages(photos: Pick<GalleryItem, 'image'>[]): AlbumCoverImage[] {
  const seen = new Set<number>()
  return photos
    .flatMap(({ image }) => {
      if (!image || typeof image !== 'object' || !image.url || seen.has(image.id)) return []
      seen.add(image.id)
      return [{ id: image.id, src: albumImageURL(image) }]
    })
    .slice(0, 4)
}

export function albumImageURL(image: Media): string {
  return image.sizes?.medium?.url || image.sizes?.small?.url || image.url || ''
}
