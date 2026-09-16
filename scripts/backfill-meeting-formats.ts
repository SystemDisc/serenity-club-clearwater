import { getPayload } from 'payload'
import config from '../src/payload.config'
import type { Session } from '../src/serenity/schedule'

// Transcribed from the club's previous website, reviewed September 16, 2026.
// Source: https://eeparties.wixsite.com/serenityclub/meeting-schedule
// Historical evidence is not a fresh confirmation from the meeting's organizers.
const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const weekly = (
  key: string,
  selected: readonly string[],
  format: Session['format'],
  topic?: string,
): Partial<Session> => ({
  key,
  days: [...selected] as Session['days'],
  format,
  topic: topic || null,
  recurrence: 'weekly',
  ordinal: null,
  replaces: null,
})
const plans: Record<string, Partial<Session>[]> = {
  TGIF: [
    weekly(
      'tgif-discussion',
      ['Sunday', 'Monday', 'Wednesday', 'Friday', 'Saturday'],
      'discussion',
      'Open discussion',
    ),
    weekly('tgif-tuesday', ['Tuesday'], 'book', 'Big Book'),
    weekly('tgif-thursday', ['Thursday'], 'book', '12 Steps & 12 Traditions'),
  ],
  Feelings: [
    weekly('feelings-monday', ['Monday'], 'book', '12 Steps & 12 Traditions'),
    weekly('feelings-tuesday', ['Tuesday'], 'book', 'As Bill Sees It'),
    weekly('feelings-wednesday', ['Wednesday'], 'book', 'Big Book — stories'),
    weekly('feelings-thursday', ['Thursday'], 'book', 'Big Book — first 164 pages'),
    weekly('feelings-friday', ['Friday'], 'book', 'Living Sober'),
    weekly('feelings-saturday', ['Saturday'], 'discussion', 'Open discussion'),
  ],
  'Mid-Day': [weekly('midday-discussion', days, 'discussion', 'Open discussion')],
  'Intergroup Unity Speakers Meeting': [weekly('unity-speaker', ['Saturday'], 'speaker')],
  'Turner Street Evening Group': [
    weekly(
      'turner-regular',
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      'discussion',
      'Open discussion',
    ),
    {
      ...weekly('turner-campfire', ['Saturday'], 'other', 'Campfire meeting'),
      room: 'Campfire meeting',
    },
  ],
  'Serenity in Addiction': [
    weekly('sia-sunday', ['Sunday'], 'discussion', 'Open discussion'),
    weekly('sia-monday', ['Monday'], 'literature', 'It Works: How and Why'),
    weekly('sia-discussion', ['Tuesday', 'Thursday'], 'discussion', 'Open discussion'),
    weekly('sia-wednesday', ['Wednesday'], 'beginner', 'Steps 1, 2 & 3'),
    weekly('sia-friday', ['Friday'], 'literature', 'Basic Text'),
    weekly('sia-saturday', ['Saturday'], 'literature', 'IP discussion'),
    {
      ...weekly('sia-celebration', ['Sunday'], 'celebration'),
      recurrence: 'monthly',
      ordinal: 'last',
      replaces: 'sia-sunday',
    },
    {
      ...weekly('sia-speaker', ['Wednesday'], 'speaker'),
      recurrence: 'monthly',
      ordinal: 'last',
      replaces: 'sia-wednesday',
    },
    {
      ...weekly('sia-business', ['Monday'], 'business'),
      recurrence: 'monthly',
      ordinal: 'first',
      time: '20:00',
    },
  ],
}
try {
  const records = await payload.find({ collection: 'meetings', draft: true, depth: 0, limit: 100 })
  for (const [name, changes] of Object.entries(plans)) {
    const record = records.docs.find((item) => item.name === name)
    if (
      !record ||
      record.sessions?.length !== 1 ||
      record.sessions[0].format !== 'unknown' ||
      record.sessions[0].confirmed ||
      record.exceptions?.length ||
      record._status !== 'published'
    ) {
      console.log(
        JSON.stringify({
          name,
          action: 'Skipped: already edited or not a single unconfirmed legacy session',
        }),
      )
      continue
    }
    const { id: _rowID, ...base } = record.sessions[0]
    const sessions = changes.map((change) => ({
      ...base,
      ...change,
      confirmed: false,
      attendance: 'unknown' as const,
    }))
    console.log(JSON.stringify({ id: record.id, name, apply, sessions }))
    if (apply)
      await payload.update({
        collection: 'meetings',
        id: record.id,
        data: { sessions, _status: 'published' },
        context: { disableRevalidate: true },
        overrideLock: false,
      })
  }
} finally {
  await payload.destroy()
}
process.exit(0)
