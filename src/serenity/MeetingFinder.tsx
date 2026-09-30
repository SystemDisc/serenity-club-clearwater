'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import type { Meeting } from './content'
import { addCalendarDays, displayDate, localDateKey, validDateKey } from './calendar'
import { isEarlierToday, meetingsForDate, nextMeetings, type DatedMeeting } from './meetingFinderData'

const minuteSnapshot = () => Math.floor(Date.now() / 60000) * 60000
const subscribeClock = (onChange: () => void) => {
  const timer = window.setInterval(onChange, 30000)
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}
function useClubNow(initialNow: number) {
  const timestamp = useSyncExternalStore(subscribeClock, minuteSnapshot, () => initialNow)
  return useMemo(() => new Date(timestamp), [timestamp])
}
const shortDate = (key: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${key}T12:00:00Z`))

function MeetingRows({ meetings }: { meetings: DatedMeeting[] }) {
  return meetings.map((meeting, index) => (
    <article className="club-meeting" key={`${meeting.id || meeting.name}-${index}`}>
      <time>{meeting.time}</time>
      <div>
        <p className="club-fellowship">
          {meeting.fellowship === 'Club' ? 'Club activity' : meeting.fellowship}
        </p>
        <h3>{meeting.name}</h3>
        {meeting.format && <p>{meeting.format}</p>}
        {meeting.formatUnconfirmed && <p>Check with the group for meeting format.</p>}
        {meeting.description && (
          <details>
            <summary>Meeting details</summary>
            <p>{meeting.description}</p>
          </details>
        )}
        {meeting.externalUrl && (
          <a className="club-text-link" href={meeting.externalUrl} target="_blank" rel="noreferrer">
            Group website ↗
          </a>
        )}
      </div>
      <p>{meeting.room || 'Ask the group for room details.'}</p>
    </article>
  ))
}

export function NextMeetings({
  meetings,
  initialNow,
}: {
  meetings: Meeting[]
  initialNow: number
}) {
  const now = useClubNow(initialNow)
  const upcoming = useMemo(
    () =>
      nextMeetings(
        meetings.filter((meeting) => meeting.fellowship !== 'Club'),
        now,
      ),
    [meetings, now],
  )
  const today = localDateKey(now)
  return (
    <section className="club-next-section club-tint">
      <div className="club-shell">
        <div className="club-next-heading">
          <h2>Coming up next</h2>
          <p>Recovery meetings · Eastern time</p>
          <Link className="club-text-link sm:ml-auto" href="/meeting-schedule">
            Full schedule →
          </Link>
        </div>
        {upcoming.length ? (
          <div className="club-next-list">
            {upcoming.map((meeting, index) => (
              <article key={`${meeting.id}-${meeting.dateKey}-${index}`}>
                <time>
                  {meeting.time}
                  <span className="block text-xs mt-1 font-normal">
                    {meeting.dateKey === today ? 'Today' : shortDate(meeting.dateKey)}
                  </span>
                </time>
                <h3>{meeting.name}</h3>
                <p>
                  {meeting.fellowship}
                  {meeting.room ? ` · ${meeting.room}` : ''}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p>See the full schedule for current group information.</p>
        )}
      </div>
    </section>
  )
}

export function MeetingFinder({
  meetings,
  initialNow,
}: {
  meetings: Meeting[]
  initialNow: number
}) {
  const now = useClubNow(initialNow)
  const today = localDateKey(now)
  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const [fellowship, setFellowship] = useState('All')
  const selected = chosenDate || today
  const filtered = useMemo(
    () => meetings.filter((meeting) => fellowship === 'All' || meeting.fellowship === fellowship),
    [meetings, fellowship],
  )
  const dated = useMemo(() => meetingsForDate(filtered, selected), [filtered, selected])
  const earlier = selected === today ? dated.filter((meeting) => isEarlierToday(meeting, now)) : []
  const remaining =
    selected === today ? dated.filter((meeting) => !isEarlierToday(meeting, now)) : dated
  const upcoming = useMemo(() => nextMeetings(filtered, now, 1)[0], [filtered, now])
  return (
    <section className="club-finder club-shell" aria-label="Meeting finder">
      <p className="club-eyebrow">Make room for recovery</p>
      <div className="club-filters" role="group" aria-label="Fellowship">
        {['All', 'AA', 'NA', 'Club'].map((value) => (
          <button
            type="button"
            className="club-filter"
            key={value}
            aria-pressed={fellowship === value}
            onClick={() => setFellowship(value)}
          >
            {value === 'All' ? 'All meetings' : value === 'Club' ? 'Club activities' : value}
          </button>
        ))}
      </div>
      <div className="club-days" role="group" aria-label="Meeting day">
        {Array.from({ length: 7 }, (_, index) => {
          const key = addCalendarDays(today, index)
          const day = new Date(`${key}T12:00:00Z`)
          return (
            <button
              type="button"
              className="club-day"
              aria-describedby={`meeting-day-${key}`}
              aria-pressed={selected === key}
              onClick={() => setChosenDate(index === 0 ? null : key)}
              key={key}
            >
              <span>
                {index === 0
                  ? 'Today'
                  : day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}
              </span>
              <strong>{day.getUTCDate()}</strong>
              <span>{day.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>
              <span className="sr-only" id={`meeting-day-${key}`}>
                {displayDate(key)}
              </span>
            </button>
          )
        })}
      </div>
      <label className="club-date-input">
        Choose another date{' '}
        <input
          type="date"
          value={selected}
          onChange={(event) => {
            if (validDateKey(event.target.value))
              setChosenDate(event.target.value === today ? null : event.target.value)
          }}
        />
      </label>
      <div className="club-meeting-heading">
        <h2>{selected === today ? 'Still to come today' : shortDate(selected)}</h2>
        <p role="status">
          {remaining.length} {remaining.length === 1 ? 'meeting' : 'meetings'} · All times Eastern
        </p>
      </div>
      {remaining.length ? (
        <MeetingRows meetings={remaining} />
      ) : (
        <div className="club-empty">
          <p>
            {selected === today
              ? 'No more listed meetings for this selection today.'
              : 'No listed meetings for this selection on this date.'}
          </p>
          {upcoming && (
            <button
              type="button"
              className="club-text-link"
              onClick={() => setChosenDate(upcoming.dateKey)}
            >
              Next available: {shortDate(upcoming.dateKey)} at {upcoming.time} →
            </button>
          )}
        </div>
      )}
      {earlier.length > 0 && (
        <details className="club-earlier">
          <summary>Earlier today ({earlier.length})</summary>
          <MeetingRows meetings={earlier} />
        </details>
      )}
      <p className="club-note">
        Meeting times and rooms reflect the published group schedule, including date-specific
        changes. Contact the Club if you need help choosing a meeting.
      </p>
    </section>
  )
}
