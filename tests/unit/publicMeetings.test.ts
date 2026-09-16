import { describe, expect, it } from 'vitest'
import { regularMeetingRows, meetingsOnDate } from '../../src/serenity/publicMeetings'
import type { Meeting } from '../../src/serenity/content'
const group: Meeting = {
  id: 1,
  name: 'TGIF',
  fellowship: 'AA',
  order: 1,
  time: '12pm',
  days: 'Daily',
  format: 'Open discussion and book study',
  sessions: [
    {
      key: 'noon',
      recurrence: 'weekly',
      days: ['Tuesday'],
      time: '12:00',
      format: 'unknown',
      attendance: 'unknown',
      confirmed: false,
    },
  ],
}
const tuesday = new Date('2026-09-22T16:00:00Z')
describe('useful meeting format labels', () => {
  it('retains the earlier description while day-specific details await confirmation', () => {
    for (const row of [
      regularMeetingRows([group], tuesday)[0],
      meetingsOnDate([group], tuesday)[0],
    ]) {
      expect(row.format).toBe('Open discussion and book study')
      expect(row.formatUnconfirmed).toBe(true)
    }
  })
  it('uses a specific day format when available and clears the reminder when confirmed', () => {
    const specific = {
      ...group,
      sessions: [
        { ...group.sessions![0], format: 'book' as const, topic: 'Big Book', confirmed: true },
      ],
    }
    const row = meetingsOnDate([specific], tuesday)[0]
    expect(row.format).toBe('Book study · Big Book')
    expect(row.formatUnconfirmed).toBe(false)
  })
})
