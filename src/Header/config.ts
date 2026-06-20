import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header Navigation',
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
      label: 'Primary navigation',
      labels: {
        plural: 'Primary navigation items',
        singular: 'Primary navigation item',
      },
      admin: {
        description: 'Shown directly in the desktop header and first in the mobile menu.',
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
    {
      name: 'secondaryNavItems',
      type: 'array',
      label: 'More menu navigation',
      labels: {
        plural: 'More menu navigation items',
        singular: 'More menu navigation item',
      },
      admin: {
        description: 'Shown under the desktop More menu and after primary links on mobile.',
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 8,
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
