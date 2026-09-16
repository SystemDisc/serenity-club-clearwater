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
        description:
          'Links shown at the bottom of every page. Leave empty to show no footer menu links. Saving changes the public website immediately.',
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
