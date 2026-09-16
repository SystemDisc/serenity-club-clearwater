import { validateWebsiteURL } from '@/utilities/validateWebsiteURL'
import { APIError, type GlobalConfig, type Field } from 'payload'
import { authenticated } from '@/access/authenticated'
import { isAdmin } from '@/access/users'
import { siteCopyDefaults } from '@/serenity/siteCopy'

import { revalidatePublicSiteAfterGlobalChange } from '@/hooks/revalidatePublicSite'
import { imagePreviewField } from '@/admin/config'

const originalFields: Field[] = [
  { name: 'name', type: 'text', required: true, defaultValue: 'Serenity Club of Clearwater' },
  { name: 'legalName', type: 'text', defaultValue: 'Serenity Club of Clearwater, Inc.' },
  {
    name: 'tagline',
    type: 'textarea',
    defaultValue: 'A safe, supportive and empowering home for the local recovery community.',
  },
  { name: 'summary', type: 'textarea' },
  { name: 'address', type: 'text', defaultValue: '631 Turner Street' },
  { name: 'cityStateZip', type: 'text', defaultValue: 'Clearwater, FL 33756' },
  { name: 'phone', type: 'text', defaultValue: '(727) 461-5420' },
  { name: 'email', type: 'email', defaultValue: 'serenityclubclearwater@hotmail.com' },
  { name: 'hours', type: 'text', defaultValue: 'Open daily from 7am to 9pm.' },
  {
    name: 'donationUrl',
    validate: validateWebsiteURL,
    type: 'text',
    label: 'Online donation destination',
    access: { update: ({ req }) => isAdmin(req.user) },
    admin: {
      description:
        'Changes all Donate buttons. Verify the account and destination before saving; this does not change shop checkout links.',
    },
    defaultValue: 'https://square.link/u/ksu7yC0P',
  },
  {
    name: 'facebookUrl',
    validate: validateWebsiteURL,
    access: { update: ({ req }) => isAdmin(req.user) },
    type: 'text',
    defaultValue: 'https://www.facebook.com/SerenityClubofClearwater',
  },
  {
    name: 'instagramUrl',
    validate: validateWebsiteURL,
    access: { update: ({ req }) => isAdmin(req.user) },
    type: 'text',
    label: 'Instagram link (optional)',
    admin: { description: 'Shown in the site footer when filled in.' },
  },
  { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Homepage picture' },
  imagePreviewField('heroImage', 'heroImageUrl'),
  { name: 'heroImageUrl', type: 'text', label: 'Hero External Image URL' },
  {
    name: 'roomImage',
    type: 'upload',
    relationTo: 'media',
    label: 'Meeting room picture',
    admin: { description: 'Shown on Groups & facilities.' },
  },
  imagePreviewField('roomImage', 'roomImageUrl'),
  { name: 'roomImageUrl', type: 'text', label: 'Room External Image URL' },
  {
    name: 'logoImage',
    type: 'upload',
    relationTo: 'media',
    label: 'Earlier dues poster — retained for reference',
    admin: {
      description:
        'Use Membership dues reminder for the current message. This earlier poster is kept for reference and only appears when that editor chooses the earlier uploaded poster.',
    },
  },
  imagePreviewField('logoImage', 'logoImageUrl'),
  {
    name: 'logoImageUrl',
    type: 'text',
    label: 'Dues reminder external image URL',
    admin: { description: 'Advanced: used only when no reminder image is selected above.' },
  },
]
const selectFields = (names: string[]) =>
  originalFields.filter((field) => 'name' in field && names.includes(field.name))
const copyLabels: Record<keyof typeof siteCopyDefaults, string> = {
  aboutHistory: 'Club history',
  aboutWelcome: 'Who the clubhouse welcomes',
  aboutStewardship: 'How the club is managed',
  groupIntroduction: 'Groups page introduction',
  facilityInformation: 'Room and event inquiries',
  smallRoomInformation: 'Small room requests',
  sponsorshipInformation: 'Sponsorship terms and annual amount',
  sponsorshipContact: 'How to ask about sponsorship',
  donatedItemsInformation: 'Donating items',
  officeVolunteerInformation: 'Office volunteers',
  coffeeVolunteerInformation: 'Coffee bar volunteers',
}
const copyFields = (names: (keyof typeof siteCopyDefaults)[]): Field[] =>
  names.map((name) => ({
    name,
    type: 'textarea',
    label: copyLabels[name],
    defaultValue: siteCopyDefaults[name],
  }))

export const ClubSettings: GlobalConfig = {
  slug: 'clubSettings',
  label: 'Website details & wording',
  access: {
    read: () => true,
    update: authenticated,
    readVersions: authenticated,
  },
  admin: {
    group: 'Website details',
    hideAPIURL: true,
    description:
      'Saving updates the public website immediately. A manager can restore earlier saved settings from Previous versions. Donation and social links are managed by a website manager.',
  },
  versions: { max: 30 },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact & hours',
          fields: [
            ...selectFields(['address', 'cityStateZip', 'phone', 'email', 'hours']),
            {
              name: 'contactPreview',
              type: 'ui',
              admin: { components: { Field: '@/admin/ContactPreview' } },
            },
          ],
        },
        {
          label: 'Homepage & identity',
          fields: selectFields([
            'name',
            'legalName',
            'tagline',
            'summary',
            'heroImage',
            'heroImagePreview',
            'heroImageUrl',
          ]),
        },
        {
          label: 'About',
          fields: [
            ...copyFields(['aboutHistory', 'aboutWelcome', 'aboutStewardship']),
            ...selectFields(['logoImage', 'logoImagePreview', 'logoImageUrl']),
          ],
        },
        {
          label: 'Groups & facilities',
          fields: [
            ...copyFields(['groupIntroduction', 'facilityInformation', 'smallRoomInformation']),
            ...selectFields(['roomImage', 'roomImagePreview', 'roomImageUrl']),
          ],
        },
        {
          label: 'Giving & sponsorship',
          fields: copyFields([
            'sponsorshipInformation',
            'sponsorshipContact',
            'donatedItemsInformation',
            'officeVolunteerInformation',
            'coffeeVolunteerInformation',
          ]),
        },
        {
          label: 'Donation & social links',
          fields: selectFields(['donationUrl', 'facebookUrl', 'instagramUrl']),
        },
      ],
    },
  ],
  hooks: {
    beforeOperation: [
      ({ args, operation, req, overrideAccess }) => {
        // Payload restores globals directly in the adapter, bypassing field update access.
        if (operation === 'restoreVersion' && !overrideAccess && !isAdmin(req.user))
          throw new APIError(
            'Ask a website manager to restore shared settings; this also restores donation and social links.',
            403,
            undefined,
            true,
          )
        return args
      },
    ],
    afterChange: [revalidatePublicSiteAfterGlobalChange],
  },
}
