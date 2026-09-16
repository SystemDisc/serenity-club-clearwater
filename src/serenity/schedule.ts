import { addCalendarDays, displayDate, displayTime, validDateKey, validLocalTime } from './calendar'
import { WEEKDAYS } from './meetings'

import type { Meeting as MeetingRecord } from '@/payload-types'

export type Session = NonNullable<MeetingRecord['sessions']>[number]
export type ScheduleException = NonNullable<MeetingRecord['exceptions']>[number]
export type Schedule = { sessions?: Session[] | null; exceptions?: ScheduleException[] | null }
export type Occurrence = Session & { date: string; originalDate: string; note?: string | null }

export const formatLabels: Record<string, string> = {
  discussion: 'Discussion',
  book: 'Book study',
  literature: 'Literature study',
  speaker: 'Speaker',
  beginner: 'Beginner',
  celebration: 'Celebration',
  business: 'Business meeting',
  other: 'Other',
}
export const attendanceLabels: Record<string, string> = {
  everyone: 'Everyone welcome',
  recovery: 'People seeking recovery',
  women: 'Women',
  men: 'Men',
  members: 'Club members',
}

function runs(session: Session, date: string) {
  if (session.from && date < session.from) return false
  if (session.until && date > session.until) return false
  const day = new Date(`${date}T12:00:00Z`)
  if (!session.days.includes(WEEKDAYS[day.getUTCDay()])) return false
  if (session.recurrence === 'weekly') return true
  if (session.ordinal === 'last') return addCalendarDays(date, 7).slice(0, 7) !== date.slice(0, 7)
  return (
    Math.ceil(day.getUTCDate() / 7) ===
    ['first', 'second', 'third', 'fourth', 'fifth'].indexOf(session.ordinal || '') + 1
  )
}

function recurring(schedule: Schedule, date: string): Session[] {
  const sessions = schedule.sessions || []
  const active = sessions.filter((session) => {
    if (!runs(session, date)) return false
    if (!session.replaces) return true
    const base = sessions.find((item) => item.key === session.replaces)
    return !!base && runs(base, date)
  })
  const replaced = new Set(active.map((session) => session.replaces).filter(Boolean))
  return active.filter((session) => !replaced.has(session.key))
}

/** Date exceptions apply to the resolved monthly/weekly session, then moves land on their new date. */
export function resolveSchedule(schedule: Schedule, date: string): Occurrence[] {
  if (!validDateKey(date)) throw new Error('Choose a valid calendar date.')
  const exceptions = schedule.exceptions || []
  const result: Occurrence[] = []
  const apply = (session: Session, originalDate: string, exception?: ScheduleException) => {
    if (exception?.action === 'cancel') return
    const targetDate = exception?.movedTo || originalDate
    if (targetDate !== date) return
    result.push({
      ...session,
      ...(exception?.action === 'change'
        ? {
            time: exception.time || session.time,
            room: exception.room ?? session.room,
            format: exception.format ?? session.format,
            topic: exception.topic ?? session.topic,
            attendance: exception.attendance ?? session.attendance,
            confirmed: exception.confirmed ?? session.confirmed,
            note: exception.note,
          }
        : {}),
      date,
      originalDate,
    })
  }
  for (const session of recurring(schedule, date)) {
    apply(
      session,
      date,
      exceptions.find(
        (item) => item.date === date && [session.key, session.replaces].includes(item.session),
      ),
    )
  }
  for (const exception of exceptions.filter(
    (item) => item.movedTo === date && item.date !== date,
  )) {
    const session = recurring(schedule, exception.date).find((item) =>
      [item.key, item.replaces].includes(exception.session),
    )
    if (session) apply(session, exception.date, exception)
  }
  return result.sort((a, b) => a.time.localeCompare(b.time) || a.key.localeCompare(b.key))
}

export function sessionDescription(session: Session) {
  const days = (session.days || []).join(', ')
  return `${session.recurrence === 'monthly' ? `${session.ordinal} ` : ''}${days} · ${displayTime(session.time)}`
}

export function nextOccurrences(schedule: Schedule, start: string, count = 4) {
  const result: Occurrence[] = []
  for (let offset = 0; offset < 370 && result.length < count; offset++) {
    result.push(...resolveSchedule(schedule, addCalendarDays(start, offset)))
  }
  return result.slice(0, count)
}

