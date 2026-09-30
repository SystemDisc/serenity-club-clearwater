export const kioskSignalPath = 'kiosk/refresh.json'

export function kioskSignalURL(): string | undefined {
  const storeID = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
  if (!storeID) return undefined
  return `https://${storeID}.public.blob.vercel-storage.com/${kioskSignalPath}`
}
