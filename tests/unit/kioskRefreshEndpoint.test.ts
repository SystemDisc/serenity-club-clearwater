import { beforeEach, expect, it, vi } from 'vitest'
const put = vi.hoisted(() => vi.fn())
vi.mock('@vercel/blob', () => ({ put }))
vi.mock('@/utilities/getURL', () => ({ getServerSideURL: () => 'https://club.test' }))
vi.mock('@/access/users', () => ({ isAdmin: (user: { role?: string } | null) => user?.role === 'admin' }))
import { kioskRefresh } from '@/endpoints/kioskRefresh'
function request(role: string | null, origin = 'https://club.test') {
  return { user: role ? { role } : null, url: 'https://club.test/api/kiosk-refresh', headers: new Headers({ Origin: origin }) } as unknown as Parameters<typeof kioskRefresh>[0]
}
beforeEach(() => { put.mockReset(); process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_storeid_fake'; })
it('rejects anonymous, editor, and cross-origin requests without writing a signal', async () => {
  for (const req of [request(null), request('editor'), request('admin', 'https://other.test')]) {
    expect((await kioskRefresh(req)).status).toBe(403)
  }
  expect(put).not.toHaveBeenCalled()
})
it('writes only a public opaque revision and timestamp for an authenticated admin', async () => {
  expect((await kioskRefresh(request('admin'))).status).toBe(200)
  const [path, body, options] = put.mock.calls[0]
  expect(path).toBe('kiosk/refresh.json')
  expect(Object.keys(JSON.parse(body)).sort()).toEqual(['issuedAt', 'revision'])
  expect(options).toMatchObject({ allowOverwrite: true, addRandomSuffix: false, cacheControlMaxAge: 60 })
})
it('reports storage failure without queuing a reload', async () => {
  put.mockRejectedValue(new Error('storage unavailable'))
  expect((await kioskRefresh(request('admin'))).status).toBe(503)
  delete process.env.BLOB_READ_WRITE_TOKEN
  expect((await kioskRefresh(request('admin'))).status).toBe(503)
})
