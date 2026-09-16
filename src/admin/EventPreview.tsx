'use client'
import { useFormFields } from '@payloadcms/ui'
import type { Event, Meeting } from '@/payload-types'
import { eventCalendarDetails } from '@/serenity/events'
import { useResource } from './useResource'

export default function EventPreview() {
  const fields = useFormFields(([fields]) => fields)
  const event = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value]),
  ) as Partial<Event>
  const meetingID = typeof event.meeting === 'object' ? event.meeting?.id : event.meeting
  const { value: meeting, error } = useResource<Meeting>(
    event.kind === 'meeting' && meetingID ? `/api/meetings/${meetingID}?depth=0&draft=false` : null,
  )
  const details = eventCalendarDetails({
    ...event,
    kind: event.kind || 'dated',
    meeting: meeting || null,
  })
  return (
    <section className="club-panel club-content-preview" aria-label="Event preview">
      <h2>What visitors will read</h2>
      <h3>{event.title || 'Your event title'}</h3>
      <p>
        {details.dateLabel || 'Choose a date or a published meeting schedule.'}
        {details.timeLabel ? ` · ${details.timeLabel}` : ''}
      </p>
      <p>{details.location || event.location}</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>
        {event.summary || 'Add a short description before publishing.'}
      </p>
      <p>
        {event.featured
          ? 'Also appears on the homepage while upcoming.'
          : 'Appears on the Events page.'}
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {!details.visible ? (
        <p>
          The selected meeting has no upcoming published occurrence. Review its schedule before
          publishing.
        </p>
      ) : null}
      <p>
        This preview uses your current form. Save a draft to keep working, or publish when ready.
      </p>
    </section>
  )
}
