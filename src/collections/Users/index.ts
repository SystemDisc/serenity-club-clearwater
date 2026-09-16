import { adminOnly, adminOrSelf, isAdmin, protectUserRole, preventSelfDeletion } from '@/access/users'
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
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  hooks: {
    beforeChange: [protectUserRole],
    beforeDelete: [preventSelfDeletion],
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  auth: true,
  fields: [
    {
      name: 'role', type: 'select', required: true, defaultValue: 'editor', saveToJWT: true,
      options: [{ label: 'Administrator', value: 'admin' }, { label: 'Editor', value: 'editor' }],
      access: { create: ({ req }) => isAdmin(req.user), update: ({ req }) => isAdmin(req.user) },
      admin: { description: 'Editors manage content. Administrators also manage user accounts.' },
    },
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
