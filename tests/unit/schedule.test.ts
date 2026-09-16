import { describe, expect, it } from 'vitest'
import { localDateKey } from '../../src/serenity/calendar'
import { legacySchedule } from '../../src/serenity/legacySchedule'
import {
  nextOccurrences,
  resolveSchedule,
  scheduleErrors,
  type Schedule,
  type Session,
} from '../../src/serenity/schedule'

const session = (change: Partial<Session> = {}): Session => ({
  key: 'morning',
  recurrence: 'weekly',
  days: ['Monday', 'Tuesday'],
  time: '10:00',
  format: 'discussion',
  attendance: 'everyone',
  confirmed: true,
  ...change,
})

describe('the shared meeting occurrence resolver', () => {
  it('keeps different days and multiple sessions independent', () => {
    const schedule: Schedule = {
      sessions: [
        session({ days: ['Monday'] }),
        session({ key: 'study', days: ['Tuesday'], format: 'book', topic: 'A test book' }),
        session({ key: 'evening', days: ['Monday'], time: '19:00' }),
      ],
    }
    expect(scheduleErrors(schedule)).toEqual([])
    expect(resolveSchedule(schedule, '2026-09-14').map((s) => s.time)).toEqual(['10:00', '19:00'])
    expect(resolveSchedule(schedule, '2026-09-15')[0].format).toBe('book')
    expect(resolveSchedule(schedule, '2026-09-16')).toEqual([])
  })
  it('applies monthly variations before date changes and supports moved meetings', () => {
    const schedule: Schedule = {
      sessions: [
        session(),
        session({
          key: 'business',
          recurrence: 'monthly',
          ordinal: 'first',
          days: ['Monday'],
          replaces: 'morning',
          time: '11:00',
          format: 'business',
        }),
      ],
      exceptions: [
        {
          session: 'morning',
          date: '2026-10-05',
          action: 'change',
          movedTo: '2026-10-07',
          time: '12:00',
        },
      ],
    }
    expect(scheduleErrors(schedule)).toEqual([])
    expect(resolveSchedule(schedule, '2026-09-07')[0].format).toBe('business')
    expect(resolveSchedule(schedule, '2026-09-14')[0].format).toBe('discussion')
    expect(resolveSchedule(schedule, '2026-10-05')).toEqual([])
    expect(resolveSchedule(schedule, '2026-10-07')[0]).toMatchObject({
      key: 'business',
      time: '12:00',
      originalDate: '2026-10-05',
    })
  })
  it('cancels one occurrence without canceling the following week', () => {
    const schedule: Schedule = {
      sessions: [session()],
      exceptions: [{ session: 'morning', date: '2026-09-14', action: 'cancel' }],
    }
    expect(resolveSchedule(schedule, '2026-09-14')).toEqual([])
    expect(resolveSchedule(schedule, '2026-09-21')).toHaveLength(1)
  })
  it('handles last and fifth weekdays across month/year and leap-day boundaries', () => {
    const last: Schedule = {
      sessions: [session({ recurrence: 'monthly', ordinal: 'last', days: ['Thursday'] })],
    }
    expect(resolveSchedule(last, '2024-02-29')).toHaveLength(1)
    expect(resolveSchedule(last, '2024-02-22')).toHaveLength(0)
    const fifth: Schedule = {
      sessions: [session({ recurrence: 'monthly', ordinal: 'fifth', days: ['Monday'] })],
    }
    expect(nextOccurrences(fifth, '2026-12-01', 2).map((s) => s.date)).toEqual([
      '2027-03-29',
      '2027-05-31',
    ])
  })
  it('keeps local times stable through DST and respects effective dates', () => {
    const schedule: Schedule = {
      sessions: [
        session({ days: ['Sunday'], time: '07:00', from: '2026-03-08', until: '2026-11-01' }),
      ],
    }
    expect(resolveSchedule(schedule, '2026-03-01')).toHaveLength(0)
    expect(resolveSchedule(schedule, '2026-03-08')[0].time).toBe('07:00')
    expect(resolveSchedule(schedule, '2026-11-01')[0].time).toBe('07:00')
    expect(resolveSchedule(schedule, '2026-11-08')).toHaveLength(0)
    expect(localDateKey(new Date('2026-03-08T04:59:00Z'))).toBe('2026-03-07')
  })
  it('rejects overlapping rules and conflicting exceptions rather than picking one', () => {
    expect(
      scheduleErrors({ sessions: [session(), session({ key: 'duplicate' })] }).join(' '),
    ).toContain('overlap')
    const variations = [
      session(),
      session({
        key: 'last',
        recurrence: 'monthly',
        days: ['Monday'],
        ordinal: 'last',
        replaces: 'morning',
      }),
      session({
        key: 'fifth',
        recurrence: 'monthly',
        days: ['Monday'],
        ordinal: 'fifth',
        replaces: 'morning',
      }),
    ]
    expect(scheduleErrors({ sessions: variations }).join(' ')).toContain('overlap')
    expect(
      scheduleErrors({
        sessions: [session()],
        exceptions: [{ session: 'morning', date: '2026-09-16', action: 'cancel' }],
      }).join(' '),
    ).toContain('No matching session')
  })
  it('transfers known recurrence while retaining uncertainty about legacy formats', () => {
    const result = legacySchedule({
      id: 2,
      days: 'Monday through Saturday',
      time: '10:00 AM',
      room: 'Front room',
    })
    expect(result?.[0].days).toHaveLength(6)
    expect(result?.[0]).toMatchObject({ confirmed: false, format: 'unknown', time: '10:00' })
    expect(
      legacySchedule({ days: 'Second Wednesday of each month', time: '5:30 PM' })?.[0],
    ).toMatchObject({
      ordinal: 'second',
      recurrence: 'monthly',
      days: ['Wednesday'],
      time: '17:30',
    })
    expect(legacySchedule({ days: 'Monday except holidays', time: '10:00 AM' })).toBeNull()
  })
})
