import type { Field } from 'payload'
import { WEEKDAYS } from '@/serenity/meetings'
import { attendanceLabels, formatLabels } from '@/serenity/schedule'
import { calendarField } from './calendarFields'

const details = (): Field[] => [
  { name: 'room', type: 'text', label: 'Room or location' },
  {
    name: 'format',
    type: 'select',
    label: 'Meeting format',
    defaultValue: 'unknown',
    options: [
      { label: 'Not yet confirmed', value: 'unknown' },
      ...Object.entries(formatLabels).map(([value, label]) => ({ value, label })),
    ],
  },
  { name: 'topic', type: 'text', label: 'Book or topic (optional)' },
  {
    name: 'attendance',
    type: 'select',
    label: 'Who may attend',
    defaultValue: 'unknown',
    options: [
      { label: 'Not yet confirmed', value: 'unknown' },
      ...Object.entries(attendanceLabels).map(([value, label]) => ({ value, label })),
    ],
    admin: {
      description:
        'Attendance is separate from discussion or study format. Confirm with the group.',
    },
  },
  {
    name: 'confirmed',
    type: 'checkbox',
    label: 'I checked this format and attendance information with the group',
    defaultValue: false,
    admin: { description: 'Unconfirmed format and attendance labels are not shown publicly.' },
  },
]

export const meetingScheduleFields: Field[] = [
  { name: 'weeklyEditor', type: 'ui', admin: { components: { Field: '@/admin/WeeklyEditor' } } },
  {
    name: 'publicNotes',
    type: 'textarea',
    label: 'Notes for visitors',
    admin: {
      description:
        'Only add confirmed information. These notes appear with this group wherever its schedule is shown.',
    },
  },
  {
    name: 'sessions',
    type: 'array',
    label: 'Weekly schedule and monthly sessions',
    labels: { singular: 'Session', plural: 'Sessions' },
    maxRows: 50,
    admin: {
      description:
        'Select all days that share the same time and format. Add another session for days with different details. Times are local to Clearwater.',
      components: { RowLabel: '@/admin/SchedulePreview#SessionRowLabel' },
    },
    fields: [
      {
        name: 'key',
        type: 'text',
        required: true,
        defaultValue: () => crypto.randomUUID(),
        admin: { hidden: true },
      },
      {
        name: 'label',
        type: 'text',
        label: 'Name for this session (optional)',
        admin: { placeholder: 'Morning meeting or Thursday book study' },
      },
      {
        name: 'recurrence',
        type: 'select',
        label: 'How often?',
        defaultValue: 'weekly',
        required: true,
        options: [
          { label: 'These days every week', value: 'weekly' },
          { label: 'A particular week of the month', value: 'monthly' },
        ],
      },
      {
        name: 'days',
        type: 'select',
        label: 'Days with these details',
        hasMany: true,
        required: true,
        options: [...WEEKDAYS.slice(1), WEEKDAYS[0]],
        admin: { components: { Field: '@/admin/WeekdayField' } },
      },
      {
        name: 'ordinal',
        type: 'select',
        label: 'Which week?',
        options: ['first', 'second', 'third', 'fourth', 'fifth', 'last'].map((value) => ({
          value,
          label: value[0].toUpperCase() + value.slice(1),
        })),
        admin: { condition: (_, sibling) => sibling.recurrence === 'monthly' },
      },
      {
        name: 'replaces',
        type: 'text',
        label: 'Replace a regular session on this date?',
        admin: {
          condition: (_, sibling) => sibling.recurrence === 'monthly',
          components: { Field: '@/admin/SessionReference' },
          description: 'Leave empty for an additional monthly session.',
        },
      },
      calendarField('time', 'Start time', 'time', true),
      ...details(),
      {
        type: 'collapsible',
        label: 'When this schedule starts or ends',
        fields: [
          calendarField('from', 'First date (optional)', 'date'),
          calendarField('until', 'Last date (optional)', 'date'),
        ],
      },
    ],
  },
  {
    name: 'exceptions',
    type: 'array',
    label: 'Cancel or change one date',
    labels: { singular: 'Date change', plural: 'Date changes' },
    maxRows: 100,
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'session',
        type: 'text',
        required: true,
        label: 'Which session?',
        admin: { components: { Field: '@/admin/SessionReference' } },
      },
      calendarField('date', 'Original meeting date', 'date', true),
      {
        name: 'action',
        type: 'select',
        required: true,
        defaultValue: 'cancel',
        options: [
          { label: 'Cancel just this date', value: 'cancel' },
          { label: 'Change just this date', value: 'change' },
        ],
      },
      {
        type: 'collapsible',
        label: 'Changes for this date',
        admin: { condition: (_, sibling) => sibling.action === 'change' },
        fields: [
          calendarField('movedTo', 'New date (leave empty to keep the date)', 'date'),
          calendarField('time', 'New start time (optional)', 'time'),
          ...details(),
          { name: 'note', type: 'textarea', label: 'Explanation for visitors' },
        ],
      },
    ],
  },
  {
    name: 'schedulePreview',
    type: 'ui',
    admin: { components: { Field: '@/admin/SchedulePreview' } },
  },
  {
    name: 'recordScheduleCheck',
    type: 'ui',
    admin: { components: { Field: '@/admin/MeetingCheck' } },
  },
  calendarField('checkedOn', 'Schedule last checked', 'date'),
  {
    name: 'checkedBy',
    type: 'text',
    label: 'Checked with (admin only)',
    access: { read: ({ req }) => !!req.user },
    admin: {
      description:
        'Group contact or responsible role. This is never included in the public schedule.',
    },
  },
]
