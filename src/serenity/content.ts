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
  tagline: 'A safe, supportive, and empowering home for Clearwater recovery.',
  summary:
    'Serenity Club is a nonprofit 501(c)(3) clubhouse with daily recovery meetings, fellowship, community events, memberships, and peer support rooted in 12-Step recovery principles.',
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
    room: 'Back room',
    format: 'Bring Your Own Coffee',
    description: 'Bring Your Own Coffee (BYOC) meets every morning in the back room.',
    order: 10,
  },
  {
    name: 'Feelings',
    fellowship: 'AA',
    time: '10:00 AM',
    days: 'Monday through Saturday',
    room: 'Front room',
    format: 'Book study and discussion',
    description:
      'The Feelings Group meets at 10am in the front room with rotating formats: 12 Steps and 12 Traditions, As Bill Sees It, Big Book stories, the first 164 pages, Living Sober, and open discussion.',
    order: 20,
  },
  {
    name: 'Women With Freedom',
    fellowship: 'AA',
    time: '10:00 AM',
    days: 'Wednesday',
    room: 'Back room',
    format: 'Closed women-only meeting',
    description: 'Women With Freedom meets Wednesday mornings in the back room.',
    order: 30,
  },
  {
    name: 'TGIF',
    fellowship: 'AA',
    time: '12:00 PM',
    days: 'Daily',
    room: 'Front room',
    format: 'Open discussion and book study',
    description:
      'TGIF meets at noon daily. Most days are open discussion, with Big Book study on Tuesday and 12 Steps and 12 Traditions study on Thursday.',
    order: 40,
  },
  {
    name: 'Mid-Day',
    fellowship: 'AA',
    time: '3:00 PM',
    days: 'Daily',
    room: 'Front room',
    format: 'Open discussion',
    description: 'The 3pm Mid-Day group meets seven days a week for open discussion.',
    order: 50,
  },
  {
    name: 'GOYA',
    fellowship: 'AA',
    time: '6:00 PM',
    days: 'Daily',
    room: 'Front room',
    format: 'Open discussion',
    description: 'GOYA meets at 6pm in the front room.',
    order: 60,
  },
  {
    name: 'Serenity in Addiction',
    fellowship: 'NA',
    time: '7:00 PM',
    days: 'Daily',
    room: 'Front room',
    format: 'NA meeting',
    description:
      'Serenity in Addiction rotates open discussion, literature study, beginner, speaker, celebration, and IP discussion formats. Its business meeting is the first Monday at 8pm.',
    order: 70,
  },
  {
    name: 'Turner Street Evening Group',
    fellowship: 'AA',
    time: '8:00 PM',
    days: 'Daily',
    room: 'Front room',
    format: 'Open discussion and campfire meeting',
    description:
      'Turner Street meets in the front room Sunday through Friday. Saturday night is the campfire meeting.',
    order: 80,
  },
  {
    name: 'Intergroup Unity Speakers Meeting',
    fellowship: 'AA',
    time: '8:00 PM',
    days: 'Saturday',
    room: 'Front room',
    format: 'Speaker meeting',
    description: 'Saturday speaker meeting with fellowship across local groups.',
    order: 90,
  },
  {
    name: 'Noon Group',
    fellowship: 'NA',
    time: '12:00 PM',
    days: 'Sunday',
    room: 'Back room',
    format: 'Open discussion',
    description: 'The NA Noon Group meets Sundays in the back room of the club.',
    order: 100,
  },
  {
    name: 'Board of Trustees',
    fellowship: 'Club',
    time: '5:30 PM',
    days: 'Second Wednesday of each month',
    room: 'Clubhouse',
    format: 'Club business',
    description: 'Monthly board meeting for club business and stewardship.',
    order: 110,
  },
]

