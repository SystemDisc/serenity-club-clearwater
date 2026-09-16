import type { GlobalConfig } from 'payload'

import { revalidatePublicSiteAfterGlobalChange } from '@/hooks/revalidatePublicSite'
import { imagePreviewField } from '@/admin/config'

export const ClubSettings: GlobalConfig = {
  slug: 'clubSettings',
  label: 'Contact, pictures & dues',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Website details',
    hideAPIURL: true,
  },
  fields: [
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
    { name: 'donationUrl', type: 'text', defaultValue: 'https://square.link/u/ksu7yC0P' },
    {
      name: 'facebookUrl',
      type: 'text',
      defaultValue: 'https://www.facebook.com/SerenityClubofClearwater',
    },
    { name: 'instagramUrl', type: 'text' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'heroImageUrl', type: 'text', label: 'Hero External Image URL' },
    { name: 'roomImage', type: 'upload', relationTo: 'media' },
    { name: 'roomImageUrl', type: 'text', label: 'Room External Image URL' },
    {
      name: 'logoImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Membership dues reminder — About page',
      admin: {
        description:
          'This is the monthly dues graphic on About, not the header logo. Check the month before saving. Shared settings change the public website immediately.',
      },
    },
    imagePreviewField('logoImage', 'logoImageUrl'),
    {
      name: 'logoImageUrl',
      type: 'text',
      label: 'Dues reminder external image URL',
      admin: { description: 'Advanced: used only when no reminder image is selected above.' },
    },
  ],
  hooks: {
    afterChange: [revalidatePublicSiteAfterGlobalChange],
  },
}