/** Validate ambiguity at the rule level, including distant effective dates and last/fifth overlaps. */
export function scheduleErrors(schedule: Schedule): string[] {
  const errors: string[] = []
  const sessions = schedule.sessions || []
  const keys = new Set<string>()
  for (const session of sessions) {
    const name = session.label || sessionDescription(session)
    if (!session.key || keys.has(session.key))
      errors.push(`${name}: each session needs its own identifier.`)
    keys.add(session.key)
    if (
      !session.days.length ||
      session.days.some((day) => !WEEKDAYS.includes(day as (typeof WEEKDAYS)[number]))
    )
      errors.push(`${name}: choose the days.`)
    if (!validLocalTime(session.time)) errors.push(`${name}: choose a valid time.`)
    if (session.recurrence === 'monthly' && !session.ordinal)
      errors.push(`${name}: choose which week of the month.`)
    if (
      (session.from && !validDateKey(session.from)) ||
      (session.until && !validDateKey(session.until))
    )
      errors.push(`${name}: use valid calendar dates.`)
    if (session.from && session.until && session.until < session.from)
      errors.push(`${name}: the last date is before the first date.`)
    if (session.confirmed && (!session.format || session.format === 'unknown'))
      errors.push(`${name}: choose a format before confirming it.`)
    if (session.replaces) {
      const base = sessions.find((item) => item.key === session.replaces)
      if (session.recurrence !== 'monthly' || !base || base.recurrence !== 'weekly')
        errors.push(`${name}: a monthly variation must replace an existing weekly session.`)
      else if (session.days.some((day) => !base.days.includes(day)))
        errors.push(`${name}: the variation must use a day of the session it replaces.`)
    }
  }
  for (let a = 0; a < sessions.length; a++)
    for (let b = a + 1; b < sessions.length; b++) {
      const first = sessions[a],
        second = sessions[b]
      const sameTarget = first.replaces && first.replaces === second.replaces
      const sameSlot = first.time === second.time && (first.room || '') === (second.room || '')
      if (!sameTarget && !sameSlot) continue
      if (!first.days.some((day) => second.days.includes(day))) continue
      if (
        (first.until && second.from && first.until < second.from) ||
        (second.until && first.from && second.until < first.from)
      )
        continue
      if (first.replaces === second.key || second.replaces === first.key) continue
      const monthOverlap =
        first.recurrence === 'weekly' ||
        second.recurrence === 'weekly' ||
        first.ordinal === second.ordinal ||
        ([first.ordinal, second.ordinal].includes('last') &&
          [first.ordinal, second.ordinal].some((value) => value === 'fourth' || value === 'fifth'))
      if (monthOverlap)
        errors.push(
          `${first.label || sessionDescription(first)} and ${second.label || sessionDescription(second)} overlap. Use a monthly variation, different time/room, or non-overlapping dates.`,
        )
    }
  const exceptions = schedule.exceptions || []
  const seen = new Set<string>()
  for (const exception of exceptions) {
    const key = `${exception.session}:${exception.date}`
    if (seen.has(key))
      errors.push(`There is more than one change for the same session on ${exception.date}.`)
    seen.add(key)
    if (!keys.has(exception.session))
      errors.push('Choose an existing session for each date change.')
    if (!validDateKey(exception.date) || (exception.movedTo && !validDateKey(exception.movedTo)))
      errors.push('Choose a valid date for each change.')
    else {
      const active = recurring(schedule, exception.date)
      if (!active.some((item) => [item.key, item.replaces].includes(exception.session)))
        errors.push(`No matching session normally meets on ${displayDate(exception.date)}.`)
      const matched = active.find((item) => [item.key, item.replaces].includes(exception.session))
      if (
        matched &&
        exceptions.some(
          (other) =>
            other !== exception &&
            other.date === exception.date &&
            [matched.key, matched.replaces].includes(other.session),
        )
      )
        errors.push('Two date changes target the same occurrence. Keep only one.')
    }
    if (exception.time && !validLocalTime(exception.time))
      errors.push('Choose a valid time for the changed date.')
  }
  if (!errors.length) {
    for (const date of new Set(
      exceptions.map((exception) => exception.movedTo || exception.date),
    )) {
      const occurrences = resolveSchedule(schedule, date)
      const slots = new Set<string>()
      for (const occurrence of occurrences) {
        const slot = `${occurrence.time}:${occurrence.room || ''}`
        if (slots.has(slot))
          errors.push(
            `The date changes create overlapping sessions on ${displayDate(date)}. Choose a different time or room.`,
          )
        slots.add(slot)
      }
    }
  }
  return [...new Set(errors)]
}
