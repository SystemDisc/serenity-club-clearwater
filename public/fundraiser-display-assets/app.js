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
let checkoutRefreshTimers = []

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
        ? `Updated ${when} · Refreshes every 5 minutes`
        : data.mode === 'stale'
          ? `Connection interrupted · Last verified ${when}`
          : 'Cannot retrieve the total right now. You can still donate.'
}
async function refresh() {
  if (document.hidden || refreshing) return
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
  // Zeffy may finish processing just after the visitor closes checkout.
  // Keep this burst bounded; regular polling stays at five minutes.
  checkoutRefreshTimers.forEach(clearTimeout)
  refresh()
  checkoutRefreshTimers = [15000, 45000].map((delay) => setTimeout(refresh, delay))
  applyPendingReload()
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
setInterval(async () => {
  await refresh()
  await checkReloadSignal()
}, 300000)

// Read a public CDN-hosted signal: no application function runs for these checks.
const reloadURL = document.querySelector('meta[name="kiosk-refresh-url"]')?.content
const reloadStorageKey = 'serenity-kiosk-refresh'
const bootTime = Date.now()
let lastInteraction = bootTime
let pendingReload = null
let reloadTimer
let reloadChecking = false
let seenReload = null
let reloadStorageAvailable = true
try {
  seenReload = JSON.parse(localStorage.getItem(reloadStorageKey) || 'null')
  if (seenReload && (!seenReload.revision || !Number.isFinite(seenReload.issuedAt))) seenReload = null
  localStorage.setItem(reloadStorageKey, JSON.stringify(seenReload))
} catch {
  reloadStorageAvailable = false
}
function applyPendingReload() {
  clearTimeout(reloadTimer)
  if (!pendingReload || !reloadStorageAvailable || document.hidden || !navigator.onLine) return
  if ($('checkout').open || $('leave-confirm').open) return
  const idleRemaining = 30000 - (Date.now() - lastInteraction)
  if (idleRemaining > 0) {
    reloadTimer = setTimeout(applyPendingReload, idleRemaining + 1)
    return
  }
  try {
    // Persist before navigation so a cached signal cannot cause a reload loop.
    localStorage.setItem(reloadStorageKey, JSON.stringify(pendingReload))
  } catch { return }
  seenReload = pendingReload
  pendingReload = null
  window.location.reload()
}
async function checkReloadSignal() {
  if (!reloadURL || !reloadStorageAvailable || reloadChecking || document.hidden || !navigator.onLine) return
  reloadChecking = true
  try {
    const response = await fetch(reloadURL, { cache: 'no-cache', signal: AbortSignal.timeout(10000) })
    if (!response.ok) return
    const signal = await response.json()
    const issuedAt = Date.parse(signal.issuedAt)
    if (!/^[a-f0-9-]{36}$/i.test(signal.revision) || !Number.isFinite(issuedAt) || issuedAt > Date.now() || Date.now() - issuedAt > 86400000) return
    if (seenReload && (signal.revision === seenReload.revision || issuedAt <= seenReload.issuedAt)) return
    const next = { revision: signal.revision, issuedAt }
    if (issuedAt <= bootTime) {
      // The current page was loaded after this command; it already has fresh code.
      localStorage.setItem(reloadStorageKey, JSON.stringify(next))
      seenReload = next
      return
    }
    pendingReload = next
    applyPendingReload()
  } catch {
    // Offline/missing storage must never disrupt a working donation kiosk.
  } finally { reloadChecking = false }
}
for (const type of ['pointerdown', 'keydown']) {
  document.addEventListener(type, () => { lastInteraction = Date.now() })
}
window.addEventListener('online', () => { checkReloadSignal(); applyPendingReload() })
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { checkReloadSignal(); applyPendingReload() }
})
checkReloadSignal()
