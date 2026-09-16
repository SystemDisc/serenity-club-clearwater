import { expect, it } from 'vitest'
import { splitMeetingDay } from '../../src/serenity/splitMeetingDay'
import { resolveSchedule, scheduleErrors, type Schedule } from '../../src/serenity/schedule'
import { addCalendarDays } from '../../src/serenity/calendar'

it('preserves monthly changes, canceled dates, and moved dates when separating a weekday', () => {
  const original: Schedule = {
    sessions: [
      {
        key: 'monthly',
        recurrence: 'monthly',
        ordinal: 'first',
        days: ['Monday', 'Tuesday'],
        time: '11:00',
        replaces: 'base',
        format: 'business',
      },
      {
        key: 'base',
        recurrence: 'weekly',
        days: ['Monday', 'Tuesday'],
        time: '10:00',
        format: 'discussion',
      },
    ],
    exceptions: [
      { session: 'base', date: '2026-09-14', action: 'cancel' },
      {
        session: 'base',
        date: '2026-09-21',
        action: 'change',
        movedTo: '2026-09-23',
        time: '12:00',
      },
      { session: 'monthly', date: '2026-10-05', action: 'change', time: '13:00' },
    ],
  }
  const before = structuredClone(original)
  let next = 0
  const split = splitMeetingDay(original, 'base', 'Monday', () => `new-${++next}`)
  expect(original).toEqual(before)
  expect(scheduleErrors(split)).toEqual([])
  const details = (schedule: Schedule, date: string) =>
    resolveSchedule(schedule, date).map(({ time, format, note, date: resolved }) => ({
      time,
      format,
      note,
      date: resolved,
    }))
  for (let index = 0; index < 42; index++) {
    const date = addCalendarDays('2026-09-01', index)
    expect(details(split, date), date).toEqual(details(original, date))
  }
  const monday = split.sessions!.find(
    (session) => session.recurrence === 'weekly' && session.days.includes('Monday'),
  )!
  monday.format = 'book'
  expect(resolveSchedule(split, '2026-09-28')[0].format).toBe('book')
  expect(resolveSchedule(split, '2026-09-29')[0].format).toBe('discussion')
})

it('does not create redundant single-day or monthly rows', () => {
  const schedule: Schedule = {
    sessions: [{ key: 'a', recurrence: 'weekly', days: ['Monday'], time: '09:00' }],
  }
  expect(splitMeetingDay(schedule, 'a', 'Monday')).toBe(schedule)
  expect(splitMeetingDay(schedule, 'missing', 'Monday')).toBe(schedule)
})
