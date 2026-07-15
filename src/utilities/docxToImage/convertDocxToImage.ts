import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import sharp from 'sharp'

const execFileAsync = promisify(execFile)

export { isDocxMimeType } from './mime'

type ConvertedDocxImage = {
  buffer: Buffer
  filename: string
  mimeType: string
}

type OutputFormat = 'jpg' | 'webp'

const getConfiguredDpi = () => {
  const rawValue = Number.parseInt(process.env.DOCX_IMAGE_DPI || '600', 10)

  if (Number.isFinite(rawValue) && rawValue > 0) {
    return rawValue
  }

  return 600
}

const getConfiguredFormat = (): OutputFormat => {
  const rawValue = process.env.DOCX_IMAGE_FORMAT?.toLowerCase()

  if (rawValue === 'jpg' || rawValue === 'jpeg') {
    return 'jpg'
  }

  return 'webp'
}

const getOutputExtension = (format: OutputFormat) => (format === 'jpg' ? 'jpg' : 'webp')

const getOutputMimeType = (format: OutputFormat) => (format === 'jpg' ? 'image/jpeg' : 'image/webp')

const getSafeBaseName = (filename: string | null | undefined) => {
  const baseName = path.basename(filename || 'document.docx').replace(/\.docx$/i, '')
  const safeName = baseName.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '')

  return safeName || 'document'
}

const findLibreOfficeBinary = () => process.env.LIBREOFFICE_PATH || 'soffice'

const findPdfToPpmBinary = () => process.env.PDFTOPPM_PATH || 'pdftoppm'

const commandErrorMessage = (command: string) =>
  `DOCX image conversion requires "${command}" in the runtime. The Vercel container image should install LibreOffice and Poppler.`

const runCommand = async (
  command: string,
  args: string[],
  options?: Parameters<typeof execFileAsync>[2],
) => {
  try {
    return await execFileAsync(command, args, {
      maxBuffer: 1024 * 1024 * 16,
      ...options,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(commandErrorMessage(command))
    }

    throw error
  }
}

const renderDocxToPdf = async (inputPath: string, outDir: string) => {
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

const rasterizeFirstPage = async (pdfPath: string, outDir: string) => {
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

const encodeImage = async (pngPath: string, format: OutputFormat) => {
  const image = sharp(await readFile(pngPath), { limitInputPixels: false }).rotate()

  if (format === 'jpg') {
    return image.jpeg({ mozjpeg: true, quality: 92 }).toBuffer()
  }

  return image.webp({ effort: 4, quality: 92 }).toBuffer()
}

export const convertDocxBufferToImage = async (
  docxBuffer: Buffer,
  sourceFilename?: string | null,
): Promise<ConvertedDocxImage> => {
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

export const convertDocxUrlToImage = async (url: string, sourceFilename?: string | null) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Could not fetch DOCX from Blob storage: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  return convertDocxBufferToImage(buffer, sourceFilename)
}
