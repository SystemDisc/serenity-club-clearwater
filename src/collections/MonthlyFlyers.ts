import { ValidationError, type CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { imagePreviewField } from '@/admin/config'
import { localDateKey } from '@/serenity/calendar'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const MonthlyFlyers: CollectionConfig = {
  slug: 'monthlyFlyers',
  labels: { singular: 'Monthly flyer', plural: 'Monthly flyers' },
  admin: {
    useAsTitle: 'month',
    group: 'Everyday tasks',
    defaultColumns: ['month', 'image', '_status', 'updatedAt'],
    hideAPIURL: true,
    description:
      'One flyer per month. Keep next month as a draft until it is ready. Previous images and original documents remain available through Versions.',
  },
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'month',
      type: 'text',
      required: true,
      unique: true,
      defaultValue: () => localDateKey().slice(0, 7),
      validate: (value: string | null | undefined) =>
        !value || /^\d{4}-(0[1-9]|1[0-2])$/.test(value) || 'Choose a month and year.',
      admin: {
        components: {
          Field: { path: '@/admin/CalendarField', clientProps: { inputType: 'month' } },
        },
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Flyer image',
      filterOptions: { mimeType: { in: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] } },
    },
    imagePreviewField('image'),
    {
      name: 'sourceDocument',
      type: 'upload',
      relationTo: 'sourceDocuments',
      label: 'Original Word document (optional)',
      admin: {
        description:
          'Use the Word flyer control below to retain the original and create a separate image.',
      },
    },
    { name: 'wordFlyer', type: 'ui', admin: { components: { Field: '@/admin/WordFlyer' } } },
    {
      name: 'details',
      type: 'textarea',
      required: true,
      label: 'Flyer details in text',
      admin: {
        description:
          'Include dates, event names, and available times so people can read the details without the picture.',
      },
    },
  ],
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if ((data._status ?? originalDoc?._status) !== 'published') return data
        const merged = { ...originalDoc, ...data }
        const id = typeof merged.image === 'object' ? merged.image?.id : merged.image
        const image = id
          ? await req.payload.findByID({
              collection: 'media',
              id,
              req,
              overrideAccess: false,
              disableErrors: true,
              depth: 0,
            })
          : null
        if (
          !image?.width ||
          !image.height ||
          !image.url ||
          !/^image\/(jpeg|png|webp|avif)$/.test(image.mimeType || '')
        )
          throw new ValidationError({
            req,
            collection: 'monthlyFlyers',
            errors: [
              {
                path: 'image',
                message:
                  'Choose a ready flyer image before publishing. Keep unfinished work as a draft.',
              },
            ],
          })
        const sourceID =
          typeof merged.sourceDocument === 'object'
            ? merged.sourceDocument?.id
            : merged.sourceDocument
        const imageSource =
          typeof image.sourceDocument === 'object' ? image.sourceDocument?.id : image.sourceDocument
        if (sourceID && imageSource !== sourceID)
          throw new ValidationError({
            req,
            collection: 'monthlyFlyers',
            errors: [
              {
                path: 'sourceDocument',
                message:
                  'Convert this original to use its matching image, or clear the original when choosing a different image.',
              },
            ],
          })
        return data
      },
    ],
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
}
