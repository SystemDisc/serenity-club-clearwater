import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import sharp from 'sharp'
import { MAX_DOCUMENT_BYTES } from './limits.mjs'
const execFileAsync = promisify(execFile)
const getConfiguredDpi = () => {
  const rawValue = Number.parseInt(process.env.DOCX_IMAGE_DPI || '200', 10)

  if (Number.isFinite(rawValue) && rawValue >= 50 && rawValue <= 300) {
    return rawValue
  }

  return 200
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
      maxBuffer: 1024 * 1024,
      timeout: 30_000,
      killSignal: 'SIGKILL',
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
        SAL_USE_VCLPLUGIN: 'svp',
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
    '-scale-to',
    '4000',
    '-r',
    String(getConfiguredDpi()),
    '-png',
    pdfPath,
    outputBase,
  ])

  return `${outputBase}.png`
}

const encodeImage = async (pngPath, format) => {
  const image = sharp(await readFile(pngPath), { limitInputPixels: 16_000_000 }).rotate()

  if (format === 'jpg') {
    return image.jpeg({ mozjpeg: true, quality: 85 }).toBuffer()
  }

  return image.webp({ effort: 4, quality: 85 }).toBuffer()
}

export const convertDocxBufferToImage = async (docxBuffer, sourceFilename) => {
  if (docxBuffer.length > MAX_DOCUMENT_BYTES) throw new Error('Document exceeds 25 MiB')
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'payload-docx-image-'))
  const safeBaseName = getSafeBaseName(sourceFilename)
  const inputPath = path.join(tempDir, `${safeBaseName}.docx`)
  const format = getConfiguredFormat()
  const extension = getOutputExtension(format)

  try {
    await writeFile(inputPath, docxBuffer)

    const pdfPath = await renderDocxToPdf(inputPath, tempDir)
    if ((await stat(pdfPath)).size > 50 * 1024 * 1024) throw new Error('Converted PDF is too large')
    const { stdout } = await runCommand(process.env.PDFINFO_PATH || 'pdfinfo', [pdfPath])
    const pages = Number(/^Pages:\s+(\d+)/m.exec(stdout)?.[1])
    if (!Number.isSafeInteger(pages) || pages < 1 || pages > 25)
      throw new Error('Documents must have 1–25 pages')
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
