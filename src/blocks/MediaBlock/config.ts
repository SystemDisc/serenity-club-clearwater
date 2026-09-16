import { imagePreviewField } from '@/admin/config'
import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  labels: { singular: 'Add photo', plural: 'Photos' },
  admin: { components: { Block: '@/admin/NewsPhotoBlock' }, disableBlockName: true },
  fields: [
    {
      name: 'media',
      label: 'Photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    imagePreviewField('media'),
    { name: 'caption', type: 'textarea', label: 'Caption below this photo (optional)' },
    {
      name: 'alt',
      type: 'text',
      label: 'Description for people who cannot see this photo (optional)',
    },
  ],
}
