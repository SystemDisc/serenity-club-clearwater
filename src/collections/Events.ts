import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { calendarField } from '@/fields/calendarFields'
import { validateEvent } from '@/hooks/validateEvent'
import {
  revalidatePublicSiteAfterChange,
  revalidatePublicSiteAfterDelete,
} from '@/hooks/revalidatePublicSite'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: 'Event',
    plural: 'Events',
  },
  admin: {
    group: 'Serenity Club',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'featured', 'category', 'updatedAt'],
    description:
      'For one activity, choose its date and details here. Use Monthly flyers for the whole month. Recurring club meetings can use their existing meeting schedule.',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'kind',
      type: 'select',
      label: 'What are you adding?',
      defaultValue: 'dated',
      required: true,
      options: [
        { value: 'dated', label: 'An event with a date' },
        { value: 'meeting', label: 'An activity from the recurring meeting schedule' },
        { value: 'legacy', label: 'Older announcement — dates need review' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Date and time',
      admin: { condition: (data) => data.kind === 'dated' },
      fields: [
        calendarField('date', 'Event date', 'date'),
        calendarField('endDate', 'Last day (only for events over several days)', 'date'),
        {
          name: 'timeMode',
          type: 'select',
          label: 'Time',
          defaultValue: 'unannounced',
          options: [
            { value: 'known', label: 'Set the time' },
            { value: 'allDay', label: 'All day' },
            { value: 'unannounced', label: 'Time not announced' },
          ],
        },
        {
          type: 'row',
          admin: { condition: (data) => data.timeMode === 'known' },
          fields: [
            calendarField('startTime', 'Starts at', 'time'),
            calendarField('endTime', 'Ends at (optional)', 'time'),
          ],
        },
        {
          name: 'location',
          type: 'text',
          label: 'Where is it?',
          defaultValue: 'Serenity Club of Clearwater',
          admin: { placeholder: 'Clubhouse coffee bar' },
        },
      ],
    },
    {
      name: 'meeting',
      type: 'relationship',
      relationTo: 'meetings',
      label: 'Meeting schedule to use',
      admin: {
        condition: (data) => data.kind === 'meeting',
        description:
          'Dates and times come from this meeting. Correct them in Meetings so all public pages agree.',
      },
    },
    {
      type: 'collapsible',
      label: 'Older announcement details',
      admin: { condition: (data) => data.kind === 'legacy' },
      fields: [
        { name: 'dateLabel', type: 'text', label: 'Previous date wording' },
        { name: 'timeLabel', type: 'text', label: 'Previous time wording' },
        {
          name: 'archived',
          type: 'checkbox',
          label: 'Keep this older announcement in past events',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Show on the homepage while upcoming',
      defaultValue: false,
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'Community',
      options: ['Fundraiser', 'Meeting', 'Service', 'Community'],
    },
    { name: 'summary', type: 'textarea', required: true, label: 'Short description for visitors' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'externalImageUrl', type: 'text', label: 'External Image URL' },
    { name: 'imageAlt', type: 'text', label: 'Describe the picture for people who cannot see it' },
    { name: 'url', type: 'text', label: 'Link for more event details (optional)' },
    {
      name: 'sourceFlyer',
      type: 'relationship',
      relationTo: 'monthlyFlyers',
      label: 'Related monthly flyer (optional)',
      admin: { position: 'sidebar' },
    },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  hooks: {
    beforeChange: [validateEvent],
    afterChange: [revalidatePublicSiteAfterChange],
    afterDelete: [revalidatePublicSiteAfterDelete],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
