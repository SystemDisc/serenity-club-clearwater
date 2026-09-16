import { meetingTimeToMinutes, WEEKDAYS } from './meetings'
import type { Session } from './schedule'

/** Transfer only explicitly recorded days/time. Legacy format prose is evidence, never confirmation. */
export function legacySchedule(record: {
  id?: string | number
  days?: string | null
  time?: string | null
  room?: string | null
}): Session[] | null {
  const minutes = meetingTimeToMinutes(record.time || '')
  if (minutes === Number.MAX_SAFE_INTEGER) return null
  const text = (record.days || '').trim()
  let days: Session['days'] = []
  let ordinal: Session['ordinal']
  let recurrence: Session['recurrence'] = 'weekly'
  if (/^(daily|every day)$/i.test(text)) days = [...WEEKDAYS.slice(1), WEEKDAYS[0]]
  else {
    const monthly =
      /^(first|second|third|fourth|fifth|last) (\w+)(?: of (?:each|the|every) month)?$/i.exec(text)
    const range = /^(\w+) (?:through|to|[-–]) (\w+)$/i.exec(text)
    const dayName = (value: string) =>
      WEEKDAYS.find((day) => day.toLowerCase() === value.toLowerCase())
    if (monthly && dayName(monthly[2])) {
      recurrence = 'monthly'
      ordinal = monthly[1].toLowerCase() as Session['ordinal']
      days = [dayName(monthly[2])!]
    } else if (range && dayName(range[1]) && dayName(range[2])) {
      const start = WEEKDAYS.indexOf(dayName(range[1])!)
      const end = WEEKDAYS.indexOf(dayName(range[2])!)
      days = Array.from(
        { length: ((end - start + 7) % 7) + 1 },
        (_, index) => WEEKDAYS[(start + index) % 7],
      )
    } else {
      const list = text
        .replace(/^every /i, '')
        .split(/\s*(?:,|\band\b|&)\s*/)
        .map(dayName)
      if (list.some((day) => !day)) return null
      days = list as Session['days']
    }
  }
  if (!days.length) return null
  return [
    {
      key: `legacy-${record.id || 'session'}`,
      recurrence,
      days,
      ordinal,
      time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
      room: record.room,
      format: 'unknown',
      attendance: 'unknown',
      confirmed: false,
    },
  ]
}
