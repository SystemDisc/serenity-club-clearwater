'use client'

import { useFormFields, useRowLabel } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useState } from 'react'
import { displayDate, displayTime, localDateKey, validDateKey } from '@/serenity/calendar'
import {
  formatLabels,
  nextOccurrences,
  resolveSchedule,
  scheduleErrors,
  sessionDescription,
  type Schedule,
  type Session,
} from '@/serenity/schedule'

export function SessionRowLabel() {
  const { data } = useRowLabel<Session>()
  return (
    <span>
      {data.label ||
        (data.days?.length && data.time ? sessionDescription(data) : 'Choose days and time')}
      {data.confirmed ? ' · Checked' : ' · Format needs confirmation'}
    </span>
  )
}

export default function SchedulePreview() {
  const [date, setDate] = useState(() => localDateKey())
  const schedule = useFormFields(([fields]) => reduceFieldsToValues(fields, true) as Schedule)
  // Incomplete array rows are normal while typing; validation describes what remains.
  const usable: Schedule = {
    ...schedule,
    sessions: schedule.sessions?.map((s) => ({ ...s, days: s.days || [], time: s.time || '' })),
  }
  const errors = scheduleErrors(usable)
  const today = validDateKey(date) && !errors.length ? resolveSchedule(usable, date) : []
  const next = validDateKey(date) && !errors.length ? nextOccurrences(usable, date) : []
  return (
    <section className="club-panel club-admin">
      <h2>Check what visitors will see</h2>
      <label>
        Preview date{' '}
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      {errors.length ? (
        <ul aria-label="Schedule needs attention">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : (
        <>
          <p aria-live="polite">
            {today.length
              ? `${today.length} session${today.length === 1 ? '' : 's'} on this date`
              : 'No meeting on this date.'}
          </p>
          <ul>
            {today.map((session) => (
              <li key={session.key}>
                {displayTime(session.time)} · {session.room}
                {session.confirmed
                  ? ` · ${formatLabels[session.format || ''] || ''}${session.topic ? ` — ${session.topic}` : ''}`
                  : ' · Format still needs confirmation (not shown publicly)'}
                {session.note ? ` · ${session.note}` : ''}
              </li>
            ))}
          </ul>
          <h3>Next meeting dates</h3>
          <ul>
            {next.map((session) => (
              <li key={`${session.date}-${session.key}`}>
                {displayDate(session.date)} · {displayTime(session.time)}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
