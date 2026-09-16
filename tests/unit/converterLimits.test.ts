import { expect, it } from 'vitest'
import { readLimitedBody, validateSourceURL } from '../../services/docx-converter/limits.mjs'
it('accepts only explicitly configured HTTPS storage origins', () => {
  const origin = 'https://test.public.blob.vercel-storage.com'
  expect(validateSourceURL(`${origin}/document.docx`, origin).origin).toBe(origin)
  for (const url of [
    'http://127.0.0.1/file',
    'https://other.example/file',
    'https://test.public.blob.vercel-storage.com.evil.example/file',
    'https://user:password@test.public.blob.vercel-storage.com/file',
  ])
    expect(() => validateSourceURL(url, origin)).toThrow()
})
it('bounds both advertised and streamed response sizes', async () => {
  await expect(
    readLimitedBody(new Response('12345', { headers: { 'content-length': '5' } }), 4),
  ).rejects.toThrow('too large')
  await expect(readLimitedBody(new Response('12345'), 4)).rejects.toThrow('too large')
  expect((await readLimitedBody(new Response('1234'), 4)).toString()).toBe('1234')
})
