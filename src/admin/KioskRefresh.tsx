'use client'
import { useState } from 'react'

export default function KioskRefresh() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function refresh() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const result = await fetch('/api/kiosk-refresh', { method: 'POST', credentials: 'same-origin' })
      if (!result.ok) throw new Error('Could not queue refresh. Please try again.')
      setMessage('Refresh queued. The kiosk will refresh when idle, usually within five minutes. A donation in progress will finish first.')
    } catch {
      setMessage('Could not queue refresh. Please try again.')
    } finally { setBusy(false) }
  }
  return <section className="club-panel">
    <h2>Clubhouse fundraiser kiosk</h2>
    <p>Refresh the Club’s display remotely after a website update. This requires the kiosk’s initial setup refresh.</p>
    <button type="button" disabled={busy} onClick={refresh}>{busy ? 'Queuing…' : 'Refresh kiosk'}</button>
    <p role="status">{message}</p>
  </section>
}
