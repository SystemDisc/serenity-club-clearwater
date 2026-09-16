import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { meetingsOnDate } from '@/serenity/publicMeetings'
import { resolveSchedule } from '@/serenity/schedule'

let payload: Payload
const ids: number[] = []
const context = { disableRevalidate: true }
beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  for (const id of ids) await payload.delete({ collection: 'meetings', id, context })
  await payload.destroy()
})

it('persists per-day details, protects confirmation notes, and rejects ambiguous publication', async () => {
  const draft = await payload.create({
    collection: 'meetings',
    data: { name: 'Synthetic schedule', fellowship: 'AA', _status: 'draft' },
    context,
  })
  ids.push(draft.id)
  await expect(
    payload.update({
      collection: 'meetings',
      id: draft.id,
      data: { _status: 'published' },
      context,
    }),
  ).rejects.toThrow()
  const published = await payload.update({
    collection: 'meetings',
    id: draft.id,
    context,
    data: {
      _status: 'published',
      checkedBy: 'Private test contact',
      sessions: [
        {
          key: 'monday',
          recurrence: 'weekly',
          days: ['Monday'],
          time: '10:00',
          format: 'discussion',
          confirmed: true,
        },
        {
          key: 'tuesday',
          recurrence: 'weekly',
          days: ['Tuesday'],
          time: '10:00',
          format: 'book',
          topic: 'Test book',
          confirmed: true,
        },
      ],
    },
  })
  expect(resolveSchedule(published, '2026-09-14')[0].format).toBe('discussion')
  expect(resolveSchedule(published, '2026-09-15')[0].format).toBe('book')
  const anonymous = await payload.findByID({
    collection: 'meetings',
    id: draft.id,
    overrideAccess: false,
  })
  expect(anonymous.checkedBy).toBeUndefined()
  await expect(
    payload.update({
      collection: 'meetings',
      id: draft.id,
      context,
      data: {
        exceptions: [
          { session: 'monday', date: '2026-09-14', action: 'change', movedTo: '2026-09-15' },
        ],
      },
    }),
  ).rejects.toThrow('sessions')
  const edited = await payload.update({
    collection: 'meetings',
    id: draft.id,
    context,
    data: {
      sessions: published.sessions?.map((s) =>
        s.key === 'tuesday' ? { ...s, confirmed: false } : s,
      ),
    },
  })
  const publicGroup = {
    name: edited.name,
    fellowship: edited.fellowship,
    sessions: edited.sessions,
    exceptions: edited.exceptions,
    time: '',
    days: '',
    order: 0,
  }
  const unconfirmed = meetingsOnDate([publicGroup], new Date('2026-09-15T16:00:00Z'))[0]
  expect(unconfirmed.format).toBe('Book study · Test book')
  expect(unconfirmed.formatUnconfirmed).toBe(true)
  expect(meetingsOnDate([publicGroup], new Date('2026-09-14T16:00:00Z'))[0].format).toBe(
    'Discussion',
  )
})
