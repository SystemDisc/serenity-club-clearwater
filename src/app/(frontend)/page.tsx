import {
  ButtonLink,
  ContactBand,
  EventGrid,
  FeatureTiles,
  HomeHero,
  ProductGrid,
  SectionHeader,
  SerenityImage,
  SponsorStrip,
} from '@/serenity/ui'
import { ArrowRight, CalendarDays, HeartHandshake, ShoppingBag } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'
import { sortedMeetingsByTime } from '@/serenity/meetings'
import { siteMetadata } from '@/utilities/siteURL'

export default async function HomePage() {
  const data = await getSerenityData()
  const sortedMeetings = sortedMeetingsByTime(data.meetings)
  const recoveryMeetings = sortedMeetings.filter((meeting) => meeting.fellowship !== 'Club')
  const firstMeeting = recoveryMeetings[0]
  const lastMeeting = recoveryMeetings[recoveryMeetings.length - 1]
  const featuredEvents = data.events.slice(0, 3)
  const featuredProducts = data.products.slice(0, 4)

  return (
    <main>
      <HomeHero settings={data.settings} />
      <ContactBand settings={data.settings} />

      <section className="bg-[#fbfaf7] px-4 py-12">
        <div className="container">
          <FeatureTiles />
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeader eyebrow="Recovery meetings" flush title="Meetings throughout the day">
              <p>
                The full schedule changes by day and fellowship, so the home page points directly to
                the complete list instead of showing a partial schedule.
              </p>
            </SectionHeader>
            <ButtonLink href="/meeting-schedule" variant="secondary">
              <CalendarDays aria-hidden="true" />
              Full schedule
            </ButtonLink>
          </div>
          <div className="mt-6 md:mt-8">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-900">
                  First listed meeting
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {firstMeeting?.time || 'Morning'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {firstMeeting
                    ? `${firstMeeting.name} runs ${firstMeeting.days}.`
                    : data.settings.hours}
                </p>
              </article>
              <article className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-900">
                  Evening options
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {lastMeeting?.time || 'Evening'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {lastMeeting
                    ? `${lastMeeting.name} is one of the later recovery meetings.`
                    : 'Meetings continue into the evening.'}
                </p>
              </article>
              <article className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-900">
                  Complete schedule
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {data.meetings.length} meetings
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  See the complete AA, NA, and club service schedule before visiting.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f2e8] px-4 py-12">
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
              className="aspect-[4/3] w-full rounded-lg object-cover"
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={data.settings.roomImageUrl}
            />
          ) : null}
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeader eyebrow="Events" flush title="Fellowship, fundraisers, and service">
              <p>
                Find current club events, speaker meetings, fundraisers, and service gatherings.
              </p>
            </SectionHeader>
            <ButtonLink href="/events" variant="secondary">
              All events
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="mt-6 md:mt-8">
            <EventGrid events={featuredEvents} />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-12 text-white">
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
  description: siteMetadata.description,
  title: siteMetadata.title,
}
