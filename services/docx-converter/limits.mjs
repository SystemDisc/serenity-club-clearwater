export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024

export function requireSinglePage(pages) {
  if (!Number.isSafeInteger(pages) || pages < 1) {
    throw Object.assign(
      new Error(
        'Could not determine the document page count. Export a one-page image and upload it instead.',
      ),
      { statusCode: 422 },
    )
  }
  if (pages !== 1) {
    throw Object.assign(
      new Error(
        `This document has ${pages} pages. Flyers currently support one page. Save each page as an image, or upload a one-page Word document. No pages were published.`,
      ),
      { statusCode: 422 },
    )
  }
}

export function validateSourceURL(value, origins = process.env.DOCX_ALLOWED_SOURCE_ORIGINS || '') {
  const url = new URL(value)
  const allowed = origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  if (url.protocol !== 'https:' || url.username || url.password || !allowed.includes(url.origin)) {
    throw Object.assign(new Error('Document source is not an allowed storage origin'), {
      statusCode: 400,
    })
  }
  return url
}

export async function readLimitedBody(response, maxBytes) {
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel()
    throw Object.assign(new Error('Download is too large'), { statusCode: 413 })
  }
  if (!response.body) throw new Error('Empty download')
  const reader = response.body.getReader()
  const chunks = []
  let bytes = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > maxBytes)
        throw Object.assign(new Error('Download is too large'), { statusCode: 413 })
      chunks.push(Buffer.from(chunk.value))
    }
  } finally {
    await reader.cancel()
  }
  return Buffer.concat(chunks)
}
