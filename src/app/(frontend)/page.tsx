import {
  ButtonLink,
  ContactBand,
  EventGrid,
  FeatureTiles,
  HomeHero,
  MeetingList,
  ProductGrid,
  SectionHeader,
  SerenityImage,
  SponsorStrip,
} from '@/serenity/ui'
import { ArrowRight, CalendarDays, HeartHandshake, ShoppingBag } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const data = await getSerenityData()
  const featuredMeetings = data.meetings.slice(0, 5)
  const featuredEvents = data.events.slice(0, 3)
  const featuredProducts = data.products.slice(0, 4)

  return (
    <main>
      <HomeHero settings={data.settings} />
      <ContactBand settings={data.settings} />

      <section className="bg-[#fbfaf7] px-4 py-16">
        <div className="container">
          <FeatureTiles />
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeader eyebrow="Recovery meetings" title="A full weekly meeting schedule">
              <p>
                The clubhouse hosts AA, NA, speaker meetings, and service meetings from morning
                through evening.
              </p>
            </SectionHeader>
            <ButtonLink href="/meeting-schedule" variant="secondary">
              <CalendarDays aria-hidden="true" />
              Full schedule
            </ButtonLink>
          </div>
          <MeetingList compact meetings={featuredMeetings} />
        </div>
      </section>

      <section className="bg-[#f7f2e8] px-4 py-16">
        <div className="container grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <SectionHeader eyebrow="Clubhouse" title="A member-supported space for recovery">
              <p>{data.settings.summary}</p>
            </SectionHeader>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/about" variant="primary">
                About the club
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/ways-to-give" variant="secondary">
                <HeartHandshake aria-hidden="true" />
                Ways to give
              </ButtonLink>
            </div>
          </div>
          {data.settings.roomImageUrl ? (
            <SerenityImage
              alt="Meeting room inside Serenity Club of Clearwater"
              className="aspect-[4/3] w-full rounded-lg object-cover shadow-sm"
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={data.settings.roomImageUrl}
            />
          ) : null}
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeader eyebrow="Events" title="Fellowship, fundraisers, and service">
              <p>Find current club events, speaker meetings, fundraisers, and service gatherings.</p>
            </SectionHeader>
            <ButtonLink href="/events" variant="secondary">
              All events
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
          <EventGrid events={featuredEvents} />
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-amber-200">
                Shop
              </p>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
                Memberships and club items
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Memberships and clubhouse items help keep Serenity Club open for meetings and
                fellowship.
              </p>
            </div>
            <ButtonLink href="/shop" variant="light">
              <ShoppingBag aria-hidden="true" />
              Visit shop
            </ButtonLink>
          </div>
          <div className="mt-8">
            <ProductGrid products={featuredProducts} />
          </div>
        </div>
      </section>

      <SponsorStrip sponsors={data.sponsors} />
    </main>
  )
}

export const metadata = {
  description:
    'Serenity Club of Clearwater hosts recovery meetings, fellowship, memberships, events, and support in downtown Clearwater, Florida.',
  title: 'Serenity Club of Clearwater',
}
