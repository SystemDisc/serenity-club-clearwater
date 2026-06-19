import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'

export const GalleryItems: CollectionConfig = {
  slug: 'galleryItems',
  labels: {
    singular: 'Gallery Item',
    plural: 'Gallery Items',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'order', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'Clubhouse',
      options: ['Clubhouse', 'Event', 'People', 'Flyer', 'Community'],
    },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'externalImageUrl', type: 'text', label: 'External Image URL' },
    { name: 'imageAlt', type: 'text', label: 'Image Alt Text' },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
