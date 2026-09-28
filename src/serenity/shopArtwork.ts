import type { Product } from './content'

const legacyArtwork = {
  'monthly-membership': {
    original: 'ed8244_b097ed7e5323442189dfb29c80084744',
    replacement: '/brand/serenity-sign.svg',
    alt: 'Illustration of the Serenity Club of Clearwater sign',
  },
  'annual-membership': {
    original: 'ed8244_4f0085be20aa4b9dbb5b805f5bcced3e',
    replacement: '/brand/serenity-sign.svg',
    alt: 'Illustration of the Serenity Club of Clearwater sign',
  },
  medallions: {
    original: 'ed8244_d0ee1db61a5248bda9259efd9f9384fd',
    replacement: '/shop/aa-medallions.jpg',
    alt: 'Photograph of AA recovery medallions representing available anniversary medallions',
  },
  'coffee-mug': {
    original: 'ed8244_42156afcb5f640c495e074d99934cd41',
    replacement: '/brand/shop-coffee-mug.svg',
    alt: 'Illustration of a white mug with the Serenity Club of Clearwater name',
  },
} satisfies Record<string, { original: string; replacement: string; alt: string }>

export function presentShopProduct(product: Product): Product {
  const legacy = legacyArtwork[product.slug as keyof typeof legacyArtwork]
  const useArtwork = legacy && (!product.imageUrl || product.imageUrl.includes(legacy.original))

  return {
    ...product,
    badge: product.badge?.trim().toLowerCase() === 'sample image' ? undefined : product.badge,
    fulfillmentNote: product.fulfillmentNote.replace(/\s*Product photo is a sample\.?/i, '').trim(),
    imageUrl: useArtwork ? legacy.replacement : product.imageUrl,
    imageAlt: useArtwork ? legacy.alt : product.imageAlt,
  }
}
