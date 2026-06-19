import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'

export const Policies: CollectionConfig = {
  slug: 'policies',
  labels: {
    singular: 'Policy',
    plural: 'Policies',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
