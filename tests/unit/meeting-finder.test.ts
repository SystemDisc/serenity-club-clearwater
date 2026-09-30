import { describe, expect, it } from 'vitest'
import type { Meeting } from '../../src/serenity/content'
import { clubClockMinutes, meetingsForDate, nextMeetings } from '../../src/serenity/meetingFinderData'
const group = (changes: Partial<Meeting> = {}): Meeting => ({
  name: 'Recovery group',
  fellowship: 'AA',
  days: 'Daily',
  time: '7:00 PM',
  order: 0,
  ...changes,
})
describe('next meetings in Clearwater', () => {
  it('excludes elapsed meetings today and rolls to tomorrow after the last meeting', () => {
    const meetings = [group({ time: '9:00 AM' }), group({ time: '8:00 PM' })]
    expect(
      nextMeetings(meetings, new Date('2026-09-28T23:00:00Z'), 2).map((m) => [m.dateKey, m.time]),
    ).toEqual([
      ['2026-09-28', '8:00 PM'],
      ['2026-09-29', '9:00 AM'],
    ])
    expect(nextMeetings(meetings, new Date('2026-09-29T01:00:00Z'), 1)[0].dateKey).toBe(
      '2026-09-29',
    )
  })
  it('keeps the current minute, uses Eastern midnight, and does not invent unknown times', () => {
    const now = new Date('2026-09-29T03:30:00Z')
    expect(clubClockMinutes(now)).toBe(23 * 60 + 30)
    expect(
      nextMeetings([group({ time: '11:30 PM' }), group({ time: 'TBD' })], now, 1)[0],
    ).toMatchObject({ dateKey: '2026-09-28', time: '11:30 PM' })
    expect(nextMeetings([group({ time: 'TBD' })], now, 1)).toEqual([])
    expect(meetingsForDate([group({ time: 'TBD' })], '2026-09-28')).toHaveLength(1)
  })
  it('uses date changes, cancellations, and their updated rooms and notes', () => {
    const meetings = [
      group({
        sessions: [
          { key: 'am', recurrence: 'weekly', days: ['Monday'], time: '09:00', room: 'Main room' },
        ],
        exceptions: [
          {
            session: 'am',
            date: '2026-09-28',
            action: 'change',
            movedTo: '2026-09-29',
            time: '10:00',
            room: 'Back room',
            note: 'Moved this week',
          },
        ],
      }),
    ]
    expect(meetingsForDate(meetings, '2026-09-28')).toEqual([])
    expect(nextMeetings(meetings, new Date('2026-09-28T12:00:00Z'), 1)[0]).toMatchObject({
      dateKey: '2026-09-29',
      time: '10:00 AM',
      room: 'Back room',
      description: 'Moved this week',
    })
    const cancelled = group({
      sessions: meetings[0].sessions,
      exceptions: [{ session: 'am', date: '2026-09-28', action: 'cancel' }],
    })
    expect(nextMeetings([cancelled], new Date('2026-09-28T12:00:00Z'), 1)[0].dateKey).toBe(
      '2026-10-05',
    )
  })
  it('keeps local meeting times stable across spring and fall DST transitions', () => {
    for (const [now, expected] of [
      ['2026-03-08T06:30:00Z', '2026-03-08'],
      ['2026-11-01T06:30:00Z', '2026-11-01'],
    ]) {
      expect(nextMeetings([group({ time: '8:00 AM' })], new Date(now), 1)[0]).toMatchObject({
        dateKey: expected,
        time: '8:00 AM',
      })
    }
    expect(meetingsForDate([group()], '2026-02-30')).toEqual([])
  })
})
