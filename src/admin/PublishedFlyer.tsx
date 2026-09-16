'use client'
/* eslint-disable @next/next/no-img-element -- Authenticated, bounded CMS preview. */
import { useDocumentInfo } from '@payloadcms/ui'
import type { MonthlyFlyer } from '@/payload-types'
import { displayMonth } from '@/serenity/calendar'
import { useResource } from './useResource'
export default function PublishedFlyer() {
  const { id, hasPublishedDoc, data } = useDocumentInfo()
  const { value, error, loading } = useResource<MonthlyFlyer>(
    id && hasPublishedDoc
      ? `/api/monthlyFlyers/${id}?draft=false&depth=1&revision=${encodeURIComponent(data?.updatedAt || '')}`
      : null,
  )
  const image = typeof value?.image === 'object' ? value.image : null
  return (
    <section className="club-panel club-image-preview">
      <h2>Currently on the website</h2>
      {loading ? <p>Loading the published flyer…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!hasPublishedDoc ? (
        <p>
          This month has no published flyer yet. The selected image below is your proposed flyer.
        </p>
      ) : null}
      {value ? (
        <>
          <p>{displayMonth(value.month)} — compare this with your selected replacement below.</p>
          {image?.url ? (
            <a href={image.url} target="_blank" rel="noreferrer">
              <img
                src={image.sizes?.medium?.url || image.url}
                alt={`Published ${displayMonth(value.month)} flyer`}
              />
              View published flyer full size ↗
            </a>
          ) : null}
          <details>
            <summary>Read published text details</summary>
            <p style={{ whiteSpace: 'pre-wrap' }}>{value.details}</p>
          </details>
        </>
      ) : null}
    </section>
  )
}
