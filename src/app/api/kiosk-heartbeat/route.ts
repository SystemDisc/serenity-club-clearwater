import { getServerSideURL } from '@/utilities/getURL'
import { kioskVersion } from '@/utilities/kioskVersion'

const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i
const headers = { 'Cache-Control': 'no-store' }
const fields = new Set(['deviceId', 'pageLoadId', 'version', 'loadedAt', 'deviceType', 'displayMode', 'event', 'refreshRevision'])

export async function POST(request: Request) {
  // Public, self-reported diagnostics; this endpoint grants no device control.
  if (request.headers.get('origin') !== new URL(getServerSideURL()).origin) {
    return new Response(null, { status: 403, headers })
  }
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return new Response(null, { status: 415, headers })
  }
  if (Number(request.headers.get('content-length')) > 2048) {
    return new Response(null, { status: 413, headers })
  }
  const reader = request.body?.getReader()
  if (!reader) return new Response(null, { status: 400, headers })
  let body: unknown
  try {
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 2048) {
        await reader.cancel()
        return new Response(null, { status: 413, headers })
      }
      chunks.push(value)
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return new Response(null, { status: 400, headers })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return new Response(null, { status: 400, headers })
  }
  const data = body as Record<string, unknown>
  const { deviceId, pageLoadId, version, loadedAt, deviceType, displayMode, event, refreshRevision } = data
  if (
    Object.keys(data).some((key) => !fields.has(key)) ||
    typeof deviceId !== 'string' || !uuid.test(deviceId) ||
    typeof pageLoadId !== 'string' || !uuid.test(pageLoadId) ||
    typeof version !== 'string' || !/^(?:[a-f0-9]{40}|unknown)$/.test(version) ||
    typeof loadedAt !== 'string' || loadedAt.length !== 24 || !Number.isFinite(Date.parse(loadedAt)) ||
    typeof deviceType !== 'string' || !['iPad', 'iPhone', 'Android', 'computer', 'unknown'].includes(deviceType) ||
    typeof displayMode !== 'string' || !['standalone', 'browser'].includes(displayMode) ||
    typeof event !== 'string' || !['loaded', 'heartbeat', 'refresh-pending', 'refresh-starting'].includes(event) ||
    (refreshRevision !== undefined && (typeof refreshRevision !== 'string' || !uuid.test(refreshRevision))) ||
    ((event === 'refresh-pending' || event === 'refresh-starting') && !refreshRevision)
  ) {
    return new Response(null, { status: 400, headers })
  }
  const latestVersion = kioskVersion()
  // Never log the request body, user agent, network address, or donation data.
  console.info(JSON.stringify({
    kind: 'kiosk-status', deviceId, pageLoadId, version, loadedAt, deviceType, displayMode, event,
    ...(refreshRevision ? { refreshRevision } : {}),
    receivedAt: new Date().toISOString(), latestVersion,
    currentVersion: latestVersion === 'unknown' ? null : version === latestVersion,
  }))
  return new Response(null, { status: 204, headers })
}
