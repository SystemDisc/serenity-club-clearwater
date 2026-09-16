import { ValidationError, type GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { imagePreviewField } from '@/admin/config'
import { localDateKey } from '@/serenity/calendar'
import { duesView, validMonth } from '@/serenity/dues'
import { revalidatePublicSiteAfterGlobalChange } from '@/hooks/revalidatePublicSite'

export const DuesReminder: GlobalConfig = {
  slug: 'duesReminder',
  label: 'Membership dues reminder',
  admin: {
    group: 'Everyday tasks',
    hideAPIURL: true,
    description:
      'The reminder on About. Save a draft, check this month and next month, then publish. The earlier uploaded poster is retained in Website details.',
  },
  access: { read: authenticatedOrPublished, update: authenticated, readVersions: authenticated },
  versions: { drafts: true, max: 50 },
  fields: [
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: 'legacy',
      label: 'How should the reminder work?',
      options: [
        { value: 'automatic', label: 'Use the current month automatically' },
        { value: 'chosen', label: 'Choose a month' },
        { value: 'off', label: 'Turn the reminder off' },
        { value: 'legacy', label: 'Keep the earlier uploaded poster' },
      ],
      admin: { components: { Field: '@/admin/SimpleSelectField' } },
    },
    {
      name: 'month',
      type: 'text',
      defaultValue: () => localDateKey().slice(0, 7),
      label: 'Reminder month',
      admin: {
        condition: (data) => data.mode === 'chosen',
        components: {
          Field: { path: '@/admin/CalendarField', clientProps: { inputType: 'month' } },
        },
      },
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message below the month',
      defaultValue: 'Thank you for helping keep the Serenity Club open for our recovery community.',
      admin: { condition: (data) => ['automatic', 'chosen'].includes(data.mode) },
    },
    {
      name: 'showMembershipLink',
      type: 'checkbox',
      label: 'Include a link to Memberships & shop',
      defaultValue: true,
      admin: {
        description:
          'Uses the existing membership information page. This does not change prices or payment links.',
        condition: (data) => ['automatic', 'chosen'].includes(data.mode),
      },
    },
    {
      type: 'collapsible',
      label: 'Optional artwork',
      admin: {
        initCollapsed: true,
        condition: (data) => ['automatic', 'chosen'].includes(data.mode),
      },
      fields: [
        {
          name: 'artworkKind',
          type: 'select',
          label: 'Does the artwork name a month?',
          defaultValue: 'none',
          options: [
            { value: 'none', label: 'No artwork — use the readable text' },
            { value: 'decoration', label: 'Reusable decoration with no month or wording' },
            { value: 'monthly', label: 'A poster for a particular month' },
          ],
          admin: { components: { Field: '@/admin/SimpleSelectField' } },
        },
        {
          name: 'artwork',
          type: 'upload',
          relationTo: 'media',
          label: 'Reminder artwork',
          admin: { condition: (data) => data.artworkKind !== 'none' },
        },
        imagePreviewField('artwork'),
        {
          name: 'artworkMonth',
          type: 'text',
          label: 'Month printed on this artwork',
          admin: {
            condition: (data) => data.artworkKind === 'monthly',
            components: {
              Field: { path: '@/admin/CalendarField', clientProps: { inputType: 'month' } },
            },
            description: 'Automatic reminders hide month-specific artwork after that month ends.',
          },
        },
      ],
    },
    { name: 'noticePreview', type: 'ui', admin: { components: { Field: '@/admin/DuesPreview' } } },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if ((data._status ?? originalDoc?._status) !== 'published') return data
        const notice = { ...originalDoc, ...data }
        const active = ['automatic', 'chosen'].includes(notice.mode)
        const errors: { path: string; message: string }[] = []
        if (notice.mode === 'chosen' && !validMonth(notice.month))
          errors.push({ path: 'month', message: 'Choose the reminder month.' })
        if (active && !notice.message?.trim())
          errors.push({
            path: 'message',
            message: 'Add the short reminder message before publishing.',
          })
        if (
          active &&
          notice.artworkKind === 'monthly' &&
          (!validMonth(notice.artworkMonth) || duesView(notice).expiredArt)
        )
          errors.push({
            path: 'artworkMonth',
            message:
              'The poster must match the reminder month. Choose matching artwork or select no artwork.',
          })
        if (active && notice.artworkKind !== 'none') {
          const id = typeof notice.artwork === 'object' ? notice.artwork?.id : notice.artwork
          const image = id
            ? await req.payload.findByID({
                collection: 'media',
                id,
                req,
                overrideAccess: false,
                disableErrors: true,
                depth: 0,
              })
            : null
          if (
            !image?.url ||
            !image.width ||
            !image.height ||
            !/^image\/(jpeg|png|webp|avif)$/.test(image.mimeType || '')
          )
            errors.push({ path: 'artwork', message: 'Choose a ready image or select no artwork.' })
        }
        if (errors.length) throw new ValidationError({ req, global: 'duesReminder', errors })
        return data
      },
    ],
    afterChange: [revalidatePublicSiteAfterGlobalChange],
  },
}
