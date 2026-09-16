import { getPayload } from 'payload'
import config from '../src/payload.config'
import { localDateKey } from '../src/serenity/calendar'
import { legacySchedule } from '../src/serenity/legacySchedule'

const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })
try {
  const [events, meetings] = await Promise.all([
    payload.find({ collection: 'events', draft: true, depth: 0, limit: 0 }),
    payload.find({ collection: 'meetings', draft: false, depth: 0, limit: 0 }),
  ])
  const knownNames: Record<string, string> = {
    'Board of Trustees Meeting': 'Board of Trustees',
    'Intergroup Unity Speakers Meeting': 'Intergroup Unity Speakers Meeting',
  }
  for (const event of events.docs.filter((doc) => doc.kind === 'legacy')) {
    const group = meetings.docs.find((doc) => doc.name === knownNames[event.title])
    const oldRule = legacySchedule({ days: event.dateLabel, time: event.timeLabel })?.[0]
    const rule = group?.sessions?.length === 1 ? group.sessions[0] : null
    const sameSchedule =
      oldRule &&
      rule &&
      oldRule.time === rule.time &&
      oldRule.recurrence === rule.recurrence &&
      (oldRule.ordinal || '') === (rule.ordinal || '') &&
      [...oldRule.days].sort().join(',') === [...rule.days].sort().join(',')
    let update:
      { kind?: 'meeting'; meeting?: number; archived?: boolean; featured?: boolean } | undefined
    if (group && group._status === 'published' && sameSchedule)
      update = { kind: 'meeting', meeting: group.id }
    const monthMatch =
      /^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/.exec(
        event.dateLabel || '',
      )
    if (monthMatch && event.title === `${event.dateLabel} Events`) {
      const month =
        [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ].indexOf(monthMatch[1]) + 1
      if (`${monthMatch[2]}-${String(month).padStart(2, '0')}` < localDateKey().slice(0, 7))
        update = { archived: true, featured: false }
    }
    console.log(
      JSON.stringify({
        id: event.id,
        title: event.title,
        previous: { date: event.dateLabel, time: event.timeLabel },
        proposed: update || 'Needs manual review; unchanged',
        apply,
      }),
    )
    if (apply && update)
      await payload.update({
        collection: 'events',
        id: event.id,
        data: update,
        draft: event._status !== 'published',
        context: { disableRevalidate: true },
      })
  }
} finally {
  await payload.destroy()
}
process.exit(0)
