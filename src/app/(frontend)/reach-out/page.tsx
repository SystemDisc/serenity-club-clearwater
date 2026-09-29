import Image from 'next/image'
import { mapLinks } from '@/serenity/siteCopy'
import { ButtonLink, PageHeader, SectionHeader } from '@/serenity/ui'
import { Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react'
import { getSerenityData } from '@/serenity/data'
import streetView from '@/serenity/artwork/street-view.webp'

export default async function ReachOutPage() {
  const { settings } = await getSerenityData([])
  const maps = mapLinks()
  return (
    <main>
      <PageHeader eyebrow="Come on in" title="Contact Serenity Club">
        <p>
          Your first visit starts here. Find us in downtown Clearwater for meetings, coffee, and
          fellowship.
        </p>
      </PageHeader>
      <section className="club-section">
        <div className="club-shell">
          <div className="club-split mb-10">
            <div>
              <p className="club-eyebrow">631 Turner Street</p>
              <h2>We’re glad you’re coming.</h2>
              <p>{settings.hours}</p>
              <div className="club-contacts">
                <a href={`tel:${settings.phone}`}>
                  <Phone aria-hidden="true" />
                  {settings.phone}
                </a>
                <a href={`mailto:${settings.email}`}>
                  <Mail aria-hidden="true" />
                  {settings.email}
                </a>
                <a href={maps.place} target="_blank" rel="noreferrer">
                  <MapPin aria-hidden="true" />
                  {settings.address}, {settings.cityStateZip}
                </a>
              </div>
              <div className="club-actions">
                <ButtonLink href={maps.directions}>
                  Get directions <ArrowUpRight aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/meeting-schedule" variant="secondary">
                  Find a meeting
                </ButtonLink>
              </div>
            </div>
            <iframe
              className="min-h-[360px] w-full border border-[#cbd3c5]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={maps.embed}
              title="Map to Serenity Club of Clearwater"
            />
          </div>
          <figure>
            <Image
              src={streetView}
              alt="Serenity Club as seen from Turner Street: the main entrance is on the left and the porch and coffee bar entrance are on the right"
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="club-wide-photo"
            />
            <figcaption className="club-photo-credit">
              View from Turner Street ·{' '}
              <a href={maps.place} target="_blank" rel="noreferrer">
                Google Maps Street View ↗
              </a>
            </figcaption>
          </figure>
          <div className="club-visit-facts">
            <article>
              <h2>Where to park</h2>
              <p>
                The parking lot is to the left of the main entrance. Accessible parking is
                available.
              </p>
            </article>
            <article>
              <h2>Find your entrance</h2>
              <p>
                Facing the Club from Turner Street, the main entrance is on the left. The porch and
                coffee bar entrance are on the right. It’s one building, and you can reach either
                side from either door.
              </p>
            </article>
            <article>
              <h2>Step-free access</h2>
              <p>
                Both front entrances have stairs. A side entrance has a ramp. Call us if you’d like
                help finding it when you arrive.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="club-section club-tint">
        <div className="club-shell">
          <SectionHeader eyebrow="Before you visit" title="A few helpful things to know" />
          <div className="club-questions">
            <details open>
              <summary>Do I need a membership to attend a meeting?</summary>
              <p>
                No. Non-members may access the Club 30 minutes before and after the meetings they
                attend. Membership supports the clubhouse and its amenities.
              </p>
            </details>
            <details>
              <summary>Can I reserve a small room?</summary>
              <p>{settings.smallRoomInformation}</p>
              <ButtonLink
                href={`mailto:${settings.email}?subject=Small%20room%20reservation%20request`}
                variant="secondary"
              >
                Request a room
              </ButtonLink>
            </details>
            <details>
              <summary>Who can help with meeting or group questions?</summary>
              <p>
                Call or email the Club for help with the schedule, meeting rooms, events, or hosting
                a recovery group.
              </p>
              <ButtonLink
                href={`mailto:${settings.email}?subject=Meeting%20or%20room%20question`}
                variant="secondary"
              >
                Email a question
              </ButtonLink>
            </details>
          </div>
        </div>
      </section>
    </main>
  )
}
export const metadata = {
  alternates: { canonical: '/reach-out' },
  title: 'Reach Out | Serenity Club of Clearwater',
}