export const fallbackEvents: EventItem[] = [
  {
    title: 'May 2026 Events',
    dateLabel: 'May 2026',
    timeLabel: 'See flyer',
    category: 'Community',
    summary:
      'The clubhouse posts a monthly flyer with fellowship, fundraisers, service opportunities, and special events.',
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
  {
    name: 'Glenn',
    role: 'Board President',
    bio: 'Serves the club through board leadership and stewardship.',
    order: 10,
  },
  {
    name: 'Sherry',
    role: 'Board Vice President',
    bio: 'Sherry has been a Serenity Club member since 2021 and has lived the recovery life for 16 years. She serves as a local substance abuse counselor, owns and operates S&S Enterprises and the business consulting nonprofit BobMob, and completed her MLS at UC College of Law in 2024. She is a mother of five, lives in Clearwater with her youngest child, partner, and pups, and is a member of Serenity in Addiction Group of NA and CR.',
    order: 20,
  },
  {
    name: 'Cyndi V',
    role: 'Board Treasurer',
    bio: 'Cyndi is a Serenity Club volunteer and serves as Board Treasurer. More information will be added when the club publishes an update.',
    order: 30,
  },
  {
    name: 'Charlene',
    role: 'Board Secretary',
    bio: 'Charlene has been a Serenity Club member since 2020 and volunteers at the coffee bar. She has been active in AA for 20 years, works as a sales manager for a surge manufacturer, and is married with seven children and 11 grandchildren.',
    order: 40,
  },
  {
    name: 'Coming soon',
    role: 'Alternate Treasurer',
    bio: 'Alternate treasurer information will be added when the club publishes an update.',
    order: 45,
  },
  {
    name: 'Jack',
    role: 'Board Member',
    bio: 'Jack has been a member of the Serenity Club of Clearwater and rejoined the Board at the April 2024 semi-annual membership meeting.',
    order: 50,
  },
  {
    name: 'Stephanie',
    role: 'Board Member',
    bio: 'Stephanie has been a Serenity Club member since 2023. Her home group is GOYA, where she has chaired meetings and served as Pinellas County Intergroup Representative. She volunteers at club events, has worked in customer service for 25 years, graduated from Everest University for Medical Administration in 2014, lives in Clearwater, and has served on the Board since 2024.',
    order: 60,
  },
  {
    name: 'Nancy',
    role: 'Club Manager',
    bio: 'Nancy has been involved with Serenity Club since 1989, where she began her recovery journey. She is retired from a 23-year restaurant management career, supports daily clubhouse operations, and lives in Dunedin with her husband, two dogs, and parrot.',
    order: 70,
  },
]

export const fallbackProducts: Product[] = [
  {
    title: 'Monthly Membership',
    slug: 'monthly-membership',
    price: '$10',
    description: 'Monthly dues for Serenity Club membership.',
    fulfillmentNote: 'Monthly memberships can be purchased at the clubhouse.',
    imageUrl:
      'https://static.wixstatic.com/media/ed8244_b097ed7e5323442189dfb29c80084744~mv2.png/v1/fit/w_500,h_500,q_90/file.png',
    imageAlt: 'Monthly Membership',
    order: 10,
  },
  {
    title: 'Annual Membership',
    slug: 'annual-membership',
    price: '$99',
    description: 'Save over $20 by paying annually for Serenity Club membership.',
    fulfillmentNote: 'Annual memberships can be purchased at the clubhouse.',
    imageUrl:
      'https://static.wixstatic.com/media/ed8244_4f0085be20aa4b9dbb5b805f5bcced3e~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg',
    imageAlt: 'Annual Membership',
    order: 20,
  },
  {
    title: 'Medallions',
    slug: 'medallions',
    price: '$2',
    description: 'Anniversary medallions are available for recovery milestones and celebrations.',
    fulfillmentNote: 'Available for purchase at the clubhouse.',
    imageUrl:
      'https://static.wixstatic.com/media/ed8244_d0ee1db61a5248bda9259efd9f9384fd~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg',
    imageAlt: 'Anniversary medallions',
    order: 30,
  },
  {
    title: 'Coffee Mug (image is sample)',
    slug: 'coffee-mug',
    price: '$10',
    badge: 'Best Seller',
    description: 'Souvenir coffee mug featuring the Serenity Club logo.',
    fulfillmentNote: 'Available for purchase at the clubhouse.',
    imageUrl:
      'https://static.wixstatic.com/media/ed8244_42156afcb5f640c495e074d99934cd41~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg',
    imageAlt: 'Coffee mug sample',
    order: 40,
  },
]

export const fallbackPolicies: Policy[] = [
  {
    title: 'Guest and Membership Use',
    body: 'Serenity Club is for members in good standing and guests. Pinellas County residents may use the club as guests up to four days in a 30-day period; non-Pinellas visitors may use the club as guests up to 30 days. Beyond those limits, a full monthly membership is required for non-meeting use. The Members Room is for people whose dues are current.',
    order: 10,
  },
  {
    title: 'Clubhouse Safety',
    body: 'The club has zero tolerance for violent, aggressive, or threatening behavior. No alcoholic beverages or illicit substances are allowed in the club or anywhere on club property.',
    order: 20,
  },
  {
    title: 'House Rules',
    body: 'No one may sleep overnight in the club or on the grounds. Panhandling, gambling, and pets are not permitted on club property. Children must not be left unsupervised, and shirts and shoes must be worn at all times.',
    order: 30,
  },
  {
    title: 'Posting, Discipline, and Permissions',
    body: 'Nothing may be placed on club walls or bulletin boards without permission from the Board or Club Manager. If a rule violation results in a person being asked to leave by authorized club personnel, the issue will be addressed at the next Board meeting.',
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
