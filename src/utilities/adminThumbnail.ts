export function adminThumbnail({ doc }: { doc: Record<string, unknown> }): string | null {
  const sizes = doc.sizes as { thumbnail?: { url?: string | null } } | undefined
  const thumbnail = sizes?.thumbnail?.url
  if (thumbnail) return thumbnail
  return typeof doc.mimeType === 'string' && doc.mimeType.startsWith('image/') && typeof doc.url === 'string'
    ? doc.url
    : null
}
