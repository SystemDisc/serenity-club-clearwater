import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { meetingScheduleFields } from '@/fields/meetingSchedule'
import { validateSchedule } from '@/hooks/validateSchedule'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const Meetings: CollectionConfig = {
  slug: 'meetings',
  labels: {
    singular: 'Meeting',
    plural: 'Meetings',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'name',
    defaultColumns: ['name', 'fellowship', 'checkedOn', 'updatedAt'],
    description:
      'Change one group here. Set the days that share details, then add sessions for days that differ. Preview the next dates before publishing.',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'fellowship',
      type: 'select',
      required: true,
      options: [
        { label: 'AA', value: 'AA' },
        { label: 'NA', value: 'NA' },
        { label: 'Club', value: 'Club' },
      ],
    },
    ...meetingScheduleFields,
    {
      type: 'collapsible',
      label: 'Previous schedule — reference for checking with the group',
      admin: { initCollapsed: true },
      fields: [
        { name: 'time', type: 'text', admin: { readOnly: true } },
        { name: 'days', type: 'text', admin: { readOnly: true } },
        { name: 'room', type: 'text', admin: { readOnly: true } },
        { name: 'format', type: 'textarea', admin: { readOnly: true } },
        { name: 'description', type: 'textarea', admin: { readOnly: true } },
        {
          name: 'externalUrl',
          type: 'text',
          label: 'Previous external URL',
          admin: { readOnly: true },
        },
        { name: 'order', type: 'number', defaultValue: 100, admin: { readOnly: true } },
      ],
    },
  ],
  hooks: {
    beforeChange: [validateSchedule],
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
