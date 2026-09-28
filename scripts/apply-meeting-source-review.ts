import { getPayload } from 'payload'
import config from '../src/payload.config'
import type { Meeting } from '../src/payload-types'

// Reviewed against Pinellas AA Intergroup, Bay Area NA, and the Club's October event notice.
// Dry-run by default. Run --apply only after the local schedule has been approved.
const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })

const sundayRecords = [
  {
    name: "Chairperson's Choice",
    order: 11,
    time: '07:00',
    displayTime: '7:00 AM',
    format: 'speaker',
    topic: null,
  },
  {
    name: 'Sunday Morning',
    order: 21,
    time: '10:00',
    displayTime: '10:00 AM',
    format: 'discussion',
    topic: null,
  },
  {
    name: 'Sunday Evening Big Book',
    order: 81,
    time: '20:00',
    displayTime: '8:00 PM',
    format: 'book',
    topic: 'Big Book',
  },
] as const

function requirePublished(records: Meeting[], name: string) {
  const record = records.find((item) => item.name === name)
  if (!record || record._status !== 'published' || !record.sessions?.length)
    throw new Error(`${name}: expected one published meeting with sessions.`)
  if (record.exceptions?.length)
    throw new Error(`${name}: date exceptions require a manual review before applying.`)
  return record
}

try {
  const result = await payload.find({ collection: 'meetings', draft: false, depth: 0, limit: 100 })
  const records = result.docs
  const changes: { record: Meeting; data: Partial<Meeting>; summary: string }[] = []

  const na = requirePublished(records, 'Serenity in Addiction')
  if (na.room !== 'Back room' || na.sessions!.some((session) => session.room !== 'Back room')) {
    if (na.sessions!.some((session) => !['Front room', 'Back room'].includes(session.room || '')))
      throw new Error('Serenity in Addiction: an unexpected room needs manual review.')
    changes.push({
      record: na,
      data: {
        room: 'Back room',
        sessions: na.sessions!.map((session) => ({ ...session, room: 'Back room' })),
      },
      summary: 'Set every Serenity in Addiction session to the back room',
    })
  }

  const byoc = requirePublished(records, 'BYOC Early Birds')
  if (byoc.sessions!.some((session) => session.days.includes('Sunday')) || byoc.room || !byoc.publicNotes) {
    if (byoc.sessions!.length !== 1)
      throw new Error('BYOC Early Birds: unexpected sessions need manual review.')
    changes.push({
      record: byoc,
      data: {
        days: 'Monday through Saturday',
        room: '',
        description: 'Bring Your Own Coffee (BYOC) meets Monday through Saturday mornings.',
        publicNotes: 'Bring Your Own Coffee (BYOC) meets Monday through Saturday mornings.',
        sessions: byoc.sessions!.map((session) => ({
          ...session,
          days: session.days.filter((day) => day !== 'Sunday'),
          room: null,
        })),
      },
      summary: 'Remove Sunday from BYOC and omit its unverified room',
    })
  }

  const turner = requirePublished(records, 'Turner Street Evening Group')
  if (turner.sessions!.some((session) => session.days.includes('Sunday')) || !turner.publicNotes) {
    changes.push({
      record: turner,
      data: {
        days: 'Monday through Saturday',
        description:
          'Turner Street meets in the front room Monday through Friday. Saturday night is the outdoor campfire meeting.',
        publicNotes:
          'Turner Street meets in the front room Monday through Friday. Saturday night is the outdoor campfire meeting.',
        sessions: turner.sessions!.map((session) => ({
          ...session,
          days: session.days.filter((day) => day !== 'Sunday'),
        })),
      },
      summary: 'Remove Sunday from Turner Street; keep the Saturday campfire',
    })
  }

  const board = requirePublished(records, 'Board of Trustees')
  if (board.room !== 'Back room' || board.sessions!.some((session) => session.room !== 'Back room')) {
    changes.push({
      record: board,
      data: {
        room: 'Back room',
        sessions: board.sessions!.map((session) => ({ ...session, room: 'Back room' })),
      },
      summary: 'Match the October board notice: back room',
    })
  }

  for (const change of changes) {
    console.log(`${apply ? 'UPDATE' : 'WOULD UPDATE'} ${change.record.name}: ${change.summary}`)
    if (apply)
      await payload.update({
        collection: 'meetings',
        id: change.record.id,
        data: { ...change.data, _status: 'published' },
        overrideLock: false,
      })
  }

  for (const item of sundayRecords) {
    if (records.some((record) => record.name === item.name)) {
      console.log(`KEEP ${item.name}: already exists; verify its details in Payload.`)
      continue
    }
    console.log(`${apply ? 'CREATE' : 'WOULD CREATE'} ${item.name}: Sunday ${item.displayTime}`)
    if (apply)
      await payload.create({
        collection: 'meetings',
        data: {
          name: item.name,
          fellowship: 'AA',
          days: 'Sunday',
          time: item.displayTime,
          room: '',
          order: item.order,
          sessions: [
            {
              key: `source-review-${item.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
              recurrence: 'weekly',
              days: ['Sunday'],
              time: item.time,
              room: null,
              format: item.format,
              topic: item.topic,
              attendance: 'unknown',
              confirmed: false,
            },
          ],
          _status: 'published',
        },
      })
  }
} finally {
  await payload.destroy()
}
process.exit(0)
