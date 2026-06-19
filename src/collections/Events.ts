import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: 'Event',
    plural: 'Events',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'title',
    defaultColumns: ['title', 'dateLabel', 'category', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'dateLabel', type: 'text', required: true },
    { name: 'timeLabel', type: 'text' },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'Community',
      options: ['Fundraiser', 'Meeting', 'Service', 'Community'],
    },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'externalImageUrl', type: 'text', label: 'External Image URL' },
    { name: 'imageAlt', type: 'text', label: 'Image Alt Text' },
    { name: 'url', type: 'text', label: 'Optional URL' },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
