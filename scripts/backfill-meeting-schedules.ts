import { getPayload } from 'payload'
import config from '../src/payload.config'
import { legacySchedule } from '../src/serenity/legacySchedule'

// Run through scripts/with-env.mjs with a reviewed environment. Dry-run is the default.
const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })
try {
  const { docs } = await payload.find({ collection: 'meetings', depth: 0, limit: 0, draft: true })
  const report = docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    status: doc._status,
    previous: {
      time: doc.time,
      days: doc.days,
      room: doc.room,
      format: doc.format,
      description: doc.description,
    },
    sessions: doc.sessions?.length ? doc.sessions : legacySchedule(doc),
    alreadyMigrated: !!doc.sessions?.length,
    review:
      'Days/time copied from the existing record. Format, attendance, special notes, and exceptions still require club confirmation.',
  }))
  console.log(JSON.stringify({ apply, report }, null, 2))
  if (report.some((item) => !item.sessions))
    throw new Error('Some recurrence text was not understood. No records were changed.')
  if (apply)
    for (const item of report.filter((item) => !item.alreadyMigrated)) {
      await payload.update({
        collection: 'meetings',
        id: item.id,
        draft: item.status !== 'published',
        data: { sessions: item.sessions!, _status: item.status },
        context: { disableRevalidate: true },
      })
    }
} finally {
  await payload.destroy()
}
process.exit(0)
