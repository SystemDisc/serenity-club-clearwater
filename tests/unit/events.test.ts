import { expect, it } from 'vitest'
import { eventCalendarDetails, isPastEvent, sortEvents } from '../../src/serenity/events'

it('keeps an unannounced time separate from all-day and known-time events', () => {
  const event = { kind: 'dated' as const, date: '2026-09-19', timeMode: 'unannounced' as const }
  expect(eventCalendarDetails(event)).toMatchObject({
    date: '2026-09-19',
    timeLabel: 'Time not announced',
  })
  expect(eventCalendarDetails({ ...event, timeMode: 'allDay' }).timeLabel).toBe('All day')
  expect(eventCalendarDetails({ ...event, timeMode: 'known', startTime: '16:30' }).timeLabel).toBe(
    '4:30 PM',
  )
})

it('uses the last local calendar day for multi-day event placement', () => {
  const event = {
    title: 'Test',
    category: 'Community' as const,
    summary: '',
    order: 0,
    dateLabel: '',
    endDate: '2026-10-01',
  }
  expect(isPastEvent(event, '2026-09-30')).toBe(false)
  expect(isPastEvent(event, '2026-10-01')).toBe(false)
  expect(isPastEvent(event, '2026-10-02')).toBe(true)
})

it('derives the next monthly meeting date and honors cancellation from its authoritative schedule', () => {
  const event = {
    kind: 'meeting' as const,
    meeting: {
      id: 1,
      name: 'Synthetic board',
      fellowship: 'Club' as const,
      createdAt: '',
      updatedAt: '',
      _status: 'published' as const,
      sessions: [
        {
          key: 'board',
          recurrence: 'monthly' as const,
          ordinal: 'second' as const,
          days: ['Wednesday' as const],
          time: '17:30',
        },
      ],
      exceptions: [{ session: 'board', date: '2026-09-09', action: 'cancel' as const }],
    },
  }
  expect(eventCalendarDetails(event, '2026-09-01')).toMatchObject({
    date: '2026-10-14',
    timeLabel: '5:30 PM',
  })
  expect(
    eventCalendarDetails(
      { ...event, meeting: { ...event.meeting, _status: 'draft' } },
      '2026-09-01',
    ).visible,
  ).toBe(false)
})

it('orders same-day events by their known local time, with unannounced times last', () => {
  const base = {
    title: 'Event',
    category: 'Community' as const,
    summary: '',
    order: 100,
    dateLabel: '',
    date: '2026-09-19',
  }
  const events = [
    { ...base, id: 'evening', sortTime: '20:00' },
    { ...base, id: 'unknown' },
    { ...base, id: 'morning', sortTime: '10:00' },
    { ...base, id: 'all-day', sortTime: '00:00' },
  ]
  expect(sortEvents(events).map((event) => event.id)).toEqual([
    'all-day',
    'morning',
    'evening',
    'unknown',
  ])
})
