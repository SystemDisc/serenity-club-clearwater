import { describe, expect, it } from 'vitest'
import {
  clubCalendarDate,
  meetingRunsOnDate,
  meetingTimeToMinutes,
} from '../../src/serenity/meetings'

const runs = (days: string, date: string) => meetingRunsOnDate({ days }, new Date(date))

describe('legacy meeting dates in Clearwater', () => {
  it('includes every day of a range and supports ranges crossing Sunday', () => {
    expect(
      Array.from({ length: 7 }, (_, i) =>
        runs('Monday through Saturday', `2026-09-${14 + i}T16:00:00Z`),
      ),
    ).toEqual([true, true, true, true, true, true, false])
    expect(runs('Friday through Monday', '2026-09-20T16:00:00Z')).toBe(true)
    expect(runs('Friday through Monday', '2026-09-22T16:00:00Z')).toBe(false)
  })
  it('matches monthly ordinals only on their actual dates', () => {
    expect(runs('Second Wednesday of each month', '2026-09-09T16:00:00Z')).toBe(true)
    expect(runs('Second Wednesday of each month', '2026-09-16T16:00:00Z')).toBe(false)
    expect(runs('Last Wednesday', '2026-09-30T16:00:00Z')).toBe(true)
    expect(runs('Last Wednesday', '2026-09-23T16:00:00Z')).toBe(false)
    expect(runs('Fifth Wednesday', '2026-02-25T17:00:00Z')).toBe(false)
    expect(runs('Last Thursday', '2024-02-29T17:00:00Z')).toBe(true)
  })
  it('does not guess exceptions or partially understood schedules', () => {
    expect(runs('Monday and Wednesday', '2026-09-16T16:00:00Z')).toBe(true)
    expect(runs('Daily except Wednesday', '2026-09-16T16:00:00Z')).toBe(false)
    expect(runs('Second Wednesday and Friday', '2026-09-16T16:00:00Z')).toBe(false)
    expect(runs('', '2026-09-16T16:00:00Z')).toBe(false)
  })
  it('uses the local date across midnight, year boundaries, and DST', () => {
    expect(runs('Monday', '2026-09-15T02:00:00Z')).toBe(true)
    expect(clubCalendarDate(new Date('2027-01-01T02:00:00Z'))).toMatchObject({
      year: 2026,
      month: 12,
      day: 31,
    })
    for (const date of [
      '2026-03-08T06:30:00Z',
      '2026-03-08T07:30:00Z',
      '2026-11-01T05:30:00Z',
      '2026-11-01T06:30:00Z',
    ])
      expect(runs('Sunday', date)).toBe(true)
  })
  it('sorts noon and midnight while rejecting invalid hours and minutes', () => {
    expect(meetingTimeToMinutes('12:00 AM')).toBe(0)
    expect(meetingTimeToMinutes('12 PM')).toBe(720)
    expect(meetingTimeToMinutes('1:05 pm')).toBe(785)
    for (const value of ['0 AM', '13 PM', '1:60 PM', 'noon'])
      expect(meetingTimeToMinutes(value)).toBe(Number.MAX_SAFE_INTEGER)
  })
})
