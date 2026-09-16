import { describe, expect, it } from 'vitest'
import { SourceDocuments } from '../../src/collections/SourceDocuments'
import type { CollectionBeforeChangeHook } from 'payload'
const hook = SourceDocuments.hooks!.beforeChange![0]
const originalDoc = {
  sha256: 'original-hash',
  filesize: 20,
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
const args = (
  context = {},
  file?: unknown,
  data = { ...originalDoc, filename: 'randomized.docx' },
) =>
  ({
    operation: 'update',
    data,
    originalDoc,
    req: { context, file },
  }) as unknown as Parameters<CollectionBeforeChangeHook>[0]
describe('retained Word originals', () => {
  it('allows the cloud adapter to persist upload metadata without replacing original bytes', async () => {
    const input = args({ skipCloudStorage: true })
    expect(await hook(input)).toEqual(input.data)
  })
  it('rejects ordinary updates and file or identity changes even during storage writes', async () => {
    for (const input of [
      args(),
      args({ skipCloudStorage: true }, { data: Buffer.from('replacement') }),
      args({ skipCloudStorage: true }, undefined, {
        ...originalDoc,
        sha256: 'changed',
        filename: 'new.docx',
      }),
    ]) {
      await expect(async () => hook(input)).rejects.toThrow(
        'Original documents are retained unchanged',
      )
    }
  })
})
