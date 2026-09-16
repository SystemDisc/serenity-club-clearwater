import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getInternalPreviewPath } from '../../src/utilities/previewPath'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), enable: vi.fn(), disable: vi.fn(), setCookie: vi.fn(),
}))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: async () => ({ auth: mocks.auth, logger: { error: vi.fn() } }) }))
vi.mock('next/headers', () => ({
  draftMode: async () => ({ enable: mocks.enable, disable: mocks.disable }),
  cookies: async () => ({ set: mocks.setCookie }),
}))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`) } }))
import { GET } from '../../src/app/(frontend)/next/preview/route'
import { POST } from '../../src/app/(frontend)/next/seed/route'

describe('preview and seed protection', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('PREVIEW_SECRET', 'local-secret') })
  it('rejects external, protocol-relative, and backslash paths', () => {
    for (const path of ['https://evil.example', '//evil.example', '/\\evil.example', '/\nevil.example']) {
      expect(getInternalPreviewPath(path)).toBeNull()
    }
    expect(getInternalPreviewPath('/gallery?preview=1')).toBe('/gallery?preview=1')
  })
  it('does not treat a successful auth response with a null user as authentication', async () => {
    mocks.auth.mockResolvedValue({ user: null })
    const response = await GET(new NextRequest('https://local.test/next/preview?previewSecret=local-secret&path=/gallery'))
    expect(response.status).toBe(403)
    expect(mocks.enable).not.toHaveBeenCalled()
  })
  it('requires a configured secret even when an authenticated user exists', async () => {
    vi.stubEnv('PREVIEW_SECRET', '')
    const response = await GET(new NextRequest('https://local.test/next/preview?previewSecret=&path=/gallery'))
    expect(response.status).toBe(403)
    expect(mocks.auth).not.toHaveBeenCalled()
  })
  it('allows an authenticated user with the correct secret to preview an internal page', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 1 } })
    await expect(GET(new NextRequest('https://local.test/next/preview?previewSecret=local-secret&path=/gallery'))).rejects.toThrow('redirect:/gallery')
    expect(mocks.enable).toHaveBeenCalledOnce()
  })
  it('never exposes destructive demo seeding over HTTP', () => {
    expect(POST().status).toBe(404)
  })
})
