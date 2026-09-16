import { inspectBatchUpload, saveContentHash } from '@/photoBatches/mediaUpload'
import { APIError, type CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { adminThumbnail } from '@/utilities/adminThumbnail'
import { isDocxMimeType } from '@/utilities/docxToImage/mime'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'contentHash',
      type: 'text',
      index: true,
      admin: { hidden: true },
      access: {
        create: ({ req }) => !!req.context.mediaContentHash,
        update: ({ req }) => !!req.context.mediaContentHash,
        read: ({ req }) => !!req.user,
      },
    },
    {
      name: 'uploadKey',
      type: 'text',
      unique: true,
      admin: { hidden: true },
      access: {
        create: ({ req }) => !!req.context.batchUpload,
        update: () => false,
        read: ({ req }) => !!req.user,
      },
    },
    {
      name: 'sourceDocument',
      type: 'relationship',
      relationTo: 'sourceDocuments',
      unique: true,
      admin: {
        readOnly: true,
        description: 'Original retained separately when this image was made from a Word flyer.',
      },
      access: {
        create: ({ req }) => !!req.context.sourceConversion,
        update: () => false,
        read: ({ req }) => !!req.user,
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'Describe meaningful image content for screen readers. Leave blank only for decorative images; gallery titles provide a fallback.',
      },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  hooks: {
    afterRead: [
      ({ doc }) => {
        // Cloud-storage field hooks resolve URLs after Payload's thumbnail field reads originalDoc.
        // Recompute from the completed document, including old files without generated sizes.
        doc.thumbnailURL = adminThumbnail({ doc })
        return doc
      },
    ],
    beforeOperation: [inspectBatchUpload],
    beforeChange: [
      saveContentHash,
      ({ data, req }) => {
        if (req.file?.name?.toLowerCase().endsWith('.docx') || isDocxMimeType(req.file?.mimetype))
          throw new APIError(
            'Use Monthly flyers → Upload Word flyer so the original document is kept safely alongside the image.',
            400,
            undefined,
            true,
          )
        return data
      },
    ],
    afterChange: [
      (args) =>
        args.operation === 'create' && args.req.context.batchUpload
          ? args.doc
          : revalidatePublicSiteAfterChange(args),
    ],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail,
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
