import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import sharp from 'sharp'

const execFileAsync = promisify(execFile)
const maxBodyBytes = 1024 * 1024 * 2
const port = Number.parseInt(process.env.PORT || '80', 10)

const getAuthSecret = () =>
  process.env.DOCX_CONVERSION_SECRET || process.env.CRON_SECRET || process.env.PAYLOAD_SECRET

const getConfiguredDpi = () => {
  const rawValue = Number.parseInt(process.env.DOCX_IMAGE_DPI || '600', 10)

  if (Number.isFinite(rawValue) && rawValue > 0) {
    return rawValue
  }

  return 600
}

const getConfiguredFormat = () => {
  const rawValue = process.env.DOCX_IMAGE_FORMAT?.toLowerCase()

  if (rawValue === 'jpg' || rawValue === 'jpeg') {
    return 'jpg'
  }

  return 'webp'
}

const getOutputExtension = (format) => (format === 'jpg' ? 'jpg' : 'webp')

const getOutputMimeType = (format) => (format === 'jpg' ? 'image/jpeg' : 'image/webp')

const getSafeBaseName = (filename) => {
  const baseName = path.basename(filename || 'document.docx').replace(/\.docx$/i, '')
  const safeName = baseName.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '')

  return safeName || 'document'
}

const findLibreOfficeBinary = () => process.env.LIBREOFFICE_PATH || 'soffice'

const findPdfToPpmBinary = () => process.env.PDFTOPPM_PATH || 'pdftoppm'

const runCommand = async (command, args, options) => {
  try {
    return await execFileAsync(command, args, {
      maxBuffer: 1024 * 1024 * 16,
      ...options,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Required conversion command is missing: ${command}`)
    }

    throw error
  }
}

const renderDocxToPdf = async (inputPath, outDir) => {
  const profileDir = path.join(outDir, 'libreoffice-profile')

  await runCommand(
    findLibreOfficeBinary(),
    [
      '--headless',
      '--nologo',
      '--nofirststartwizard',
      '--nodefault',
      '--nolockcheck',
      `-env:UserInstallation=file://${profileDir}`,
      '--convert-to',
      'pdf',
      '--outdir',
      outDir,
      inputPath,
    ],
    {
      env: {
        ...process.env,
        HOME: outDir,
      },
    },
  )

  return path.join(outDir, `${path.basename(inputPath, '.docx')}.pdf`)
}

const rasterizeFirstPage = async (pdfPath, outDir) => {
  const outputBase = path.join(outDir, 'page')

  await runCommand(findPdfToPpmBinary(), [
    '-f',
    '1',
    '-singlefile',
    '-r',
    String(getConfiguredDpi()),
    '-png',
    pdfPath,
    outputBase,
  ])

  return `${outputBase}.png`
}

const encodeImage = async (pngPath, format) => {
  const image = sharp(await readFile(pngPath), { limitInputPixels: false }).rotate()

  if (format === 'jpg') {
    return image.jpeg({ mozjpeg: true, quality: 92 }).toBuffer()
  }

  return image.webp({ effort: 4, quality: 92 }).toBuffer()
}

const convertDocxBufferToImage = async (docxBuffer, sourceFilename) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'payload-docx-image-'))
  const safeBaseName = getSafeBaseName(sourceFilename)
  const inputPath = path.join(tempDir, `${safeBaseName}.docx`)
  const format = getConfiguredFormat()
  const extension = getOutputExtension(format)

  try {
    await writeFile(inputPath, docxBuffer)

    const pdfPath = await renderDocxToPdf(inputPath, tempDir)
    const pngPath = await rasterizeFirstPage(pdfPath, tempDir)
    const buffer = await encodeImage(pngPath, format)

    return {
      buffer,
      filename: `${safeBaseName}.${extension}`,
      mimeType: getOutputMimeType(format),
    }
  } finally {
    await rm(tempDir, { force: true, recursive: true })
  }
}

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

const convertDocxUrl = async ({ filename, url }) => {
  const sourceUrl = new URL(url)

  if (sourceUrl.protocol !== 'https:' && sourceUrl.protocol !== 'http:') {
    throw Object.assign(new Error('Only HTTP(S) source URLs are supported.'), { statusCode: 400 })
  }

  const response = await fetch(sourceUrl)

  if (!response.ok) {
    throw new Error(`Could not fetch DOCX source: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  return convertDocxBufferToImage(buffer, filename)
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

const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'POST') {
      writeJson(response, 405, { error: 'Method not allowed.' })
      return
    }

    if (!isAuthorized(request)) {
      writeJson(response, 401, { error: 'Unauthorized.' })
      return
    }

    const body = await readRequestBody(request)
    const payload = JSON.parse(body)

    if (!payload || typeof payload.url !== 'string' || typeof payload.filename !== 'string') {
      writeJson(response, 400, { error: 'Expected JSON body with url and filename.' })
      return
    }

    const image = await convertDocxUrl(payload)

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
      error && typeof error === 'object' && 'statusCode' in error
        ? Number(error.statusCode)
        : 500
    const message = error instanceof Error ? error.message : 'DOCX conversion failed.'

    console.error(error)
    writeJson(response, Number.isFinite(statusCode) ? statusCode : 500, { error: message })
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`DOCX converter listening on ${port}`)
})
