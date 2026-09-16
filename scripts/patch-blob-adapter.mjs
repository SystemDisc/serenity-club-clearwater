import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

// Upstream #9589: every size upload used to replace the shared original filename.
// Keep random suffixes (including client uploads) and update the matching size.
// Fail closed on package changes so upgrades require reviewing this patch.
const require = createRequire(import.meta.url)
const directory = path.dirname(require.resolve('@payloadcms/storage-vercel-blob'))
const version = JSON.parse(readFileSync(path.join(directory, '../package.json'), 'utf8')).version
if (version !== '3.89.0') throw new Error(`Review the Blob metadata patch for Payload ${version}`)
const file = path.join(directory, 'adapter.js')
let source = readFileSync(file, 'utf8')
const marker = '// Serenity: match the size before concurrent uploads mutate metadata.'
if (!source.includes(marker)) {
  const beforeUpload = '                const result = await uploadFile({'
  const beforeAssignment = '                    data.filename = result.filename;'
  if (!source.includes(beforeUpload) || !source.includes(beforeAssignment)) {
    throw new Error('Blob adapter changed; refusing to apply an unreviewed metadata patch')
  }
  source = source.replace(beforeUpload, `                ${marker}\n                const size = Object.values(data.sizes || {}).find((item) => item?.filename === filename);\n${beforeUpload}`)
  source = source.replace(beforeAssignment, '                    if (size) size.filename = result.filename;\n                    else data.filename = result.filename;')
  writeFileSync(file, source)
}
