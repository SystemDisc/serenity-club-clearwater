'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Meeting } from '@/payload-types'
import {
  addCalendarDays,
  displayDate,
  displayTime,
  localDateKey,
  validDateKey,
} from '@/serenity/calendar'
import { resolveSchedule, formatLabels } from '@/serenity/schedule'
import { WEEKDAYS } from '@/serenity/meetings'

export default function MeetingsAgenda({ meetings }: { meetings: Meeting[] }) {
  const [query, setQuery] = useState('')
  const [date, setDate] = useState(() => localDateKey())
  const [day, setDay] = useState('')
  const [list, setList] = useState(false)
  const matches = meetings.filter((meeting) =>
    `${meeting.name} ${meeting.fellowship}`.toLowerCase().includes(query.toLowerCase()),
  )
  const dates = validDateKey(date)
    ? Array.from({ length: 7 }, (_, index) => addCalendarDays(date, index)).filter(
        (value) => !day || WEEKDAYS[new Date(`${value}T12:00:00Z`).getUTCDay()] === day,
      )
    : []
  return (
    <>
      <div className="club-agenda-controls">
        <label>
          Find a group
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, AA, NA, or Club"
          />
        </label>
        <label>
          Week starting
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Day
          <select value={day} onChange={(event) => setDay(event.target.value)}>
            <option value="">Every day</option>
            {[...WEEKDAYS.slice(1), WEEKDAYS[0]].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setList(!list)}>
          {list ? 'Show weekly agenda' : 'Show group list'}
        </button>
        <Link href="/admin/collections/meetings/create">Add a meeting</Link>
      </div>
      {list ? (
        <ul className="club-group-list">
          {matches.map((meeting) => (
            <li key={meeting.id}>
              <Link href={`/admin/collections/meetings/${meeting.id}`}>{meeting.name}</Link> ·{' '}
              {meeting.fellowship} ·{' '}
              {meeting._status === 'published' ? 'Published' : 'Draft changes'}
              {!meeting.checkedOn ? ' · Needs checking' : ''}
            </li>
          ))}
        </ul>
      ) : (
        dates.map((value) => {
          const entries = matches
            .flatMap((meeting) =>
              resolveSchedule(
                {
                  ...meeting,
                  sessions: meeting.sessions?.filter(
                    (session) => session.days?.length && session.time,
                  ),
                },
                value,
              ).map((session) => ({ meeting, session })),
            )
            .sort((a, b) => a.session.time.localeCompare(b.session.time))
          return (
            <section className="club-panel" key={value}>
              <h2>{displayDate(value)}</h2>
              {entries.length ? (
                <ul className="club-agenda-list">
                  {entries.map(({ meeting, session }) => {
                    const overlap =
                      session.room &&
                      entries.some(
                        (other) =>
                          other.meeting.id !== meeting.id &&
                          other.session.time === session.time &&
                          other.session.room?.trim().toLowerCase() ===
                            session.room?.trim().toLowerCase(),
                      )
                    return (
                      <li key={`${meeting.id}-${session.key}`}>
                        <strong>{displayTime(session.time)}</strong>
                        <div>
                          <Link href={`/admin/collections/meetings/${meeting.id}`}>
                            {meeting.name}
                          </Link>
                          <p>
                            {session.room || 'Room not specified'} ·
                            {session.confirmed
                              ? formatLabels[session.format || ''] || 'Format not specified'
                              : 'Format needs confirmation'}
                            {meeting._status !== 'published' ? ' · Draft changes waiting' : ''}
                          </p>
                          {overlap ? (
                            <p>
                              Another group starts in this room at the same time. Check whether this
                              is intended.
                            </p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p>No matching meetings on this date.</p>
              )}
            </section>
          )
        })
      )}
      <p>
        <a href="/meeting-schedule" target="_blank" rel="noreferrer">
          View the published meeting schedule ↗
        </a>
      </p>
    </>
  )
}
