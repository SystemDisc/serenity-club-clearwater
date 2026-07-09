import type { GlobalConfig } from 'payload'

export const ClubSettings: GlobalConfig = {
  slug: 'clubSettings',
  label: 'Club Settings',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Serenity Club',
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
    { name: 'facebookUrl', type: 'text', defaultValue: 'https://www.facebook.com/SerenityClubofClearwater' },
    { name: 'instagramUrl', type: 'text' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'heroImageUrl', type: 'text', label: 'Hero External Image URL' },
    { name: 'roomImage', type: 'upload', relationTo: 'media' },
    { name: 'roomImageUrl', type: 'text', label: 'Room External Image URL' },
    { name: 'logoImage', type: 'upload', relationTo: 'media' },
    { name: 'logoImageUrl', type: 'text', label: 'Logo External Image URL' },
  ],
}
