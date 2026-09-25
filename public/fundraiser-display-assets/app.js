const $ = (id) => document.getElementById(id)
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})
const compactMoney = (value) =>
  Number.isInteger(value)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
    : money.format(value)
const campaignUrl =
  'https://www.zeffy.com/en-US/donation-form/help-restore-the-serenity-club-of-clearwater'
let refreshing = false
let lastView = null

function showProgress(data) {
  lastView = data
  const p = data.progress
  if (!p) {
    $('raised').textContent = '—'
    $('percentage').textContent = 'Progress temporarily unavailable'
    $('remaining').textContent = ''
    $('progress').value = 0
  } else {
    const percent = (p.raised / p.goal) * 100
    $('raised').textContent = compactMoney(p.raised)
    $('goal').textContent = compactMoney(p.goal)
    $('progress').value = Math.min(percent, 100)
    $('progress').setAttribute(
      'aria-valuetext',
      `${compactMoney(p.raised)} raised of ${compactMoney(p.goal)}`,
    )
    $('percentage').textContent =
      `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(percent)}% of our goal`
    $('remaining').textContent =
      p.raised >= p.goal ? 'Goal reached — thank you!' : `${compactMoney(p.goal - p.raised)} to go`
  }
  const when = p
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone: 'America/New_York',
      }).format(new Date(p.checkedAt))
    : ''
  $('sync').classList.toggle('warning', data.mode !== 'live')
  $('sync').textContent =
    data.mode === 'preview'
      ? `Preview total · ${when} · Live updates not connected`
      : data.mode === 'live'
        ? `Updated ${when} · Refreshes every minute`
        : data.mode === 'stale'
          ? `Connection interrupted · Last verified ${when}`
          : 'Cannot retrieve the total right now. You can still donate.'
}
async function refresh() {
  if (refreshing) return
  refreshing = true
  try {
    const response = await fetch('/api/fundraiser-progress', {
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) throw new Error('Connection failed')
    showProgress(await response.json())
  } catch {
    if (lastView)
      showProgress({ ...lastView, mode: lastView.mode === 'preview' ? 'preview' : 'stale' })
    else $('sync').textContent = 'Connection unavailable. You can still donate.'
  } finally {
    refreshing = false
  }
}
$('donate').addEventListener('click', () => {
  const frame = document.createElement('iframe')
  frame.title = 'Secure Zeffy donation form'
  frame.src = campaignUrl
  frame.allow = 'payment'
  // Keep checkout interactive without letting its links replace the kiosk,
  // launch another app, open a tab, or download files on the shared device.
  frame.sandbox = 'allow-scripts allow-same-origin allow-forms'
  frame.referrerPolicy = 'strict-origin-when-cross-origin'
  $('frame-container').replaceChildren(frame)
  $('checkout').showModal()
  $('finish').focus()
})
function confirmLeave() {
  $('leave-confirm').showModal()
  $('stay').focus()
}
$('finish').addEventListener('click', confirmLeave)
$('checkout').addEventListener('cancel', (event) => {
  event.preventDefault()
  confirmLeave()
})
$('stay').addEventListener('click', () => $('leave-confirm').close())
$('leave').addEventListener('click', () => {
  $('leave-confirm').close()
  $('frame-container').replaceChildren()
  $('checkout').close()
  $('donate').focus()
  refresh()
})
// Suppress image/link preview and drag menus on the kiosk document. These
// listeners do not reach into Zeffy's cross-origin form or block its inputs.
document.addEventListener('contextmenu', (event) => event.preventDefault())
document.addEventListener('dragstart', (event) => event.preventDefault())
// Safari may ignore user-scalable=no. Keep one-finger scrolling available,
// but suppress the kiosk document's pinch gesture without disabling touch.
for (const type of ['gesturestart', 'gesturechange']) {
  document.addEventListener(type, (event) => event.preventDefault(), { passive: false })
}
document.addEventListener(
  'touchmove',
  (event) => {
    if (event.touches.length > 1) event.preventDefault()
  },
  { passive: false },
)
window.addEventListener('online', refresh)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh()
})
refresh()
setInterval(refresh, 60000)
