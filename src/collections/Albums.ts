import { APIError, ValidationError, slugField, type CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { calendarField } from '@/fields/calendarFields'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const Albums: CollectionConfig = {
  slug: 'albums',
  labels: { singular: 'Album', plural: 'Albums' },
  admin: {
    useAsTitle: 'title',
    group: 'Everyday tasks',
    defaultColumns: ['title', 'cover', 'date', '_status'],
    hideAPIURL: true,
    description:
      'Create an album draft and add its photos. A collage is made automatically, or choose one photo as the cover. Publishing shows the album and its published photos in Gallery. Unpublishing hides the whole album.',
  },
  access: {
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Album name' },
    calendarField('date', 'Album date (optional)', 'date'),
    { name: 'description', type: 'textarea', label: 'About these photos (optional)' },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'Selected cover photo',
      admin: { hidden: true },
      filterOptions: {
        mimeType: { in: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] },
      },
    },
    { name: 'albumPhotos', type: 'ui', admin: { components: { Field: '@/admin/AlbumPhotos' } } },
    slugField({ position: 'sidebar' }),
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      label: 'Position in Gallery',
      admin: { position: 'sidebar' },
    },
  ],
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if ((data._status ?? originalDoc?._status) !== 'published') return data
        const id = originalDoc?.id
        const members = id
          ? await req.payload.find({
              collection: 'galleryItems',
              req,
              overrideAccess: false,
              draft: false,
              depth: 0,
              limit: 1,
              where: { and: [{ album: { equals: id } }, { _status: { equals: 'published' } }] },
            })
          : null
        const selectedCover = data.cover === undefined ? originalDoc?.cover : data.cover
        const coverID = typeof selectedCover === 'object' ? selectedCover?.id : selectedCover
        const selectedMember =
          coverID && id
            ? await req.payload.find({
                collection: 'galleryItems',
                req,
                overrideAccess: false,
                draft: false,
                depth: 1,
                limit: 1,
                where: {
                  and: [
                    { album: { equals: id } },
                    { image: { equals: coverID } },
                    { _status: { equals: 'published' } },
                  ],
                },
              })
            : null
        const coverImage = selectedMember?.docs[0]?.image
        const cover = typeof coverImage === 'object' ? coverImage : null
        const errors = []
        if (!members?.docs.length)
          errors.push({
            path: 'title',
            message: 'Save the album as a draft and add ready photos before publishing it.',
          })
        if (
          coverID &&
          (!cover?.url ||
            !cover.width ||
            !cover.height ||
            !/^image\/(jpeg|png|webp|avif|gif)$/.test(cover.mimeType || ''))
        )
          errors.push({
            path: 'albumPhotos',
            message:
              'Choose a published photo from this album as the cover, or use the automatic collage.',
          })
        if (errors.length) throw new ValidationError({ collection: 'albums', req, errors })
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const members = await req.payload.count({
          collection: 'galleryItems',
          trash: true,
          req,
          overrideAccess: false,
          where: { album: { equals: id } },
        })
        if (members.totalDocs)
          throw new APIError(
            'This album still contains photos. Unpublish it to hide it, or move its photos before deleting the empty album.',
            400,
            undefined,
            true,
          )
      },
    ],
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
}
