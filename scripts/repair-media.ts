import { readFile, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { isLocalDatabase } from '../src/utilities/databaseSafety'
import { prepareMediaRepair, type MediaRepair } from '../src/utilities/mediaRepair'

const args = process.argv.slice(2)
const option = (name: string) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
const manifestPath = option('--manifest')
const apply = args.includes('--apply')
const backupPath = option('--backup')
if (!manifestPath) throw new Error('Use --manifest path.json; this is a dry run unless --apply is supplied')
if (apply && !backupPath) throw new Error('--apply requires --backup path.json')
if (apply && !isLocalDatabase(process.env.DATABASE_URL) && (!process.env.REVALIDATE_URL || !process.env.CRON_SECRET)) {
  throw new Error('Production repair requires REVALIDATE_URL and CRON_SECRET for final cache invalidation')
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { repairs: MediaRepair[]; unresolved?: unknown[] }
if (manifest.unresolved?.length) throw new Error('Resolve every ambiguous file before repairing media')
const payload = await getPayload({ config })
try {
  const prepared = []
  for (const repair of manifest.repairs) {
    const doc = await payload.findByID({ collection: 'media', id: repair.id, depth: 0 })
    const data = prepareMediaRepair(doc, repair)
    for (const change of [repair.changes.original, ...Object.values(repair.changes.sizes)]) {
      if (!change) continue
      const url = new URL(change.url)
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.public.blob.vercel-storage.com')) {
        throw new Error(`Unexpected media storage origin for ${repair.id}`)
      }
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15_000) })
      if (!response.ok) throw new Error(`Media ${repair.id}: replacement file returned ${response.status}`)
    }
    prepared.push({ repair, data, before: { id: doc.id, filename: doc.filename, sizes: doc.sizes, updatedAt: doc.updatedAt } })
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', checked: prepared.length, changes: prepared.filter(({ data }) => Object.keys(data).length).length }))
  if (apply) {
    await writeFile(backupPath!, JSON.stringify(prepared.map(({ before }) => before), null, 2), { flag: 'wx', mode: 0o600 })
    for (const { repair, data, before } of prepared) {
      if (!Object.keys(data).length) continue
      const current = await payload.findByID({ collection: 'media', id: repair.id, depth: 0 })
      if (current.updatedAt !== before.updatedAt) throw new Error(`Media ${repair.id} changed during validation; rerun the dry run`)
      await payload.update({
        collection: 'media', id: repair.id, data, depth: 0,
        context: { disableRevalidate: true },
      })
      const verified = await payload.findByID({ collection: 'media', id: repair.id, depth: 0 })
      if (Object.keys(prepareMediaRepair(verified, repair)).length) throw new Error(`Media ${repair.id} repair did not persist`)
      console.log(`Repaired media ${repair.id}`)
    }
    if (process.env.REVALIDATE_URL) {
      const result = await fetch(process.env.REVALIDATE_URL, {
        method: 'POST', headers: { authorization: `Bearer ${process.env.CRON_SECRET}`, 'content-type': 'application/json' },
        body: JSON.stringify({ collections: ['media'] }), signal: AbortSignal.timeout(30_000),
      })
      if (!result.ok) throw new Error(`Metadata repaired, but public invalidation failed (${result.status}); retry invalidation before marking the repair complete`)
    }
  }
} finally {
  await payload.destroy()
}
