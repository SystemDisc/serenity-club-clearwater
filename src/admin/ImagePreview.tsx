'use client'

import { useField } from '@payloadcms/ui'
import { useRef, useState } from 'react'
import type { Media } from '@/payload-types'
import { useResource } from './useResource'
import { mediaDisplayName } from './mediaDisplayName'

type Props = { imageField: string; externalField?: string }

export default function ImagePreview({ imageField, externalField = 'externalImageUrl' }: Props) {
  const { value, setValue } = useField<number | Media | null>({ path: imageField })
  const { value: external } = useField<string>({ path: externalField })
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const id = value && typeof value === 'object' ? value.id : value
  const {
    value: photo,
    error: photoError,
    loading: photoLoading,
  } = useResource<Media>(id ? `/api/media/${id}?depth=0` : null)
  const params = new URLSearchParams({
    depth: '0',
    limit: '24',
    page: String(page),
    sort: '-createdAt',
    'where[mimeType][in]': 'image/jpeg,image/png,image/webp,image/avif,image/gif',
  })
  if (search) params.set('where[or][0][filename][like]', search)
  if (search) params.set('where[or][1][alt][like]', search)
  const {
    value: result,
    error,
    loading,
  } = useResource<{ docs: Media[]; totalPages: number }>(open ? `/api/media?${params}` : null)
  const items = result?.docs || []
  const pages = result?.totalPages || 1
  const close = () => {
    dialog.current?.close()
    setOpen(false)
    button.current?.focus()
  }
  const url = photo?.sizes?.medium?.url || photo?.url || (!id ? external : '')
  return (
    <div className="club-image-preview">
      {url ? (
        <figure>
          <a href={photo?.url || url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={photo?.alt || 'Selected image preview'} />
          </a>
          <figcaption>
            Selected image ·{' '}
            <a href={photo?.url || url} target="_blank" rel="noreferrer">
              View full size ↗
            </a>
          </figcaption>
        </figure>
      ) : (
        <p>{photoLoading ? 'Loading the selected photo…' : 'No photo selected yet.'}</p>
      )}
      <button
        type="button"
        ref={button}
        onClick={() => {
          setOpen(true)
          dialog.current?.showModal()
        }}
      >
        Choose from photo grid
      </button>
      {photoError ? <p role="alert">{photoError}</p> : null}
      <dialog
        ref={dialog}
        className="club-photo-dialog"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        aria-label="Choose an existing photo"
      >
        <div className="club-dialog-heading">
          <h2>Choose an existing photo</h2>
          <button type="button" onClick={close}>
            Close
          </button>
        </div>
        <div className="club-photo-search">
          <label>
            Find by filename or description
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  setSearch(query)
                  setPage(1)
                }
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setSearch(query)
              setPage(1)
            }}
          >
            Search photos
          </button>
        </div>
        <p aria-live="polite">
          {loading ? 'Loading photos…' : `${items.length} photos on page ${page} of ${pages}`}
        </p>
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !items.length ? (
          <p>No matching photos. Try another search, or close this window to upload a new photo.</p>
        ) : null}
        <div className="club-photo-grid" aria-busy={loading}>
          {items.map((item) => (
            <article key={item.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                loading="lazy"
                src={item.sizes?.thumbnail?.url || item.url || ''}
                alt={item.alt || 'Library photo'}
              />
              <p title={item.filename || ''}>{mediaDisplayName(item)}</p>
              <div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setValue(item.id)
                    close()
                  }}
                >
                  Use this photo
                </button>
                <a href={item.url || undefined} target="_blank" rel="noreferrer">
                  View larger ↗
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="club-pager">
          <button type="button" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </dialog>
    </div>
  )
}
