'use client'
import { useDocumentInfo, useFormModified, useFormProcessing } from '@payloadcms/ui'

const destinations: Record<string, string> = {
  meetings: '/meeting-schedule',
  events: '/events',
  monthlyFlyers: '/events',
  galleryItems: '/gallery',
  teamMembers: '/about',
  products: '/shop',
  policies: '/policies',
  sponsors: '/ways-to-give',
  duesReminder: '/about',
}
export default function PublicationStatus() {
  const { data, collectionSlug, globalSlug, hasPublishedDoc, isTrashed, id } = useDocumentInfo()
  const modified = useFormModified()
  const processing = useFormProcessing()
  let destination = destinations[collectionSlug || globalSlug || '']
  if (data?.slug && hasPublishedDoc && collectionSlug === 'albums')
    destination = `/gallery/albums/${data.slug}`
  if (data?.slug && hasPublishedDoc && collectionSlug === 'posts')
    destination = `/posts/${data.slug}`
  const status = isTrashed
    ? 'In Trash — hidden from the website.'
    : hasPublishedDoc
      ? data?._status === 'draft' || modified
        ? 'A published version is on the website. These new edits are private until you publish.'
        : 'Published on the website.'
      : 'Draft — not on the website.'
  return (
    <aside className="club-publication-status">
      <p>
        {status}{' '}
        {processing
          ? 'Saving…'
          : modified
            ? 'Changes waiting to save.'
            : id || globalSlug
              ? 'Saved changes are retained.'
              : 'Nothing saved yet.'}
      </p>
      {!id && !globalSlug ? (
        <p>Save your first draft to keep it. Later valid edits autosave.</p>
      ) : null}
      {destination ? (
        <a href={destination} target="_blank" rel="noreferrer">
          View published page ↗
        </a>
      ) : null}
    </aside>
  )
}
