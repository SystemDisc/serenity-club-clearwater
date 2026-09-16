import type { Meeting } from './content'

export const CLUB_TIME_ZONE = 'America/New_York'
export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export function clubCalendarDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)!.value
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: WEEKDAYS.indexOf(value('weekday') as (typeof WEEKDAYS)[number]),
  }
}

/** Conservative compatibility parser for existing records, pending reviewed structured schedules. */
export function meetingRunsOnDate(meeting: Pick<Meeting, 'days'>, date = new Date()): boolean {
  const { year, month, day, weekday } = clubCalendarDate(date)
  const text = meeting.days.trim().toLowerCase().replace(/\s+/g, ' ')
  if (/^(daily|every day)$/.test(text)) return true
  const names = WEEKDAYS.map((name) => name.toLowerCase())
  const monthly =
    /^(first|second|third|fourth|fifth|last) (sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?: of (?:each|the|every) month)?$/.exec(
      text,
    )
  if (monthly) {
    if (names[weekday] !== monthly[2]) return false
    return monthly[1] === 'last'
      ? day + 7 > new Date(Date.UTC(year, month, 0)).getUTCDate()
      : Math.ceil(day / 7) ===
          ['first', 'second', 'third', 'fourth', 'fifth'].indexOf(monthly[1]) + 1
  }
  const range =
    /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday) (?:through|to|[-–]) (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.exec(
      text,
    )
  if (range) {
    const start = names.indexOf(range[1])
    const end = names.indexOf(range[2])
    return (weekday - start + 7) % 7 <= (end - start + 7) % 7
  }
  const days = text
    .replace(/^every /, '')
    .split(/\s*(?:,|\band\b|&)\s*/)
    .filter(Boolean)
  // Never turn a partially understood monthly or exception rule into a weekly claim.
  return (
    days.length > 0 && days.every((name) => names.includes(name)) && days.includes(names[weekday])
  )
}

export function meetingTimeToMinutes(time: string) {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/i)

  if (!match) return Number.MAX_SAFE_INTEGER

  const [, hourText, minuteText = '0', periodText] = match
  const period = periodText.toUpperCase()
  let hour = Number(hourText)
  const minute = Number(minuteText)
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return Number.MAX_SAFE_INTEGER

  if (period === 'AM') {
    hour = hour === 12 ? 0 : hour
  } else {
    hour = hour === 12 ? 12 : hour + 12
  }

  return hour * 60 + minute
}

export function sortMeetingsByTime(a: Meeting, b: Meeting) {
  return (
    meetingTimeToMinutes(a.time) - meetingTimeToMinutes(b.time) ||
    a.days.localeCompare(b.days) ||
    a.name.localeCompare(b.name)
  )
}

export function sortedMeetingsByTime(meetings: Meeting[]) {
  return [...meetings].sort(sortMeetingsByTime)
}
