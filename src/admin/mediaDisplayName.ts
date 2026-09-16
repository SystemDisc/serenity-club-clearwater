import type { Media } from '@/payload-types'

export function mediaDisplayName(media: Pick<Media, 'alt' | 'filename'>) {
  return (
    media.alt || media.filename?.replace(/-[A-Za-z0-9]{30}(?=\.[^.]+$)/, '') || 'Untitled photo'
  )
}
