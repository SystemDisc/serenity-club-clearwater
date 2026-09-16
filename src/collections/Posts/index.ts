import { imagePreviewField } from '@/admin/config'
import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  BlockquoteFeature,
  OrderedListFeature,
  UnorderedListFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: { singular: 'News update', plural: 'News & updates' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', '_status', 'publishedAt', 'updatedAt'],
    group: 'Everyday tasks',
    hideAPIURL: true,
    description:
      'Write an update, preview it on a phone or computer, then publish. Save your first draft, then later edits autosave. A publication date is a display date; it does not schedule publication.',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Short introduction (optional)',
      admin: { description: 'Shown in the news list and above the article.' },
    },
    {
      name: 'byline',
      type: 'text',
      label: 'Published by (optional)',
      admin: {
        description:
          'For example: Serenity Club. Leave empty to publish without a personal byline.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'heroImage',
              label: 'Cover photo (optional)',
              type: 'upload',
              relationTo: 'media',
            },
            imagePreviewField('heroImage'),
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                    UnorderedListFeature(),
                    OrderedListFeature(),
                    BlockquoteFeature(),
                    BlocksFeature({ blocks: [MediaBlock] }),
                    FixedToolbarFeature({
                      customGroups: {
                        format: { type: 'dropdown' },
                        features: { type: 'dropdown' },
                      },
                    }),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: 'Article body',
              admin: {
                description:
                  'Use the toolbar for headings, lists, links, quotes, and Add photo. Paste text from Word or Google Docs, then check the preview.',
              },
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
          ],
          label: 'Related updates & categories (optional)',
        },
        {
          name: 'meta',
          label: 'Search & sharing (optional)',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      label: 'Earlier author selection',
      admin: {
        condition: (data) => !!data.authors?.length,
        readOnly: true,
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePublicSiteAfterChange],
    afterRead: [populateAuthors],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  versions: {
    drafts: {
      validate: true,
      autosave: {
        interval: 2000,
        showSaveDraftButton: true,
      },
      schedulePublish: process.env.ENABLE_SCHEDULED_PUBLISHING === 'true',
    },
    maxPerDoc: 50,
  },
}
