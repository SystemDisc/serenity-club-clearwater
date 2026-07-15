import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  labels: {
    singular: 'Sponsor',
    plural: 'Sponsors',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'name',
    defaultColumns: ['name', 'url', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'url', type: 'text', label: 'Sponsor URL' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'externalImageUrl', type: 'text', label: 'External Image URL' },
    { name: 'imageAlt', type: 'text', label: 'Image Alt Text' },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  hooks: {
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
