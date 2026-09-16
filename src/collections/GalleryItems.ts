import type { CollectionConfig, AccessResult } from 'payload'

import { authenticated } from '@/access/authenticated'
import { calendarField } from '@/fields/calendarFields'
import { validateGalleryImage } from '@/hooks/validateGalleryImage'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

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
    read: ({ req }): AccessResult =>
      req.user
        ? true
        : {
            and: [
              { _status: { equals: 'published' } },
              {
                or: [
                  { album: { exists: false } },
                  {
                    and: [
                      { 'album._status': { equals: 'published' } },
                      { 'album.deletedAt': { exists: false } },
                    ],
                  },
                ],
              },
            ],
          },
    update: authenticated,
  },
  fields: [
    {
      name: 'importKey',
      type: 'text',
      unique: true,
      admin: { hidden: true },
      access: {
        create: ({ req }) => req.context.photoBatchAction === true,
        update: () => false,
        read: ({ req }) => !!req.user,
      },
    },
    calendarField('takenOn', 'Photo date (optional)', 'date'),
    { name: 'title', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'Clubhouse',
      options: ['Clubhouse', 'Event', 'People', 'Flyer', 'Community'],
    },
    { name: 'description', type: 'textarea', label: 'Caption shown below the photo' },
    {
      name: 'album',
      type: 'relationship',
      relationTo: 'albums',
      label: 'Album (leave empty for the main gallery)',
      admin: {
        description:
          'An album photo is visible only while both this photo and its album are published. Clear this field to move the photo to the main gallery.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: {
        mimeType: {
          in: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
        },
      },
    },
    { name: 'externalImageUrl', type: 'text', label: 'External Image URL' },
    { name: 'imageAlt', type: 'text', label: 'Image Alt Text' },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  hooks: {
    beforeChange: [validateGalleryImage],
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
