import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer Navigation',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'Serenity Club',
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Footer navigation',
      labels: {
        plural: 'Footer navigation items',
        singular: 'Footer navigation item',
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 12,
      admin: {
        description: 'Shown in the footer. If empty, the footer uses the header navigation items.',
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
