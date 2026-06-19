import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Shop Item',
    plural: 'Shop Items',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'slug', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'price', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'badge', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'externalImageUrl', type: 'text', label: 'External Image URL' },
    { name: 'imageAlt', type: 'text', label: 'Image Alt Text' },
    { name: 'checkoutUrl', type: 'text', label: 'Square or Stripe Checkout URL' },
    { name: 'fulfillmentNote', type: 'textarea', required: true },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
