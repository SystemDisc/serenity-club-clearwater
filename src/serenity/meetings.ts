import type { Meeting } from './content'

export function meetingTimeToMinutes(time: string) {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/i)

  if (!match) return Number.MAX_SAFE_INTEGER

  const [, hourText, minuteText = '0', periodText] = match
  const period = periodText.toUpperCase()
  let hour = Number(hourText)
  const minute = Number(minuteText)

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
