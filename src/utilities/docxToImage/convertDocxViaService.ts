type ConvertedDocxImage = {
  buffer: Buffer
  filename: string
  mimeType: string
}

type ConvertDocxViaServiceArgs = {
  docxUrl: string
  filename: string | null | undefined
  requestOrigin: string
}

const getConversionSecret = () =>
  process.env.DOCX_CONVERSION_SECRET || process.env.CRON_SECRET || process.env.PAYLOAD_SECRET

const getConversionEndpoint = (requestOrigin: string) => {
  const configuredURL = process.env.DOCX_CONVERTER_URL

  if (configuredURL) {
    return configuredURL
  }

  return new URL('/api/docx-to-image', `${requestOrigin.replace(/\/+$/, '')}/`).toString()
}

const getFilenameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition) return null

  const match = /filename="([^"]+)"/.exec(contentDisposition)

  return match?.[1] || null
}

export const convertDocxViaService = async ({
  docxUrl,
  filename,
  requestOrigin,
}: ConvertDocxViaServiceArgs): Promise<ConvertedDocxImage> => {
  const secret = getConversionSecret()

  if (!secret) {
    throw new Error(
      'DOCX conversion requires DOCX_CONVERSION_SECRET, CRON_SECRET, or PAYLOAD_SECRET.',
    )
  }

  const response = await fetch(getConversionEndpoint(requestOrigin), {
    body: JSON.stringify({
      filename: filename || 'document.docx',
      url: docxUrl,
    }),
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`DOCX conversion service failed: ${response.status} ${await response.text()}`)
  }

  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/webp'
  const convertedFilename =
    response.headers.get('x-docx-image-filename') ||
    getFilenameFromContentDisposition(response.headers.get('content-disposition')) ||
    (filename || 'document.docx').replace(/\.docx$/i, '.webp')

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    filename: convertedFilename,
    mimeType,
  }
}
