'use client'
/* eslint-disable @next/next/no-img-element -- Bounded CMS thumbnails. */
import { useState } from 'react'
import type { Media } from '@/payload-types'
import { useResource } from '../useResource'
export default function LibraryPhotos({
  busy,
  add,
}: {
  busy: boolean
  add: (photos: Media[]) => void
}) {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<number, Media>>(new Map())
  const result = useResource<{ docs: Media[]; totalPages: number }>(
    `/api/media?limit=24&depth=0&sort=-createdAt&page=${page}&where[mimeType][like]=image/&where[filename][like]=${encodeURIComponent(query)}`,
  )
  return (
    <section className="club-panel">
      <h2>Choose existing library photos</h2>
      <label>
        Find a filename
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
      </label>
      {result.error ? <p role="alert">{result.error}</p> : null}
      {result.loading ? <p role="status">Loading photos…</p> : null}
      <div className="club-photo-grid club-library-grid">
        {result.value?.docs.map((photo) => (
          <label key={photo.id} className="club-photo-card">
            <img loading="lazy" src={photo.sizes?.thumbnail?.url || photo.url || ''} alt="" />
            <span>
              <input
                type="checkbox"
                disabled={busy}
                checked={selected.has(photo.id)}
                onChange={(event) => {
                  const next = new Map(selected)
                  if (event.target.checked) next.set(photo.id, photo)
                  else next.delete(photo.id)
                  setSelected(next)
                }}
              />{' '}
              {photo.filename}
            </span>
          </label>
        ))}
      </div>
      <div className="club-photo-actions">
        <button type="button" disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>
          Previous library page
        </button>
        <span>
          Page {page} of {result.value?.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={busy || !result.value || page >= result.value.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next library page
        </button>
        <button
          type="button"
          disabled={busy || !selected.size}
          onClick={() => {
            add([...selected.values()])
            setSelected(new Map())
          }}
        >
          Add {selected.size} selected photos
        </button>
      </div>
    </section>
  )
}
