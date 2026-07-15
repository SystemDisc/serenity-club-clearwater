import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const Meetings: CollectionConfig = {
  slug: 'meetings',
  labels: {
    singular: 'Meeting',
    plural: 'Meetings',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'name',
    defaultColumns: ['name', 'fellowship', 'time', 'days', 'room', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'fellowship',
      type: 'select',
      required: true,
      options: [
        { label: 'AA', value: 'AA' },
        { label: 'NA', value: 'NA' },
        { label: 'Club', value: 'Club' },
      ],
    },
    { name: 'time', type: 'text', required: true },
    { name: 'days', type: 'text', required: true },
    { name: 'room', type: 'text' },
    { name: 'format', type: 'textarea' },
    { name: 'description', type: 'textarea' },
    { name: 'externalUrl', type: 'text', label: 'External URL' },
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
