import { validateWebsiteURL } from '@/utilities/validateWebsiteURL'
import { slugField, type CollectionConfig } from 'payload'
import { isAdmin } from '@/access/users'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

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
    slugField({ fieldToUse: 'title' }),
    { name: 'price', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'badge', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'externalImageUrl',
      type: 'text',
      label: 'External picture address (advanced)',
      admin: { description: 'Usually leave blank and choose a library photo above.' },
    },
    { name: 'imageAlt', type: 'text', label: 'Description for people who cannot see the picture' },
    {
      name: 'checkoutUrl',
      validate: validateWebsiteURL,
      type: 'text',
      label: 'Buy online destination',
      access: { create: ({ req }) => isAdmin(req.user), update: ({ req }) => isAdmin(req.user) },
      admin: {
        description:
          'Manager setting: verify the payment account. A displayed price does not change the price charged by this destination.',
      },
    },
    {
      name: 'fulfillmentNote',
      type: 'textarea',
      label: 'How to buy or collect this item',
      required: true,
    },
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
