'use client'
/* eslint-disable @next/next/no-img-element -- Bounded CMS thumbnails, with an original-file link. */
import { useState } from 'react'
import Link from 'next/link'
import type { Album, GalleryItem } from '@/payload-types'
import { useResource } from '../useResource'
import { request, jsonPost } from './api'

type Result = { docs: GalleryItem[]; totalDocs: number; totalPages: number }
export default function GalleryOrganizerClient({
  initialAlbum,
  albums,
}: {
  initialAlbum: number | null
  albums: Album[]
}) {
  const [album, setAlbum] = useState(initialAlbum)
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [destination, setDestination] = useState('main')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const params = new URLSearchParams({
    draft: 'true',
    depth: '1',
    limit: '24',
    page: String(page),
    sort: 'order,id',
    refresh: String(refresh),
  })
  params.set(
    album ? 'where[album][equals]' : 'where[album][exists]',
    album ? String(album) : 'false',
  )
  const result = useResource<Result>(`/api/galleryItems?${params}`)
  const photos = result.value?.docs || []
  const currentAlbum = albums.find((item) => item.id === album)
  const canSort = !busy && !result.loading && photos.length > 1
  async function act(
    action: string,
    data: Record<string, unknown>,
    chosen = photos.filter((photo) => selected.includes(photo.id)),
  ) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await request<{ message: string }>(
        '/api/galleryItems/organize',
        jsonPost({
          action,
          photos: chosen.map((photo) => ({ id: photo.id, updatedAt: photo.updatedAt })),
          ...data,
        }),
      )
      setMessage(response.message)
      setSelected([])
      setRefresh((value) => value + 1)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'This change did not finish. Reload the photos and try again.',
      )
    } finally {
      setBusy(false)
    }
  }
  const move = (from: number, to: number) => {
    const ids = photos.map((photo) => photo.id)
    const [id] = ids.splice(from, 1)
    ids.splice(to, 0, id)
    void act('reorder', { ids }, photos)
  }
  return (
    <div className="club-photos">
      <section className="club-panel">
        <label>
          Show photos in
          <select
            value={album || ''}
            disabled={busy}
            onChange={(event) => {
              setAlbum(Number(event.target.value) || null)
              setPage(1)
              setSelected([])
            }}
          >
            <option value="">Main gallery — no album</option>
            {albums.map((item) => (
              <option value={item.id} key={item.id}>
                {item.title} ({item._status})
              </option>
            ))}
          </select>
        </label>
        <div className="club-photo-actions">
          <Link href={album ? `/admin/photos?album=${album}` : '/admin/photos'}>
            Add more photos
          </Link>
          {album ? (
            <Link href={`/admin/collections/albums/${album}`}>Edit album details and cover</Link>
          ) : null}
          <a
            href={currentAlbum?.slug ? `/gallery/albums/${currentAlbum.slug}` : '/gallery'}
            target="_blank"
            rel="noreferrer"
          >
            View on website ↗
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setSelected([])
              setRefresh((value) => value + 1)
            }}
          >
            Reload photos
          </button>
        </div>
        <p>
          Moving or reordering a published photo changes the website immediately. Drafts stay
          drafts. A draft album hides its photos.
        </p>
        <p>
          To hide an entire album, open its editor and unpublish it. Its photos remain together.
        </p>
      </section>
      {message ? <p role="status">{message}</p> : null}
      {error || result.error ? <p role="alert">{error || result.error}</p> : null}
      <section className="club-panel">
        <h2>Move or remove selected photos</h2>
        <p>{selected.length} selected on this page.</p>
        <div className="club-photo-actions">
          <button
            type="button"
            disabled={busy || result.loading}
            onClick={() => setSelected(photos.map((photo) => photo.id))}
          >
            Select this page
          </button>
          <button type="button" disabled={busy || !selected.length} onClick={() => setSelected([])}>
            Clear selection
          </button>
        </div>
        <label>
          Move selected photos to
          <select
            value={destination}
            disabled={busy}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="main">Main gallery — no album</option>
            {albums.map((item) => (
              <option value={item.id} key={item.id}>
                {item.title} ({item._status})
              </option>
            ))}
          </select>
        </label>
        <div className="club-photo-actions">
          <button
            type="button"
            disabled={busy || !selected.length}
            onClick={() =>
              void act('move', { album: destination === 'main' ? null : Number(destination) })
            }
          >
            Move {selected.length} selected photos
          </button>
          <button
            type="button"
            disabled={busy || !selected.length}
            onClick={() => void act('trash', {})}
          >
            Move {selected.length} photos to Trash
          </button>
          <Link href="/admin/collections/galleryItems/trash">Open photo Trash to restore</Link>
        </div>
      </section>
      <p role="status">
        {result.loading
          ? 'Loading photos…'
          : `${result.value?.totalDocs ?? 0} photos · Page ${page} of ${result.value?.totalPages || 1}`}
      </p>
      <div className="club-photo-grid" aria-busy={busy || result.loading}>
        {photos.map((photo, index) => {
          const image = typeof photo.image === 'object' ? photo.image : null
          return (
            <article
              className="club-photo-card"
              key={photo.id}
              aria-label={photo.title}
              onDragOver={(event) => {
                if (
                  canSort &&
                  event.dataTransfer.types.includes('application/x-serenity-existing-photo')
                )
                  event.preventDefault()
              }}
              onDrop={(event) => {
                const from = photos.findIndex(
                  (item) =>
                    item.id ===
                    Number(event.dataTransfer.getData('application/x-serenity-existing-photo')),
                )
                if (canSort && from >= 0 && from !== index) {
                  event.preventDefault()
                  move(from, index)
                }
              }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(photo.id)}
                  disabled={busy}
                  onChange={(event) =>
                    setSelected((old) =>
                      event.target.checked
                        ? [...old, photo.id]
                        : old.filter((id) => id !== photo.id),
                    )
                  }
                />{' '}
                Select {photo.title}
              </label>
              {image?.url ? (
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Enlarge ${photo.title}`}
                >
                  <img
                    loading="lazy"
                    src={image.sizes?.small?.url || image.url}
                    alt={photo.imageAlt || photo.title}
                  />
                </a>
              ) : null}
              <h3>{photo.title}</h3>
              <p>{photo._status === 'published' ? 'Published photo' : 'Draft photo'}</p>
              {photo.description ? <p>{photo.description}</p> : null}
              <div className="club-photo-actions">
                <Link href={`/admin/collections/galleryItems/${photo.id}`}>
                  Edit caption or photo
                </Link>
                <button
                  type="button"
                  disabled={!canSort || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  Move up on this page
                </button>
                <button
                  type="button"
                  disabled={!canSort || index === photos.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  Move down on this page
                </button>
                <button
                  type="button"
                  draggable={canSort}
                  disabled={!canSort}
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      'application/x-serenity-existing-photo',
                      String(photo.id),
                    )
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  Drag to reorder
                </button>
              </div>
            </article>
          )
        })}
      </div>
      <div className="club-pager">
        <button
          type="button"
          disabled={busy || result.loading || page === 1}
          onClick={() => {
            setPage(page - 1)
            setSelected([])
          }}
        >
          Previous photos
        </button>
        <button
          type="button"
          disabled={busy || result.loading || page >= (result.value?.totalPages || 1)}
          onClick={() => {
            setPage(page + 1)
            setSelected([])
          }}
        >
          Next photos
        </button>
      </div>
    </div>
  )
}
