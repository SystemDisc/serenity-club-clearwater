// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const html = readFileSync('src/fundraiser-display/display.html', 'utf8')
const script = readFileSync('public/fundraiser-display-assets/app.js', 'utf8')
const campaign =
  'https://www.zeffy.com/en-US/donation-form/help-restore-the-serenity-club-of-clearwater'
let refresh: () => Promise<void>
let raised: number

beforeEach(async () => {
  raised = 500
  document.documentElement.innerHTML = html
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    },
    close(this: HTMLDialogElement) {
      this.removeAttribute('open')
    },
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        mode: 'live',
        campaignUrl: 'https://example.test/wrong-campaign',
        progress: { raised, goal: 100000, checkedAt: new Date().toISOString() },
      }),
    })),
  )
  vi.stubGlobal('setInterval', (callback: () => Promise<void>) => {
    refresh = callback
    return 1
  })
  window.eval(`(() => {${script}})()`)
  await vi.waitFor(() => expect(document.getElementById('raised')?.textContent).toBe('$500'))
})

afterEach(() => vi.unstubAllGlobals())

function click(id: string) {
  document.getElementById(id)!.click()
}

function checkout() {
  return document.getElementById('checkout') as HTMLDialogElement
}

describe('interactive fundraiser kiosk', () => {
  it('keeps the existing checkout instance during progress updates', async () => {
    click('donate')
    const frame = checkout().querySelector('iframe')!
    raised = 725
    await refresh()
    expect(document.getElementById('raised')?.textContent).toBe('$725')
    expect(checkout().open).toBe(true)
    expect(checkout().querySelector('iframe')).toBe(frame)
    expect(frame.src).toBe(campaign)
  })

  it('requires confirmation to discard checkout and keeps it when the donor cancels', () => {
    click('donate')
    const frame = checkout().querySelector('iframe')!
    const escape = new Event('cancel', { cancelable: true })
    checkout().dispatchEvent(escape)
    expect(escape.defaultPrevented).toBe(true)
    expect((document.getElementById('leave-confirm') as HTMLDialogElement).open).toBe(true)
    click('stay')
    expect(checkout().open).toBe(true)
    expect(checkout().querySelector('iframe')).toBe(frame)
  })

  it('unloads the old form only after confirmation and opens a new form for the next visitor', () => {
    click('donate')
    const frame = checkout().querySelector('iframe')!
    click('finish')
    expect(checkout().querySelector('iframe')).toBe(frame)
    click('leave')
    expect(checkout().open).toBe(false)
    expect(frame.isConnected).toBe(false)
    expect(document.activeElement?.id).toBe('donate')
    click('donate')
    expect(checkout().querySelector('iframe')).not.toBe(frame)
    expect(checkout().querySelector('iframe')?.src).toBe(campaign)
  })
})
