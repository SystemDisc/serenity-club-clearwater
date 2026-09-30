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
  document.documentElement.innerHTML = html
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
it('reloads only after idle and persists its command before navigation', async () => {
  await vi.advanceTimersByTimeAsync(1000)
  command(); await poll()
  expect(reload).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(30000)
  expect(reload).toHaveBeenCalledTimes(1)
  expect(JSON.parse(localStorage.getItem('serenity-kiosk-refresh')!).revision).toBe('12345678-1234-1234-1234-123456789abc')
  await poll()
  expect(reload).toHaveBeenCalledTimes(1)
})
it('defers refresh throughout checkout and resumes after the visitor leaves', async () => {
  document.getElementById('donate')!.click()
  await vi.advanceTimersByTimeAsync(31000)
  command(); await poll()
  expect(reload).not.toHaveBeenCalled()
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
  signal = { revision: 'bad', issuedAt: new Date().toISOString() }
  await poll(); unavailable = true; await poll()
  expect(reload).not.toHaveBeenCalled()
})
