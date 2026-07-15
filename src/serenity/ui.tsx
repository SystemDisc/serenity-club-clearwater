import {
  ArrowRight,
  CalendarDays,
  Clock,
  HeartHandshake,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import {
  SERENITY_GOOGLE_MAPS_PLACE_URL,
  type ClubSettings,
  type EventItem,
  type GalleryItem,
  type Meeting,
  type Policy,
  type Product,
  type Sponsor,
  type TeamMember,
} from './content'

export {
  fallbackPrimaryNavItems as primaryNavItems,
  fallbackSecondaryNavItems as secondaryNavItems,
} from './content'

const isExternalHref = (href: string) => href.startsWith('http')

export function SerenityImage({
  alt,
  className,
  priority = false,
  sizes = '(min-width: 1024px) 33vw, 100vw',
  src,
}: {
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
  src: string
}) {
  return (
    <Image
      alt={alt}
      className={className}
      fetchPriority={priority ? 'high' : undefined}
      height={900}
      loading={priority ? 'eager' : 'lazy'}
      quality={90}
      sizes={sizes}
      src={src}
      width={1200}
    />
  )
}

export function ButtonLink({
  children,
  className = '',
  href,
  variant = 'primary',
}: {
  children: React.ReactNode
  className?: string
  href: string
  variant?: 'primary' | 'secondary' | 'light'
}) {
  const classes = [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    variant === 'primary'
      ? 'bg-emerald-900 text-white hover:bg-emerald-800 focus-visible:outline-emerald-900'
      : '',
    variant === 'secondary'
      ? 'border border-slate-300 bg-white text-slate-950 hover:bg-slate-50 focus-visible:outline-slate-900'
      : '',
    variant === 'light'
      ? 'bg-white text-slate-950 hover:bg-amber-100 focus-visible:outline-white'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (isExternalHref(href)) {
    return (
      <a className={classes} href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    )
  }

  return (
    <Link className={classes} href={href}>
      {children}
    </Link>
  )
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  children?: React.ReactNode
  eyebrow?: string
  title: string
}) {
  return (
    <section className="bg-[#f7f2e8] px-4 py-10 text-slate-950 md:py-14">
      <div className="container max-w-5xl">
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-900">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">{title}</h1>
        {children ? (
          <div className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg md:leading-8">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  children,
  flush = false,
}: {
  children?: React.ReactNode
  eyebrow?: string
  flush?: boolean
  title: string
}) {
  return (
    <div className={`${flush ? 'mb-0' : 'mb-6'} max-w-3xl`}>
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">{title}</h2>
      {children ? <div className="mt-3 text-base leading-7 text-slate-700">{children}</div> : null}
    </div>
  )
}

export function HomeHero({ settings }: { settings: ClubSettings }) {
  return (
    <section className="overflow-x-clip bg-[#f7f2e8] px-4 pb-8 pt-4 text-slate-950 md:pb-14">
      <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.78fr)] lg:items-center">
        <div className="order-last max-w-3xl lg:order-first lg:py-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-900">
            Clearwater recovery clubhouse
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] md:text-6xl">
            Daily recovery meetings in downtown Clearwater
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
            {settings.tagline}
          </p>
          <p className="mt-4 max-w-2xl text-sm font-medium text-slate-600 md:text-base">
            {settings.hours} Located at {settings.address}, {settings.cityStateZip}.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/meeting-schedule" variant="primary">
              <CalendarDays aria-hidden="true" />
              Find a meeting
            </ButtonLink>
            <ButtonLink href={settings.donationUrl} variant="secondary">
              <HeartHandshake aria-hidden="true" />
              Donate
            </ButtonLink>
          </div>
        </div>
        {settings.heroImageUrl ? (
          <div className="relative z-10 order-first aspect-[4/3] w-full min-w-0 max-w-full overflow-visible lg:order-last">
            <div className="absolute inset-x-0 bottom-0 top-[11.2%] overflow-visible rounded-lg border border-slate-200 bg-white">
              <img
                alt="Serenity Club building sign at 631 Turner Street"
                className="absolute inset-x-0 top-[-12.62%] z-10 h-[112.62%] w-full max-w-full object-contain object-top"
                fetchPriority="high"
                loading="eager"
                src={settings.heroImageUrl}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function ContactBand({ settings }: { settings: ClubSettings }) {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-3">
      <div className="container grid gap-x-5 gap-y-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1.35fr)_minmax(0,1.55fr)]">
        <a
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-md hover:text-emerald-900"
          href={`tel:${settings.phone}`}
        >
          <Phone aria-hidden="true" className="size-5 shrink-0 text-emerald-900" />
          <span className="min-w-0 whitespace-nowrap">{settings.phone}</span>
        </a>
        <a
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-md hover:text-emerald-900"
          href={`mailto:${settings.email}`}
        >
          <Mail aria-hidden="true" className="size-5 shrink-0 text-emerald-900" />
          <span className="min-w-0 break-all">{settings.email}</span>
        </a>
        <a
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-md hover:text-emerald-900 sm:col-span-2 lg:col-span-1"
          href={SERENITY_GOOGLE_MAPS_PLACE_URL}
          rel="noreferrer"
          target="_blank"
        >
          <MapPin aria-hidden="true" className="size-5 shrink-0 text-emerald-900" />
          <span className="min-w-0 break-words">
            {settings.address}, {settings.cityStateZip}
          </span>
        </a>
      </div>
    </section>
  )
}

export function MeetingList({
  meetings,
  compact = false,
}: {
  compact?: boolean
  meetings: Meeting[]
}) {
  return (
    <div className="grid gap-3">
      {meetings.map((meeting) => (
        <article
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[9rem_1fr_8rem]"
          key={`${meeting.name}-${meeting.time}-${meeting.days}`}
        >
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Clock aria-hidden="true" className="size-4" />
              {meeting.time}
            </p>
            <p className="mt-1 text-sm text-slate-600">{meeting.days}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{meeting.name}</h3>
            {!compact && meeting.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-700">{meeting.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.1em]">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-900">
                {meeting.fellowship}
              </span>
              {meeting.format ? (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-900">
                  {meeting.format}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-sm text-slate-600 md:text-right">{meeting.room}</div>
        </article>
      ))}
    </div>
  )
}

export function EventGrid({
  events,
  headingLevel = 'h3',
}: {
  events: EventItem[]
  headingLevel?: 'h2' | 'h3'
}) {
  const EventHeading = headingLevel

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {events.map((event) => (
        <article
          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          key={event.title}
        >
          {event.imageUrl ? (
            <a
              aria-label={`Open original image for ${event.title}`}
              className="block bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-900"
              href={event.imageUrl}
              rel="noreferrer"
              target="_blank"
            >
              <SerenityImage
                alt={event.imageAlt || event.title}
                className="aspect-[4/3] w-full object-contain"
                sizes="(min-width: 768px) 33vw, 100vw"
                src={event.imageUrl}
              />
            </a>
          ) : null}
          <div className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-900">
              {event.category}
            </p>
            <EventHeading className="mt-2 text-xl font-semibold text-slate-950">
              {event.title}
            </EventHeading>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {event.dateLabel}
              {event.timeLabel ? ` | ${event.timeLabel}` : ''}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{event.summary}</p>
            {event.url ? (
              <ButtonLink className="mt-5" href={event.url} variant="secondary">
                Details
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item) => (
        <figure
          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          key={`${item.title}-${item.imageUrl || item.id}`}
        >
          {item.imageUrl ? (
            <a
              aria-label={`Open original image for ${item.title}`}
              className="block bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-900"
              href={item.imageUrl}
              rel="noreferrer"
              target="_blank"
            >
              <SerenityImage
                alt={item.imageAlt || item.title}
                className="aspect-[4/3] w-full object-contain"
                sizes="(min-width: 768px) 33vw, 100vw"
                src={item.imageUrl}
              />
            </a>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-500">
              <ImageIcon aria-hidden="true" className="size-10" />
            </div>
          )}
          <figcaption className="p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-900">
              {item.category}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.title}</h2>
            {item.description ? (
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          className="group flex min-h-full flex-col rounded-lg border-2 border-white bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
          href={`/shop/${product.slug}`}
          key={product.slug}
        >
          {product.imageUrl ? (
            <SerenityImage
              alt={product.imageAlt || product.title}
              className="mb-4 aspect-square w-full rounded-md object-cover"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src={product.imageUrl}
            />
          ) : (
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-emerald-50 text-emerald-900">
              <ShoppingBag aria-hidden="true" className="size-7" />
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">{product.title}</h3>
            <p className="font-semibold text-emerald-900">{product.price}</p>
          </div>
          {product.badge ? (
            <p className="mt-2 w-fit rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-amber-950">
              {product.badge}
            </p>
          ) : null}
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">
            {product.description}
          </p>
          <div className="mt-auto pt-5">
            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-900 px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-800">
              View item
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SC'

export function TeamGrid({ teamMembers }: { teamMembers: TeamMember[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {teamMembers.map((member) => (
        <article
          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          key={`${member.name}-${member.role}`}
        >
          <div className="aspect-[4/5] bg-slate-100">
            {member.imageUrl ? (
              <SerenityImage
                alt={member.imageAlt || member.name}
                className="h-full w-full object-cover object-top"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                src={member.imageUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-950 text-3xl font-semibold text-white">
                {getInitials(member.name)}
              </div>
            )}
          </div>
          <div className="p-5">
            <h3 className="text-xl font-semibold text-slate-950">{member.name}</h3>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-900">
              {member.role}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{member.bio}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

export function PolicyList({ policies }: { policies: Policy[] }) {
  return (
    <div className="grid gap-4">
      {policies.map((policy) => (
        <article className="rounded-lg border border-slate-200 bg-white p-5" key={policy.title}>
          <h2 className="text-xl font-semibold text-slate-950">{policy.title}</h2>
          <p className="mt-3 leading-7 text-slate-700">{policy.body}</p>
        </article>
      ))}
    </div>
  )
}

export function SponsorStrip({ sponsors }: { sponsors: Sponsor[] }) {
  if (!sponsors.length) return null

  return (
    <section className="bg-white px-4 py-12">
      <div className="container">
        <SectionHeader eyebrow="Supporters" title="Community sponsors" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {sponsors.map((sponsor) => {
            const content = (
              <div className="flex min-h-28 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 text-center font-semibold text-slate-800">
                {sponsor.imageUrl ? (
                  <SerenityImage
                    alt={sponsor.imageAlt || sponsor.name}
                    className="max-h-20 max-w-full object-contain"
                    sizes="(min-width: 768px) 25vw, 50vw"
                    src={sponsor.imageUrl}
                  />
                ) : (
                  sponsor.name
                )}
              </div>
            )

            return sponsor.url ? (
              <a href={sponsor.url} key={sponsor.name} rel="noreferrer" target="_blank">
                {content}
              </a>
            ) : (
              <div key={sponsor.name}>{content}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FeatureTiles() {
  const features = [
    {
      icon: CalendarDays,
      title: '12-Step support',
      text: 'Recovery principles and support for one another help people pursue and maintain abstinence.',
    },
    {
      icon: Users,
      title: 'Fellowship space',
      text: 'A safe, supportive, and empowering clubhouse for members, visitors, groups, and the broader recovery community.',
    },
    {
      icon: HeartHandshake,
      title: 'Member supported',
      text: 'Memberships, donations, events, and volunteers help keep the doors open.',
    },
  ]

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {features.map(({ icon: Icon, title, text }) => (
        <article className="rounded-lg border border-slate-200 bg-white p-5" key={title}>
          <Icon aria-hidden="true" className="size-7 text-emerald-900" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{text}</p>
        </article>
      ))}
    </div>
  )
}
