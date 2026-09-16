import { createServer } from 'node:http'
import { convertDocxBufferToImage } from './conversion.mjs'
import { MAX_DOCUMENT_BYTES, readLimitedBody, validateSourceURL } from './limits.mjs'
const maxBodyBytes = 64 * 1024
const port = Number.parseInt(process.env.PORT || '80', 10)
const getAuthSecret = () => process.env.DOCX_CONVERSION_SECRET

const readRequestBody = async (request) => {
  const chunks = []
  let byteLength = 0

  for await (const chunk of request) {
    byteLength += chunk.length

    if (byteLength > maxBodyBytes) {
      throw Object.assign(new Error('Request body is too large.'), { statusCode: 413 })
    }

    chunks.push(chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}

const writeJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'content-type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

const getRequestPath = (request) => {
  try {
    return new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname
  } catch {
    return '/'
  }
}

const convertDocxUrl = async ({ filename, url }) => {
  const sourceUrl = validateSourceURL(url)
  const response = await fetch(sourceUrl, {
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Could not fetch DOCX source (${response.status})`)
  return convertDocxBufferToImage(await readLimitedBody(response, MAX_DOCUMENT_BYTES), filename)
}

const isAuthorized = (request) => {
  const secret = getAuthSecret()

  if (!secret) {
    throw Object.assign(new Error('DOCX conversion auth secret is not configured.'), {
      statusCode: 500,
    })
  }

  return request.headers.authorization === `Bearer ${secret}`
}

let activeConversions = 0
const server = createServer(async (request, response) => {
  try {
    const requestPath = getRequestPath(request)

    if (requestPath !== '/' && requestPath !== '/api/docx-to-image') {
      writeJson(response, 404, { error: 'Not found.' })
      return
    }

    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'Method not allowed.' })
      return
    }

    if (!isAuthorized(request)) {
      writeJson(response, 401, { error: 'Unauthorized.' })
      return
    }

    if (activeConversions >= 1) {
      response.setHeader('retry-after', '10')
      writeJson(response, 429, { error: 'Another document is converting. Please retry shortly.' })
      return
    }
    activeConversions++
    let image
    try {
      const body = await readRequestBody(request)
      let payload
      try {
        payload = JSON.parse(body)
      } catch {
        throw Object.assign(new Error('Invalid JSON'), { statusCode: 400 })
      }

      if (!payload || typeof payload.url !== 'string' || typeof payload.filename !== 'string') {
        writeJson(response, 400, { error: 'Expected JSON body with url and filename.' })
        return
      }

      image = await convertDocxUrl(payload)
    } finally {
      activeConversions--
    }

    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-disposition': `attachment; filename="${image.filename}"`,
      'content-length': String(image.buffer.length),
      'content-type': image.mimeType,
      'x-docx-image-filename': image.filename,
    })
    response.end(image.buffer)
  } catch (error) {
    const statusCode =
      error && typeof error === 'object' && 'statusCode' in error ? Number(error.statusCode) : 500
    const message = error instanceof Error ? error.message : 'DOCX conversion failed.'

    console.error(error)
    writeJson(response, Number.isFinite(statusCode) ? statusCode : 500, { error: message })
  }
})

server.requestTimeout = 20_000
server.headersTimeout = 10_000
server.listen(port, '0.0.0.0', () => {
  console.log(`DOCX converter listening on ${port}`)
})
