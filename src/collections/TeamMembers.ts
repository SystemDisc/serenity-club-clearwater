import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const TeamMembers: CollectionConfig = {
  slug: 'teamMembers',
  labels: {
    singular: 'Team Member',
    plural: 'Team Members',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'bio', type: 'textarea', label: 'Short introduction', required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'externalImageUrl',
      type: 'text',
      label: 'External picture address (advanced)',
      admin: { description: 'Usually leave blank and choose a library photo above.' },
    },
    { name: 'imageAlt', type: 'text', label: 'Description for people who cannot see the picture' },
    {
      name: 'order',
      type: 'number',
      label: 'Display position',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description:
          'Lower numbers appear first. Leave gaps, such as 10, 20, 30, to fit new entries between them.',
      },
    },
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
