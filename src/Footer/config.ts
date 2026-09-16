import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { adminOnly } from '@/access/users'
import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Bottom menu',
  access: {
    read: () => true,
    update: adminOnly,
    readVersions: authenticated,
  },
  admin: {
    group: 'Manager settings',
    hideAPIURL: true,
    description:
      'Saving changes links across the website immediately. Empty menus show no links. Restore an earlier saved menu from Previous versions.',
  },
  versions: { max: 30 },
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
