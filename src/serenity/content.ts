export type ClubSettings = {
  address: string
  cityStateZip: string
  donationUrl: string
  email: string
  facebookUrl?: string
  heroImageUrl?: string
  hours: string
  instagramUrl?: string
  legalName: string
  logoImageUrl?: string
  name: string
  phone: string
  roomImageUrl?: string
  summary: string
  tagline: string
}

export type Meeting = {
  days: string
  description?: string
  externalUrl?: string
  fellowship: 'AA' | 'NA' | 'Club'
  format?: string
  id?: string | number
  name: string
  order: number
  room?: string
  time: string
}

export type EventItem = {
  category: 'Fundraiser' | 'Meeting' | 'Service' | 'Community'
  dateLabel: string
  id?: string | number
  imageAlt?: string
  imageUrl?: string
  order: number
  summary: string
  timeLabel?: string
  title: string
  url?: string
}

export type TeamMember = {
  bio: string
  id?: string | number
  imageAlt?: string
  imageUrl?: string
  name: string
  order: number
  role: string
}

export type Product = {
  badge?: string
  checkoutUrl?: string
  description: string
  fulfillmentNote: string
  id?: string | number
  imageAlt?: string
  imageUrl?: string
  order: number
  price: string
  slug: string
  title: string
}

export type Policy = {
  body: string
  id?: string | number
  order: number
  title: string
}

export type Sponsor = {
  id?: string | number
  imageAlt?: string
  imageUrl?: string
  name: string
  order: number
  url?: string
}

export type SerenityData = {
  events: EventItem[]
  meetings: Meeting[]
  policies: Policy[]
  products: Product[]
  settings: ClubSettings
  sponsors: Sponsor[]
  teamMembers: TeamMember[]
}

export const fallbackClubSettings: ClubSettings = {
  name: 'Serenity Club of Clearwater',
  legalName: 'Serenity Club of Clearwater, Inc.',
  tagline:
    'A welcoming home for recovery meetings, fellowship, service, and support in downtown Clearwater.',
  summary:
    'Serenity Club is a nonprofit clubhouse serving Clearwater with daily meetings, community events, memberships, and a safe place to gather.',
  address: '631 Turner Street',
  cityStateZip: 'Clearwater, FL 33756',
  phone: '(727) 461-5420',
  email: 'serenityclubclearwater@hotmail.com',
  hours: 'Open daily from 9am to 9pm. Meetings run from 7am to 9pm.',
  donationUrl: 'https://square.link/u/ksu7yC0P',
  facebookUrl: 'https://www.facebook.com/SerenityClubofClearwater',
  heroImageUrl:
    'https://static.wixstatic.com/media/ed8244_829557240cb04a50862de8526a14f609~mv2.jpg/v1/crop/x_0,y_91,w_550,h_401,q_80,enc_avif,quality_auto/ed8244_829557240cb04a50862de8526a14f609~mv2.jpg',
  roomImageUrl:
    'https://static.wixstatic.com/media/ed8244_606c94b68a0b430d95cda0b6fd1f23e0~mv2.jpg/v1/fill/w_335,h_251,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/ed8244_606c94b68a0b430d95cda0b6fd1f23e0~mv2.jpg',
  logoImageUrl:
    'https://static.wixstatic.com/media/ed8244_b088b79451be435eb0e28c41e2ff09a9~mv2.png/v1/fill/w_738,h_522,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/image%20(1).png',
}

export const fallbackMeetings: Meeting[] = [
  {
    name: 'BYOC Early Birds',
    fellowship: 'AA',
    time: '7:00 AM',
    days: 'Daily',
    room: 'Main room',
    format: 'Open discussion',
    description: 'Morning recovery meeting. Bring your own coffee and start the day connected.',
    order: 10,
  },
  {
    name: 'Feelings',
    fellowship: 'AA',
    time: '10:00 AM',
    days: 'Monday, Tuesday, Thursday, Friday, Saturday',
    room: 'Main room',
    format: 'Discussion',
    description: 'A daily-topic meeting focused on honest sharing and listening well.',
    order: 20,
  },
  {
    name: 'Women With Freedom',
    fellowship: 'AA',
    time: '10:00 AM',
    days: 'Wednesday',
    room: 'Main room',
    format: 'Women only',
    description: 'A women-focused recovery meeting.',
    order: 30,
  },
  {
    name: 'TGIF',
    fellowship: 'AA',
    time: '12:00 PM',
    days: 'Friday',
    room: 'Main room',
    format: 'Open discussion',
    description: 'Friday noon fellowship and recovery discussion.',
    order: 40,
  },
  {
    name: 'Mid-Day',
    fellowship: 'AA',
    time: '3:00 PM',
    days: 'Daily',
    room: 'Main room',
    format: 'Open discussion',
    description: 'Afternoon meeting for people who need a mid-day reset.',
    order: 50,
  },
  {
    name: 'GOYA',
    fellowship: 'AA',
    time: '6:00 PM',
    days: 'Monday through Friday',
    room: 'Main room',
    format: 'Open discussion',
    description: 'Evening recovery meeting.',
    order: 60,
  },
  {
    name: 'Serenity in Addiction',
    fellowship: 'NA',
    time: '7:00 PM',
    days: 'Tuesday and Thursday',
    room: 'Main room',
    format: 'NA meeting',
    description: 'Narcotics Anonymous meeting hosted at Serenity Club.',
    order: 70,
  },
  {
    name: 'Turner Street Evening Group',
    fellowship: 'AA',
    time: '8:00 PM',
    days: 'Daily',
    room: 'Main room',
    format: 'Open discussion',
    description: 'Evening recovery meeting at the clubhouse.',
    order: 80,
  },
  {
    name: 'Intergroup Unity Speakers Meeting',
    fellowship: 'AA',
    time: '8:00 PM',
    days: 'Saturday',
    room: 'Main room',
    format: 'Speaker meeting',
    description: 'Saturday speaker meeting with fellowship across local groups.',
    order: 90,
  },
  {
    name: 'Noon Group',
    fellowship: 'AA',
    time: '12:00 PM',
    days: 'Sunday',
    room: 'Main room',
    format: 'Open discussion',
    description: 'Sunday noon meeting.',
    order: 100,
  },
  {
    name: 'Board of Trustees',
    fellowship: 'Club',
    time: '5:30 PM',
    days: 'Second Wednesday',
    room: 'Clubhouse',
    format: 'Club business',
    description: 'Monthly board meeting for club business and stewardship.',
    order: 110,
  },
]

