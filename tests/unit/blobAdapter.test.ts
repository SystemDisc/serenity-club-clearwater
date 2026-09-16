import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { CollectionConfig, PayloadRequest } from 'payload'
import { adminThumbnail } from '../../src/utilities/adminThumbnail'

const calls = vi.hoisted(() => ({ next: 0 }))
vi.mock('@vercel/blob', async (original) => ({
  ...await original<typeof import('@vercel/blob')>(),
  put: async (filename: string) => {
    const sequence = ++calls.next
    await new Promise((resolve) => setTimeout(resolve, sequence % 3))
    const extension = path.extname(filename)
    return { pathname: `${filename.slice(0, -extension.length)}-unique${sequence}${extension}` }
  },
}))
// Test the installed, patched implementation rather than duplicating the fix.
import { createVercelBlobAdapter } from '../../node_modules/@payloadcms/storage-vercel-blob/dist/adapter.js'

describe('Blob metadata under concurrent derivative uploads', () => {
  const collection = { slug: 'media' } as CollectionConfig
  const adapter = createVercelBlobAdapter({ access: 'public', addRandomSuffix: true, baseUrl: 'https://store.example', cacheControlMaxAge: 60, clientUploads: true, token: 'test-only' })({ collection })
  const upload = (data: Record<string, unknown>, filename: string) => adapter.handleUpload({
    data, collection, clientUploadContext: undefined, req: {} as PayloadRequest,
    file: { filename, buffer: Buffer.from('test'), filesize: 4, mimeType: 'image/jpeg' },
  })

  it('keeps a client-uploaded original while recording every randomized size filename', async () => {
    const data = { filename: 'photo-client-unique.jpg', sizes: {
      thumbnail: { filename: 'photo-client-unique-300x225.jpg' },
      large: { filename: 'photo-client-unique-1400x1050.jpg' },
    } }
    await Promise.all(Object.values(data.sizes).map((size) => upload(data, size.filename)))
    expect(data.filename).toBe('photo-client-unique.jpg')
    expect(data.sizes.thumbnail.filename).toMatch(/^photo-client-unique-300x225-unique\d+\.jpg$/)
    expect(data.sizes.large.filename).toMatch(/^photo-client-unique-1400x1050-unique\d+\.jpg$/)
  })

  it('keeps the original and derivatives distinct for server-side uploads too', async () => {
    const data = { filename: 'converted.jpg', sizes: { thumbnail: { filename: 'converted-300x225.jpg' } } }
    await Promise.all([upload(data, data.filename), upload(data, data.sizes.thumbnail.filename)])
    expect(data.filename).toMatch(/^converted-unique\d+\.jpg$/)
    expect(data.sizes.thumbnail.filename).toMatch(/^converted-300x225-unique\d+\.jpg$/)
  })

  it('uses direct thumbnail URLs and falls back for images smaller than the thumbnail size', () => {
    expect(adminThumbnail({ doc: { sizes: { thumbnail: { url: 'https://store.example/thumb.jpg' } } } })).toBe('https://store.example/thumb.jpg')
    expect(adminThumbnail({ doc: { mimeType: 'image/jpeg', url: 'https://store.example/small.jpg' } })).toBe('https://store.example/small.jpg')
    expect(adminThumbnail({ doc: { mimeType: 'application/pdf', url: '/file.pdf' } })).toBeNull()
  })
})
