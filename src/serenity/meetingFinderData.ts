import type { Meeting } from './content'
import { addCalendarDays, localDateKey, validDateKey } from './calendar'
import { CLUB_TIME_ZONE, meetingTimeToMinutes } from './meetings'
import { meetingsOnDate } from './publicMeetings'

export type DatedMeeting = Meeting & { dateKey: string }

export function clubClockMinutes(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  return (
    Number(parts.find((part) => part.type === 'hour')!.value) * 60 +
    Number(parts.find((part) => part.type === 'minute')!.value)
  )
}

export function meetingsForDate(meetings: Meeting[], dateKey: string): DatedMeeting[] {
  if (!validDateKey(dateKey)) return []
  // Noon UTC always falls on the requested calendar day in Clearwater, including DST.
  return meetingsOnDate(meetings, new Date(`${dateKey}T12:00:00Z`)).map((meeting) => ({
    ...meeting,
    dateKey,
  }))
}

export function isEarlierToday(meeting: Meeting, now: Date) {
  return meetingTimeToMinutes(meeting.time) < clubClockMinutes(now)
}

export function nextMeetings(meetings: Meeting[], now: Date, count = 3): DatedMeeting[] {
  if (!meetings.length || count <= 0) return []
  const today = localDateKey(now)
  const result: DatedMeeting[] = []
  for (let offset = 0; offset < 370 && result.length < count; offset++) {
    const dateKey = addCalendarDays(today, offset)
    result.push(
      ...meetingsForDate(meetings, dateKey).filter(
        (meeting) =>
          meetingTimeToMinutes(meeting.time) !== Number.MAX_SAFE_INTEGER &&
          (offset > 0 || !isEarlierToday(meeting, now)),
      ),
    )
  }
  return result.slice(0, count)
}
