import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  hooks: {
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
