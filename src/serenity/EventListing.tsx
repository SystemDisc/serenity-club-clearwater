import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'
import type { EventItem } from './content'
import { getEventArtwork } from './eventArtwork'
import { SerenityImage } from './ui'
import styles from './Events.module.css'

export function EventListing({ events }: { events: EventItem[] }) {
  return (
    <div className={styles.events}>
      {events.map((event) => {
        const artwork = getEventArtwork(event)
        const date = event.date ? new Date(`${event.date}T12:00:00Z`) : null
        return (
          <article className={styles.event} key={event.id || event.title}>
            <div className={styles.eventImage}>
              <SerenityImage
                alt={artwork.alt}
                src={artwork.src}
                className={styles.cover}
                sizes="(min-width: 1280px) 400px, (min-width: 1000px) 31vw, (min-width: 640px) 46vw, 100vw"
              />
            </div>
            <div className={styles.eventHeading}>
              {date ? (
                <div className={styles.date} aria-hidden="true">
                  <span>
                    {date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                  </span>
                  <strong>{date.getUTCDate()}</strong>
                </div>
              ) : null}
              <div>
                <p className={styles.eyebrow}>{event.category}</p>
                <h3>{event.title}</h3>
              </div>
            </div>
            <p className={styles.when}>
              <Clock3 aria-hidden="true" size={16} />
              <span>
                {event.dateLabel}
                {event.timeLabel ? ` · ${event.timeLabel}` : ''}
              </span>
            </p>
            <p className={styles.description}>{event.summary}</p>
            {event.location ? (
              <p className={styles.location}>
                <MapPin aria-hidden="true" size={16} />
                {event.location}
              </p>
            ) : null}
            {event.imageUrl || event.url ? (
              <div className={styles.eventLinks}>
                {event.imageUrl ? (
                  <a
                    href={event.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open original flyer or image for ${event.title}`}
                  >
                    View original flyer <ArrowUpRight aria-hidden="true" size={16} />
                  </a>
                ) : null}
                {event.url ? (
                  <a href={event.url} aria-label={`More details about ${event.title}`}>
                    More details <ArrowUpRight aria-hidden="true" size={16} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
