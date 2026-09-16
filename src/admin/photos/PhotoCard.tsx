'use client'
/* eslint-disable @next/next/no-img-element -- Bounded CMS thumbnails and local previews. */
import { useState } from 'react'
import type { PhotoBatchItem } from '@/payload-types'
import { idOf } from './api'
export default function PhotoCard({
  item,
  busy,
  album,
  cover,
  preview,
  uploadStatus,
  first,
  last,
  action,
  move,
  dirtyChanged,
}: {
  item: PhotoBatchItem
  busy: boolean
  album: boolean
  cover: boolean
  preview?: string
  uploadStatus?: string
  first: boolean
  last: boolean
  action: (action: string, data?: Record<string, unknown>) => void
  move: (direction: -1 | 1) => void
  dirtyChanged: (dirty: boolean) => void
}) {
  const [title, setTitle] = useState(item.title)
  const [caption, setCaption] = useState(item.caption || '')
  const [alt, setAlt] = useState(item.alt || '')
  const media = typeof item.media === 'object' ? item.media : null
  const photo = typeof item.photo === 'object' ? item.photo : null
  const changed = photo && photo.updatedAt !== item.photoRevision && item.status !== 'published'
  const src = media?.sizes?.small?.url || media?.url || preview
  const editable = item.status !== 'published'
  return (
    <article className="club-photo-card" aria-label={item.title}>
      {src ? (
        <a
          href={media?.url || preview}
          target="_blank"
          rel="noreferrer"
          aria-label={`Enlarge ${item.title}`}
        >
          <img src={src} alt={item.alt || item.title} loading="lazy" />
        </a>
      ) : (
        <div className="club-photo-placeholder">Waiting for photo</div>
      )}
      <h3>{item.title}</h3>
      <p className="club-photo-filename">{item.filename}</p>
      <p role="status">
        {uploadStatus ||
          {
            pending: 'Waiting for upload',
            ready: 'Uploaded — ready to review',
            error: 'Needs attention',
            published: 'Published on website',
            excluded: 'Excluded',
          }[item.status]}
        {cover ? ' · Album cover' : ''}
      </p>
      {item.error ? <p role="alert">{item.error}</p> : null}
      {changed ? (
        <div className="club-panel">
          <p>This photo has saved changes from its editor.</p>
          <p>Saved title: {photo.title}</p>
          <p>Caption: {photo.description || 'None'}</p>
          <p>Description: {photo.imageAlt || 'None'}</p>
          {typeof photo.image === 'object' && photo.image?.url ? (
            <img
              src={photo.image.sizes?.small?.url || photo.image.url}
              alt={photo.imageAlt || photo.title}
            />
          ) : null}
          <button disabled={busy} type="button" onClick={() => action('acceptPhotoChanges')}>
            Use these saved photo changes
          </button>
        </div>
      ) : null}
      {editable ? (
        <>
          <label>
            Photo title
            <input
              value={title}
              disabled={busy}
              onChange={(e) => {
                setTitle(e.target.value)
                dirtyChanged(true)
              }}
            />
          </label>
          <label>
            Caption shown below this photo
            <textarea
              value={caption}
              disabled={busy}
              onChange={(e) => {
                setCaption(e.target.value)
                dirtyChanged(true)
              }}
            />
          </label>
          <label>
            Description for people who cannot see the photo
            <textarea
              value={alt}
              disabled={busy}
              placeholder="For example: Members gathering around the picnic table"
              onChange={(e) => {
                setAlt(e.target.value)
                dirtyChanged(true)
              }}
            />
          </label>
          <div className="club-photo-actions">
            <button
              type="button"
              disabled={busy || !!changed}
              onClick={() => action('edit', { title, caption, alt })}
            >
              Save photo details
            </button>
            <button type="button" disabled={busy || first || !!changed} onClick={() => move(-1)}>
              Move up
            </button>
            <button type="button" disabled={busy || last || !!changed} onClick={() => move(1)}>
              Move down
            </button>
            {album && item.status === 'ready' ? (
              <button type="button" disabled={busy || cover} onClick={() => action('cover')}>
                Make album cover
              </button>
            ) : null}
            <button type="button" disabled={busy || !!changed} onClick={() => action('exclude')}>
              Exclude from this batch
            </button>
          </div>
        </>
      ) : idOf(item.photo) ? (
        <a href={`/admin/collections/galleryItems/${idOf(item.photo)}`}>Edit published photo</a>
      ) : null}
    </article>
  )
}
