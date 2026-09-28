import Image from 'next/image'
import { ArrowDown, ArrowUpRight, HeartHandshake, MapPin } from 'lucide-react'
import { ButtonLink, EventGrid, SerenityImage } from '@/serenity/ui'
import { getSerenityData } from '@/serenity/data'
import { getMonthlyFlyers, displayMonth } from '@/serenity/flyers'
import { FlyerCard } from '@/serenity/FlyerCard'
import { localDateKey } from '@/serenity/calendar'
import { isPastEvent } from '@/serenity/events'
import { EventListing } from '@/serenity/EventListing'
import { communityArtwork } from '@/serenity/eventArtwork'
import styles from '@/serenity/Events.module.css'

export default async function EventsPage() {
  const data = await getSerenityData(['events'])
  const today = localDateKey()
  const flyers = await getMonthlyFlyers(data.events, today)
  const upcoming = data.events.filter((event) => !isPastEvent(event, today))
  const past = data.events.filter((event) => isPastEvent(event, today)).reverse()
  const currentFlyer = flyers.current
  const flyerImage =
    currentFlyer && typeof currentFlyer.image === 'object' ? currentFlyer.image : null
  const hasArchive = past.length > 0 || flyers.archive.length > 0

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Events &amp; fellowship</p>
            <h1>
              Good company.
              <br />
              Great things ahead.
            </h1>
            <p className={styles.heroDescription}>
              A movie, a little creativity, a chance to give back. There’s always a reason to get
              together at the Club.
            </p>
            <a className={styles.heroLink} href="#upcoming">
              See what’s coming up <ArrowDown aria-hidden="true" size={18} />
            </a>
          </div>
        </div>
        <div className={styles.heroImage}>
          <Image
            src={communityArtwork}
            alt="Illustrated coffee mugs, leaves, and a bright orange sun"
            sizes="(min-width: 640px) 46vw, 100vw"
            quality={85}
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </header>

      <nav className={styles.jumpNav} aria-label="On this events page">
        <div className={`container ${styles.jumpInner}`}>
          <div className={styles.jumpLinks}>
            <a href="#upcoming">Upcoming events</a>
            <a href="#monthly-flyer">Monthly flyer</a>
            {hasArchive ? <a href="#past-events">Past events</a> : null}
          </div>
          <p className={styles.address}>
            <MapPin aria-hidden="true" size={14} />
            631 Turner Street · Clearwater
          </p>
        </div>
      </nav>

      <section id="upcoming" className={styles.upcoming} aria-labelledby="upcoming-heading">
        <div className="container">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>On the calendar</p>
              <h2 id="upcoming-heading">Today &amp; upcoming</h2>
            </div>
            <p className={styles.sectionAside}>
              Make a plan. Bring a friend.
              <br />
              We’ll save you a place.
            </p>
          </div>
          {upcoming.length ? (
            <EventListing events={upcoming} />
          ) : (
            <p>Check the monthly flyer or ask at the coffee bar for upcoming activities.</p>
          )}
        </div>
      </section>

      <section id="monthly-flyer" className={styles.bulletin} aria-labelledby="flyer-heading">
        <div className={`container ${currentFlyer ? styles.bulletinInner : ''}`}>
          {flyerImage?.url ? (
            <a
              className={styles.flyerImage}
              href={flyerImage.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open full-size ${displayMonth(currentFlyer!.month)} events flyer`}
            >
              <SerenityImage
                src={flyerImage.url}
                alt={`${displayMonth(currentFlyer!.month)} illustrated events flyer. All details are available in the text beside this image.`}
                sizes="320px"
              />
            </a>
          ) : null}
          <div>
            <p className={styles.eyebrow}>From the club bulletin board</p>
            <h2 id="flyer-heading">
              {currentFlyer
                ? `${displayMonth(currentFlyer.month)} at the Club`
                : 'The monthly flyer'}
            </h2>
            {currentFlyer ? (
              <>
                <p className={styles.bulletinIntro}>
                  Keep the whole month handy. Find the event lineup, ways to help, and a few
                  reminders from your Club community.
                </p>
                {flyerImage?.url ? (
                  <ButtonLink href={flyerImage.url} variant="primary">
                    Open the full-size flyer <ArrowUpRight aria-hidden="true" size={18} />
                  </ButtonLink>
                ) : null}
                <details className={styles.bulletinDetails}>
                  <summary>Read all monthly updates as text</summary>
                  <p>{currentFlyer.details}</p>
                </details>
              </>
            ) : (
              <p className={styles.bulletinIntro}>
                The {displayMonth(today.slice(0, 7))} monthly flyer has not been posted yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {hasArchive ? (
        <section
          id="past-events"
          className={styles.archive}
          aria-label="Past events and monthly flyers"
        >
          <div className="container">
            {past.length ? (
              <details>
                <summary>Past events &amp; announcements</summary>
                <div className={styles.archiveContent}>
                  <EventGrid events={past} />
                </div>
              </details>
            ) : null}
            {flyers.archive.length ? (
              <details>
                <summary>Previous monthly flyers</summary>
                <div className={styles.archiveContent}>
                  {flyers.archive.map((flyer) => (
                    <details className="border-t border-slate-200" key={flyer.id}>
                      <summary>{displayMonth(flyer.month)}</summary>
                      <FlyerCard flyer={flyer} />
                    </details>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={styles.support}>
        <div className={`container ${styles.supportInner}`}>
          <div>
            <h2>Good things happen when we pitch in.</h2>
            <p>
              Memberships, donations, and a little of your time help keep the coffee brewing and the
              community gathering.
            </p>
          </div>
          <ButtonLink href={data.settings.donationUrl} variant="light">
            <HeartHandshake aria-hidden="true" />
            Support the Club
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  alternates: { canonical: '/events' },
  title: 'Events | Serenity Club of Clearwater',
  description:
    'Find upcoming events, speaker meetings, fundraisers, and ways to get involved at Serenity Club of Clearwater. View the current monthly flyer.',
}
