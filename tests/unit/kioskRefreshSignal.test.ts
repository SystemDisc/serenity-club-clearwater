// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const html = readFileSync('src/fundraiser-display/display.html', 'utf8')
const script = readFileSync('public/fundraiser-display-assets/app.js', 'utf8').replace('window.location.reload()', 'window.testReload()')
let poll: () => Promise<void>
let signal: unknown
let unavailable: boolean
let reload: ReturnType<typeof vi.fn>
beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-30T12:00:00Z'))
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.innerHTML = html
  document.querySelector('meta[name="kiosk-version"]')!.setAttribute('content', 'a'.repeat(40))
  document.querySelector('meta[name="kiosk-refresh-url"]')!.setAttribute('content', 'https://test.public.blob.vercel-storage.com/kiosk/refresh.json')
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  vi.spyOn(document, 'addEventListener')
  vi.spyOn(window, 'addEventListener')
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) { this.setAttribute('open', '') }, close(this: HTMLDialogElement) { this.removeAttribute('open') },
  })
  reload = vi.fn()
  vi.stubGlobal('testReload', reload)
  signal = null
  unavailable = false
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (unavailable) throw new Error('offline')
    return { ok: url.startsWith('/api/') || !!signal, json: async () => url.startsWith('/api/') ? { mode: 'live', progress: { raised: 500, goal: 100000, checkedAt: new Date().toISOString() } } : signal }
  }))
  vi.stubGlobal('setInterval', (callback: () => Promise<void>) => { poll = callback; return 1 })
  window.eval(`(() => {${script}})()`)
  await Promise.resolve(); await Promise.resolve()
})
afterEach(() => {
  vi.mocked(document.addEventListener).mock.calls.forEach(([type, listener]) => document.removeEventListener(type, listener))
  vi.mocked(window.addEventListener).mock.calls.forEach(([type, listener]) => window.removeEventListener(type, listener))
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks()
})
function command() { signal = { revision: '12345678-1234-1234-1234-123456789abc', issuedAt: new Date().toISOString() } }
function reports() {
  return vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/kiosk-heartbeat')
    .map(([, options]) => JSON.parse(options!.body as string))
}
it('reloads only after idle and persists its command before navigation', async () => {
  await vi.advanceTimersByTimeAsync(1000)
  command(); await poll()
  expect(reload).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(30000)
  expect(reload).toHaveBeenCalledTimes(1)
  expect(reports().map((report) => report.event)).toEqual(['loaded', 'refresh-pending', 'refresh-starting'])
  expect(JSON.parse(localStorage.getItem('serenity-kiosk-refresh')!).revision).toBe('12345678-1234-1234-1234-123456789abc')
  await poll()
  expect(reload).toHaveBeenCalledTimes(1)
})
it('defers refresh throughout checkout and resumes after the visitor leaves', async () => {
  document.getElementById('donate')!.click()
  await vi.advanceTimersByTimeAsync(31000)
  command(); await poll()
  expect(reload).not.toHaveBeenCalled()
  expect(reports().some((report) => report.event === 'refresh-starting')).toBe(false)
  document.getElementById('finish')!.click()
  document.dispatchEvent(new Event('pointerdown'))
  document.getElementById('leave')!.click()
  expect(reload).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(30001)
  expect(reload).toHaveBeenCalledTimes(1)
})
it('ignores commands older than page load and offline or malformed responses', async () => {
  command(); await poll()
  expect(reload).not.toHaveBeenCalled()
  expect(sessionStorage.getItem('serenity-kiosk-reload-ack')).toBeNull()
  expect(reports().every((report) => !report.refreshRevision)).toBe(true)
  signal = { revision: 'bad', issuedAt: new Date().toISOString() }
  await poll(); unavailable = true; await poll()
  expect(reload).not.toHaveBeenCalled()
})
it('keeps progress working and does not reload when storage cannot persist the command', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  await vi.advanceTimersByTimeAsync(31000)
  command(); await poll()
  expect(document.getElementById('raised')?.textContent).toBe('$500')
  expect(reload).not.toHaveBeenCalled()
  expect(reports().some((report) => report.event === 'refresh-starting')).toBe(false)
})
it('reports the same device and a new page load only after a commanded reload', async () => {
  const first = reports()[0]
  expect(first.refreshRevision).toBeUndefined()
  await vi.advanceTimersByTimeAsync(31000)
  command(); await poll()
  expect(reload).toHaveBeenCalledTimes(1)
  vi.mocked(document.addEventListener).mock.calls.forEach(([type, listener]) => document.removeEventListener(type, listener))
  vi.mocked(window.addEventListener).mock.calls.forEach(([type, listener]) => window.removeEventListener(type, listener))
  Object.defineProperty(performance, 'getEntriesByType', { configurable: true, value: () => [{ type: 'reload' }] })
  document.documentElement.innerHTML = html
  document.querySelector('meta[name="kiosk-version"]')!.setAttribute('content', 'b'.repeat(40))
  window.eval(`(() => {${script}})()`)
  const loaded = reports().at(-1)
  expect(loaded).toMatchObject({ event: 'loaded', deviceId: first.deviceId, version: 'b'.repeat(40),
    refreshRevision: '12345678-1234-1234-1234-123456789abc' })
  expect(loaded.pageLoadId).not.toBe(first.pageLoadId)
  expect(sessionStorage.getItem('serenity-kiosk-reload-ack')).toBeNull()
})
it('reports periodically only while visible and online, without blocking on failed reports', async () => {
  await vi.advanceTimersByTimeAsync(300000)
  await poll()
  expect(reports().map((report) => report.event)).toEqual(['loaded', 'heartbeat'])
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  await vi.advanceTimersByTimeAsync(300000); await poll()
  expect(reports()).toHaveLength(2)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  await poll()
  expect(reports()).toHaveLength(2)
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  unavailable = true
  await poll()
  expect(reports()).toHaveLength(3)
  expect(reload).not.toHaveBeenCalled()
})
