import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import type { PayloadHandler } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'
import { isAdmin } from '@/access/users'
import { kioskSignalPath, kioskSignalURL } from '@/utilities/kioskSignal'

export const kioskRefresh: PayloadHandler = async (req) => {
  if (!isAdmin(req.user)) return new Response(null, { status: 403 })
  // This is a browser-only control. Require same-origin requests in addition to
  // Payload's existing session authentication/CSRF handling.
  if (req.headers.get('Origin') !== new URL(getServerSideURL()).origin) {
    return new Response(null, { status: 403 })
  }
  if (!kioskSignalURL()) return Response.json({ error: 'Refresh signal storage is unavailable.' }, { status: 503 })
  const signal = { revision: randomUUID(), issuedAt: new Date().toISOString() }
  try {
    await put(kioskSignalPath, JSON.stringify(signal), {
      access: 'public', addRandomSuffix: false, allowOverwrite: true,
      contentType: 'application/json', cacheControlMaxAge: 60,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return Response.json({ queued: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Could not queue refresh. Please try again.' }, { status: 503 })
  }
}
