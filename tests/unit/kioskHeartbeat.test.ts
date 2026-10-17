import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/utilities/getURL', () => ({ getServerSideURL: () => 'https://club.test' }))
import { POST } from '@/app/api/kiosk-heartbeat/route'
import { GET } from '@/app/fundraiser-display/route'

const version = 'a'.repeat(40)
const status = {
  deviceId: '12345678-1234-1234-1234-123456789abc',
  pageLoadId: '23456789-1234-1234-1234-123456789abc',
  version, loadedAt: '2026-10-17T12:00:00.000Z',
  deviceType: 'iPad', displayMode: 'standalone', event: 'loaded',
}
function request(body: unknown = status, headers: Record<string, string> = {}) {
  return new Request('https://club.test/api/kiosk-heartbeat', {
    method: 'POST', body: JSON.stringify(body),
    headers: { origin: 'https://club.test', 'content-type': 'application/json', ...headers },
  })
}
beforeEach(() => {
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', version)
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

it('logs the validated device report with server time and deployed version', async () => {
  const response = await POST(request())
  expect(response.status).toBe(204)
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(JSON.parse(vi.mocked(console.info).mock.calls[0][0])).toEqual({
    ...status, kind: 'kiosk-status', latestVersion: version, currentVersion: true,
    receivedAt: expect.any(String),
  })
  await POST(request({ ...status, version: 'b'.repeat(40) }))
  expect(JSON.parse(vi.mocked(console.info).mock.calls[1][0]).currentVersion).toBe(false)
})
it('rejects cross-origin, unsupported and malformed reports without logging them', async () => {
  expect((await POST(request(status, { origin: 'https://other.test' }))).status).toBe(403)
  expect((await POST(request(status, { 'content-type': 'text/plain' }))).status).toBe(415)
  for (const body of [null, [], { ...status, donor: 'private' }, { ...status, deviceType: ['iPad'] },
    { ...status, version: '<script>' }, { ...status, event: 'refresh-starting' },
    { ...status, refreshRevision: 'bad' }, { ...status, loadedAt: 'not a timestamp' }]) {
    expect((await POST(request(body))).status).toBe(400)
  }
  expect(console.info).not.toHaveBeenCalled()
})
it('limits body bytes even without a content-length header', async () => {
  expect((await POST(request('x'.repeat(2049)))).status).toBe(413)
  expect((await POST(request(status, { 'content-length': '3000' }))).status).toBe(413)
  expect(console.info).not.toHaveBeenCalled()
})
it('does not claim a known deployment version without build metadata', async () => {
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '')
  await POST(request())
  expect(JSON.parse(vi.mocked(console.info).mock.calls[0][0]).currentVersion).toBeNull()
})
it('versions the HTML and its script and stylesheet together', async () => {
  const response = await GET()
  const html = await response.text()
  expect(html).toContain(`name="kiosk-version" content="${version}"`)
  expect(html).toContain(`/fundraiser-display-assets/app.js?v=${version}`)
  expect(html).toContain(`/fundraiser-display-assets/style.css?v=${version}`)
})
