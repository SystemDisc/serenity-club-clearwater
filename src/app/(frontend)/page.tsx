import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { ButtonLink, SerenityImage, SponsorStrip } from '@/serenity/ui'
import { getSerenityData } from '@/serenity/data'
import { siteMetadata } from '@/utilities/siteURL'
import { getMonthlyFlyers, displayMonth } from '@/serenity/flyers'
import { isPastEvent } from '@/serenity/events'
import { EventListing } from '@/serenity/EventListing'
import { NextMeetings } from '@/serenity/MeetingFinder'
import { mapLinks } from '@/serenity/siteCopy'

export default async function HomePage() {
  const data = await getSerenityData(['meetings', 'events', 'sponsors'])
  const flyers = await getMonthlyFlyers(data.events)
  const featuredEvents = data.events
    .filter((event) => event.featured !== false && !isPastEvent(event))
    .slice(0, 3)
  const maps = mapLinks()
  return (
    <main>
      <section className="club-hero">
        <div className="club-shell club-hero-grid">
          <div>
            <p className="club-eyebrow">Serenity Club of Clearwater · Est. 1969</p>
            <h1>
              Daily recovery meetings in <em>downtown Clearwater</em>
            </h1>
            <p className="club-lead">{data.settings.tagline}</p>
            <div className="club-actions">
              <ButtonLink href="/meeting-schedule">
                <CalendarDays aria-hidden="true" />
                Find a meeting
              </ButtonLink>
              <ButtonLink href="/reach-out" variant="secondary">
                Visit the Club <ArrowRight aria-hidden="true" />
              </ButtonLink>
            </div>
            <p className="club-address">
              {data.settings.hours}
              <br />
              <a
                href={maps.place}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 underline underline-offset-4"
              >
                <MapPin size={16} aria-hidden="true" />
                {data.settings.address} · {data.settings.cityStateZip}
              </a>
            </p>
          </div>
          <figure className="club-sign-stage">
            <div className="club-sign-frame">
              <Image
                alt="Illustration of the Serenity Club of Clearwater sign"
                src="/brand/serenity-sign.svg"
                width={550}
                height={492}
                priority
                sizes="(min-width: 760px) 45vw, 100vw"
                className="club-hero-sign"
              />
            </div>
          </figure>
        </div>
      </section>
      <NextMeetings meetings={data.meetings} initialNow={new Date().getTime()} />
      <section className="club-section">
        <div className="club-shell club-split">
          <div>
            <p className="club-eyebrow">Your place between meetings</p>
            <h2>
              Come for a meeting.
              <br />
              Stay for the fellowship.
            </h2>
            <p>{data.settings.summary}</p>
            <p>
              From a cup of coffee to a conversation with someone who understands, the Club offers a
              place to connect in recovery.
            </p>
            <div className="club-actions">
              <ButtonLink href="/about" variant="secondary">
                Get to know the Club <ArrowRight aria-hidden="true" />
              </ButtonLink>
            </div>
            <div className="club-note">
              <strong>Visiting for a meeting?</strong> You don’t need to be a member. Non-members
              may access the Club 30 minutes before and after the meetings they attend.
            </div>
          </div>
          {data.settings.roomImageUrl && (
            <SerenityImage
              src={data.settings.roomImageUrl}
              alt="The meeting room inside Serenity Club"
              sizes="(min-width: 760px) 45vw, 100vw"
              className="club-wide-photo aspect-[4/3]"
            />
          )}
        </div>
      </section>
      <section className="club-section club-tint">
        <div className="club-shell">
          <div className="club-row-heading">
            <div>
              <p className="club-eyebrow">Life at the Club</p>
              <h2>Good things happen together.</h2>
            </div>
            <ButtonLink href="/events" variant="secondary">
              All events <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
          <EventListing events={featuredEvents} />
          {flyers.current && (
            <div className="club-flyer-link">
              <p>{displayMonth(flyers.current.month)} at a glance</p>
              <Link className="club-text-link" href="/events">
                See the monthly flyer & all events →
              </Link>
            </div>
          )}
        </div>
      </section>
      <section className="club-section club-callout">
        <div className="club-shell club-row-heading !mb-0">
          <div>
            <p className="club-eyebrow !text-[#efc69f]">Member supported. Community minded.</p>
            <h2>Help keep the doors open.</h2>
            <p>
              Memberships, donations, and volunteers make this place possible. Be part of the
              everyday support that keeps Serenity Club here for the next person who needs it.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3">
            <ButtonLink href="/shop" variant="light">
              Become a member <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <Link className="club-text-link !text-white justify-center" href="/ways-to-give">
              More ways to give →
            </Link>
          </div>
        </div>
      </section>
      <SponsorStrip sponsors={data.sponsors} />
    </main>
  )
}
export const metadata = {
  alternates: { canonical: '/' },
  description: siteMetadata.description,
  title: siteMetadata.title,
}