export const fallbackEvents: EventItem[] = [
  {
    title: 'Monthly Events Flyer',
    dateLabel: 'Posted monthly',
    timeLabel: 'See flyer',
    category: 'Community',
    summary:
      'The clubhouse posts a monthly flyer with fellowships, fundraisers, service opportunities, and special events.',
    imageUrl:
      'https://static.wixstatic.com/media/ed8244_d702b1b8a63d491bbad6744196e0dd68~mv2.png/v1/fill/w_609,h_801,al_c,q_90,enc_avif,quality_auto/image%20(16).png',
    imageAlt: 'Monthly events flyer for Serenity Club of Clearwater',
    order: 10,
  },
  {
    title: 'Intergroup Unity Speakers Meeting',
    dateLabel: 'Every Saturday',
    timeLabel: '8:00 PM',
    category: 'Meeting',
    summary:
      'A weekly speaker meeting bringing local recovery groups together for experience, strength, and hope.',
    order: 20,
  },
  {
    title: 'Board of Trustees Meeting',
    dateLabel: 'Second Wednesday',
    timeLabel: '5:30 PM',
    category: 'Service',
    summary: 'Monthly board meeting for clubhouse operations, events, policies, and stewardship.',
    order: 30,
  },
]

export const fallbackTeamMembers: TeamMember[] = [
  { name: 'Glenn', role: 'Board President', bio: 'Serves the club through board leadership and stewardship.', order: 10 },
  { name: 'Sherry', role: 'Board Vice President', bio: 'Supports club operations, events, and service work.', order: 20 },
  { name: 'Cyndi V', role: 'Board Treasurer', bio: 'Helps steward club finances and member-supported operations.', order: 30 },
  { name: 'Charlene', role: 'Board Secretary', bio: 'Supports board records, communication, and service work.', order: 40 },
  { name: 'Jack', role: 'Board Member', bio: 'Serves the club and supports a welcoming recovery space.', order: 50 },
  { name: 'Stephanie', role: 'Board Member', bio: 'Contributes to events, service, and clubhouse support.', order: 60 },
  { name: 'Nancy', role: 'Club Manager', bio: 'Supports daily operations, member questions, and visitor needs.', order: 70 },
]

export const fallbackProducts: Product[] = [
  {
    title: 'Monthly Membership',
    slug: 'monthly-membership',
    price: '$10',
    description: 'A monthly membership helps keep the clubhouse open, clean, and available.',
    fulfillmentNote: 'Memberships can be purchased at the clubhouse.',
    order: 10,
  },
  {
    title: 'Annual Membership',
    slug: 'annual-membership',
    price: '$99',
    description: 'Annual membership supports Serenity Club for the year.',
    fulfillmentNote: 'Annual memberships can be purchased at the clubhouse.',
    order: 20,
  },
  {
    title: 'Medallions',
    slug: 'medallions',
    price: '$2',
    description: 'Recovery medallions are available for milestones and celebrations.',
    fulfillmentNote: 'Available for purchase at the clubhouse.',
    order: 30,
  },
  {
    title: 'Coffee Mug',
    slug: 'coffee-mug',
    price: '$10',
    badge: 'Best Seller',
    description: 'Serenity Club coffee mugs for members, friends, and supporters.',
    fulfillmentNote: 'Available for purchase at the clubhouse.',
    order: 40,
  },
]

export const fallbackPolicies: Policy[] = [
  {
    title: 'Respect the Meetings',
    body: 'Please keep conversations quiet around active meetings and help preserve anonymity, safety, and focus for everyone using the clubhouse.',
    order: 10,
  },
  {
    title: 'Keep the Clubhouse Safe',
    body: 'Serenity Club is a recovery-focused space. Threatening behavior, harassment, illegal activity, or disruption of meetings is not permitted.',
    order: 20,
  },
  {
    title: 'Help Keep the Space Clean',
    body: 'Please clean up after yourself, return chairs and supplies, and leave rooms ready for the next meeting or event.',
    order: 30,
  },
  {
    title: 'Group and Event Use',
    body: 'Groups and events hosted at the clubhouse should coordinate with club leadership so rooms, times, and expectations are clear.',
    order: 40,
  },
]

export const fallbackSponsors: Sponsor[] = []

export const fallbackSerenityData: SerenityData = {
  events: fallbackEvents,
  meetings: fallbackMeetings,
  policies: fallbackPolicies,
  products: fallbackProducts,
  settings: fallbackClubSettings,
  sponsors: fallbackSponsors,
  teamMembers: fallbackTeamMembers,
}
