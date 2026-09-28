import { describe, expect, it } from 'vitest'
import { presentShopProduct } from '@/serenity/shopArtwork'
import type { Product } from '@/serenity/content'

const mug: Product = {
  title: 'Coffee Mug',
  slug: 'coffee-mug',
  price: '$10',
  badge: 'Sample image',
  description: 'Club mug',
  fulfillmentNote: 'Available at the clubhouse. Product photo is a sample.',
  imageUrl:
    'https://example.com/ed8244_42156afcb5f640c495e074d99934cd41~mv2.jpg',
  imageAlt: 'Coffee mug sample',
  order: 40,
}

describe('shop artwork', () => {
  it('replaces the known low-resolution sample and removes sample copy', () => {
    const product = presentShopProduct(mug)
    expect(product.imageUrl).toBe('/brand/shop-coffee-mug.svg')
    expect(product.imageAlt).toContain('Illustration')
    expect(product.badge).toBeUndefined()
    expect(product.fulfillmentNote).toBe('Available at the clubhouse.')
  })

  it('keeps a later photo uploaded to the CMS', () => {
    const product = presentShopProduct({
      ...mug,
      imageUrl: 'https://example.com/actual-club-mug.jpg',
      imageAlt: 'Current mug sold at Serenity Club',
    })
    expect(product.imageUrl).toBe('https://example.com/actual-club-mug.jpg')
    expect(product.imageAlt).toBe('Current mug sold at Serenity Club')
  })

  it('uses the licensed AA medallion photograph in place of the legacy thumbnail', () => {
    const product = presentShopProduct({
      ...mug,
      slug: 'medallions',
      imageUrl: 'https://example.com/ed8244_d0ee1db61a5248bda9259efd9f9384fd~mv2.jpg',
    })
    expect(product.imageUrl).toBe('/shop/aa-medallions.jpg')
  })
})
