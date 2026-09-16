import type { Field, Plugin } from 'payload'

const names: Record<string, [string, string, string]> = {
  events: ['Event or flyer', 'Events & flyers', 'Everyday tasks'],
  meetings: ['Meeting', 'Meetings', 'Everyday tasks'],
  galleryItems: ['Photo', 'Gallery photos', 'Everyday tasks'],
  media: ['Photo or file', 'Photo & file library', 'Website details'],
  teamMembers: ['Board or team member', 'Board & team', 'Website details'],
  products: ['Membership or shop item', 'Memberships & shop', 'Website details'],
  policies: ['Club rule', 'Club rules', 'Website details'],
}

export function imagePreviewField(imageField: string, externalField = 'externalImageUrl'): Field {
  return {
    name: `${imageField}Preview`,
    type: 'ui',
    admin: {
      components: {
        Field: { path: '@/admin/ImagePreview', clientProps: { imageField, externalField } },
      },
    },
  }
}

export const clubAdminPlugin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((collection) => {
    const name = names[collection.slug]
    if (!name) return collection
    return {
      ...collection,
      labels: { singular: name[0], plural: name[1] },
      admin: {
        ...collection.admin,
        group: name[2],
        hideAPIURL: true,
        defaultColumns:
          collection.slug === 'media'
            ? ['filename', 'alt', 'updatedAt']
            : collection.slug === 'galleryItems'
              ? ['image', 'title', 'category', '_status', 'updatedAt']
              : [...(collection.admin?.defaultColumns || []), '_status'],
        description:
          collection.slug === 'media'
            ? 'Shared public files. Uploading here stores a file; publish a gallery photo or event to show it on those pages.'
            : collection.admin?.description,
      },
      fields: collection.fields.flatMap((field) =>
        'name' in field && field.type === 'upload' && field.relationTo === 'media'
          ? [field, imagePreviewField(field.name)]
          : [field],
      ),
    }
  }),
})
