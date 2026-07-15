import type { GenerateFileURL } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

const getBlobBaseURL = (): string | undefined => {
  const configuredBaseURL = process.env.STORAGE_VERCEL_BLOB_BASE_URL

  if (configuredBaseURL) return configuredBaseURL.replace(/\/$/, '')

  const storeID = process.env.BLOB_READ_WRITE_TOKEN?.match(
    /^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i,
  )?.[1]?.toLowerCase()

  return storeID ? `https://${storeID}.public.blob.vercel-storage.com` : undefined
}

export const generatePublicMediaURL: GenerateFileURL = ({ filename, prefix }) => {
  const baseURL = getBlobBaseURL()

  if (!baseURL) {
    const localURL = `/api/media/file/${encodeURIComponent(filename)}`
    return prefix ? `${localURL}?prefix=${encodeURIComponent(prefix)}` : localURL
  }

  const fileKey = path.posix.join(prefix || '', filename)
  const directory = path.posix.dirname(fileKey)
  const encodedFilename = encodeURIComponent(path.posix.basename(fileKey))
  const encodedFileKey =
    directory === '.' ? encodedFilename : path.posix.join(directory, encodedFilename)

  return `${baseURL}/${encodedFileKey}`
}
