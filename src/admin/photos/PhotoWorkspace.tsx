'use client'
/* eslint-disable @next/next/no-img-element -- Bounded CMS cover thumbnail. */
import { useEffect, useRef, useState } from 'react'
import { useUploadHandlers } from '@payloadcms/ui'
import Link from 'next/link'
import type { Album, Media, PhotoBatch, PhotoBatchItem } from '@/payload-types'
import { MAX_BATCH_PHOTOS, MAX_PHOTO_BYTES, PHOTO_TYPES } from '@/photoBatches/limits'
import { idOf, jsonPost, request, type BatchSnapshot } from './api'
import LibraryPhotos from './LibraryPhotos'
import PhotoCard from './PhotoCard'

export default function PhotoWorkspace({
  initial,
  recent,
  albums,
  initialDestination,
  initialAlbum,
}: {
  initial: BatchSnapshot | null
  recent: PhotoBatch[]
  albums: Album[]
  initialDestination: 'main' | 'existing' | 'new'
  initialAlbum?: number
}) {
  const [snapshot, setSnapshot] = useState(initial)
  const current = useRef(initial)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [destination, setDestination] = useState(initialDestination)
  const [albumID, setAlbumID] = useState(initialAlbum || albums[0]?.id || 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [library, setLibrary] = useState(false)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState<Record<number, string>>({})
  const [dirty, setDirty] = useState<Set<number>>(new Set())
  const files = useRef(new Map<string, { file: File; preview: string }>())
  const { getUploadHandler } = useUploadHandlers()
  useEffect(() => {
    const selected = files.current
    return () => {
      for (const file of selected.values()) URL.revokeObjectURL(file.preview)
    }
  }, [])
  useEffect(() => {
    if (!busy && !dirty.size) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy, dirty.size])
  function apply(next: BatchSnapshot) {
    if (!current.current || next.batch.revision >= current.current.batch.revision) {
      current.current = next
      setSnapshot(next)
    }
    return next
  }
  async function action(name: string, data: Record<string, unknown> = {}) {
    const batch = current.current!.batch
    return apply(
      await request<BatchSnapshot>(
        `/api/photoBatches/${batch.id}/action`,
        jsonPost({ action: name, revision: batch.revision, ...data }),
      ),
    )
  }
  async function run(work: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await work()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This step did not finish. Try again.')
    } finally {
      setBusy(false)
    }
  }
  async function upload(item: PhotoBatchItem) {
    const report = (text: string) => setProgress((old) => ({ ...old, [item.id]: text }))
    try {
      report('Checking saved upload…')
      const existing = await request<{ docs: Media[] }>(
        `/api/media?where[uploadKey][equals]=${encodeURIComponent(item.key)}&limit=1&depth=0`,
      )
      if (existing.docs[0]) {
        await action('finish', { item: item.id, media: existing.docs[0].id })
        return
      }
      const file = files.current.get(item.fingerprint)?.file
      let receipt = item.receipt
      if (!receipt) {
        if (!file)
          throw new Error(
            'Choose photos again and select this original file to resume. Completed photos are already saved.',
          )
        report('Uploading original photo…')
        const handler = getUploadHandler({ collectionSlug: 'media' })
        if (handler) {
          let filename = file.name
          const clientUploadContext = await handler({
            file,
            updateFilename: (value) => {
              filename = value
            },
          })
          receipt = {
            clientUploadContext,
            collectionSlug: 'media',
            filename,
            mimeType: file.type,
            size: file.size,
          }
          await action('receipt', { item: item.id, receipt })
        }
      }
      const form = new FormData()
      form.set('_payload', JSON.stringify({ alt: '', uploadKey: item.key }))
      if (receipt) form.set('file', JSON.stringify(receipt))
      else if (file) form.set('file', file)
      else throw new Error('Select the original file to resume this upload.')
      report('Creating thumbnails…')
      const response = await request<{ doc: Media }>('/api/media', { method: 'POST', body: form })
      report('Saving photo draft…')
      await action('finish', { item: item.id, media: response.doc.id })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed. Try this photo again.'
      await action('error', { item: item.id, message }).catch(() => {
        throw new Error(message)
      })
    } finally {
      setProgress((old) => {
        const next = { ...old }
        delete next[item.id]
        return next
      })
    }
  }
  async function uploadWaiting() {
    const pending = current.current!.items.filter((item) =>
      ['pending', 'error'].includes(item.status),
    )
    let index = 0
    const results = await Promise.allSettled(
      Array.from({ length: Math.min(2, pending.length) }, async () => {
        while (index < pending.length) await upload(pending[index++])
      }),
    )
    const failed = results.find((result) => result.status === 'rejected')
    if (failed?.status === 'rejected') throw failed.reason
    await action('read')
    setMessage('Upload check complete. Review the photos and any items needing attention below.')
  }
  async function selectFiles(selected: File[]) {
    if (selected.length > MAX_BATCH_PHOTOS) throw new Error('Choose up to 100 photos at a time.')
    const invalid = selected.filter(
      (file) => !PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_BYTES || !file.size,
    )
    if (invalid.length)
      throw new Error(
        `${invalid.map((file) => file.name).join(', ')}: choose JPEG, PNG, WebP, AVIF, or GIF files no larger than 30 MB. Export HEIC as JPEG first; no files from this selection were added.`,
      )
    const entries: { fingerprint: string; name: string }[] = []
    for (const file of selected) {
      setMessage(`Checking ${file.name}…`)
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
      const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('')
      const previous = files.current.get(fingerprint)
      if (previous) URL.revokeObjectURL(previous.preview)
      files.current.set(fingerprint, { file, preview: URL.createObjectURL(file) })
      setPreviews((old) => ({ ...old, [fingerprint]: files.current.get(fingerprint)!.preview }))
      entries.push({ fingerprint, name: file.name })
    }
    const before = current.current!.items.length
    const next = await action('reserve', { files: entries })
    const duplicates = entries.length - (next.items.length - before)
    await uploadWaiting()
    if (duplicates)
      setMessage(
        `${duplicates} already selected photo${duplicates === 1 ? ' was' : 's were'} recognized. Saved photos were kept; unfinished uploads were retried.`,
      )
  }
  const batch = snapshot?.batch
  const album = typeof batch?.album === 'object' ? batch.album : null
  const items = snapshot?.items.filter((item) => item.status !== 'excluded') || []
  const ready = items.filter((item) => item.status === 'ready').length
  const unresolved = items.filter((item) => ['pending', 'error'].includes(item.status)).length
  const published = items.filter((item) => item.status === 'published').length
  const albumChanged = !!album && album.updatedAt !== batch?.albumRevision
  const cover = typeof batch?.cover === 'object' ? batch.cover : null
  const publicHref = album?.slug ? `/gallery/albums/${album.slug}` : '/gallery'
  const dirtyChanged = (id: number, value: boolean) =>
    setDirty((old) => {
      const next = new Set(old)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })
  return (
    <div className="club-photos">
      {error ? (
        <div role="alert" className="club-panel">
          <p>{error}</p>
          {batch ? (
            <button
              type="button"
              disabled={busy || !!dirty.size}
              onClick={() =>
                void run(async () => {
                  await action('read')
                })
              }
            >
              Reload saved batch
            </button>
          ) : null}
          <p>
            <a href="/admin/login" target="_blank" rel="noreferrer">
              Sign in again if needed ↗
            </a>
          </p>
        </div>
      ) : null}
      <p role="status" aria-live="polite">
        {message}
      </p>
      {!batch ? (
        <>
          <form
            className="club-panel"
            onSubmit={(event) => {
              event.preventDefault()
              void run(async () => {
                const next = apply(
                  await request<BatchSnapshot>(
                    '/api/photoBatches/start',
                    jsonPost({ title, date, destination, album: albumID }),
                  ),
                )
                window.history.replaceState(null, '', `/admin/photos?batch=${next.batch.id}`)
              })
            }}
          >
            <h2>1. Name these photos</h2>
            <label>
              Shared photo or album name
              <input
                required
                maxLength={160}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="For example: September picnic"
              />
            </label>
            <label>
              Date taken (optional)
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Where should they appear?
              <select
                value={destination}
                onChange={(event) => setDestination(event.target.value as typeof destination)}
              >
                <option value="main">Main gallery — no album</option>
                <option value="existing">Existing album</option>
                <option value="new">New album</option>
              </select>
            </label>
            {destination === 'existing' ? (
              <label>
                Choose an album
                <select
                  required
                  value={albumID || ''}
                  onChange={(event) => setAlbumID(Number(event.target.value))}
                >
                  <option value="">Choose an album</option>
                  {albums.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.title} ({value._status})
                    </option>
                  ))}
                </select>
                <span>
                  The 100 most recently edited albums are listed. Older albums also have an Add
                  photos link in their editor.
                </span>
              </label>
            ) : null}
            <button type="submit" disabled={busy}>
              Continue to choose photos
            </button>
          </form>
          <section className="club-panel">
            <h2>Continue a saved batch</h2>
            {recent.length ? (
              <ul>
                {recent.map((value) => (
                  <li key={value.id}>
                    <Link href={`/admin/photos?batch=${value.id}`}>{value.title}</Link> —{' '}
                    {value.state === 'published' ? 'Published' : 'Review or resume'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No saved batches yet.</p>
            )}
          </section>
        </>
      ) : (
        <>
          <header className="club-panel">
            <h2>{batch.title}</h2>
            <p>Destination: {album?.title || 'Main gallery — no album'}</p>
            <p role="status">
              {ready} ready to review · {unresolved} need attention · {published} published
            </p>
            {batch.state === 'published' ? (
              <p>
                <strong>Published on the website.</strong>{' '}
                <a href={publicHref} target="_blank" rel="noreferrer">
                  View on website ↗
                </a>
              </p>
            ) : (
              <p>
                Ready photos are saved as drafts. They appear on the website when you publish below.
              </p>
            )}
            <Link href="/admin/photos">Start another batch</Link>
          </header>
          {batch.state !== 'published' ? (
            <>
              <section className="club-panel">
                <h2>2. Choose photos</h2>
                <p>
                  Up to 100 photos per batch. JPEG, PNG, WebP, AVIF, or GIF; up to 30 MB and 50
                  megapixels each. Export HEIC photos as JPEG first.
                </p>
                <p>
                  We upload two at a time. If you leave before a file finishes, you may need to
                  select that original again. Completed uploads remain saved.
                </p>
                <label className="club-photo-file">
                  Choose photos
                  <input
                    type="file"
                    multiple
                    accept={PHOTO_TYPES.join(',')}
                    disabled={busy || !!dirty.size}
                    onChange={(event) => {
                      const selected = Array.from(event.target.files || [])
                      event.target.value = ''
                      if (selected.length) void run(() => selectFiles(selected))
                    }}
                  />
                </label>
                <div className="club-photo-actions">
                  <button
                    type="button"
                    disabled={busy || !!dirty.size}
                    onClick={() => setLibrary(!library)}
                  >
                    {library ? 'Close library' : 'Choose existing library photos'}
                  </button>
                  {unresolved ? (
                    <button
                      type="button"
                      disabled={busy || !!dirty.size}
                      onClick={() => void run(uploadWaiting)}
                    >
                      Retry unfinished uploads
                    </button>
                  ) : null}
                </div>
                {library ? (
                  <LibraryPhotos
                    busy={busy || !!dirty.size}
                    add={(photos) =>
                      void run(async () => {
                        await action('reserve', {
                          files: photos.map((photo) => ({
                            fingerprint: `media:${photo.id}`,
                            name: photo.filename,
                          })),
                        })
                        setMessage('Library photos added as drafts. Review them below.')
                      })
                    }
                  />
                ) : null}
              </section>
              {albumChanged ? (
                <section className="club-panel">
                  <h2>Review saved album changes</h2>
                  <p>The album was edited after this batch started.</p>
                  <p>Title: {album.title}</p>
                  <p>Description: {album.description || 'None'}</p>
                  <p>
                    Date: {album.date || 'None'} · Status: {album._status}
                  </p>
                  {typeof album.cover === 'object' && album.cover?.url ? (
                    <img
                      className="club-cover-preview"
                      src={album.cover.sizes?.small?.url || album.cover.url}
                      alt="Saved album cover"
                    />
                  ) : null}
                  <p>
                    <a
                      href={`/admin/collections/albums/${album.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Review album editor ↗
                    </a>
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await action('acceptAlbumChanges')
                      })
                    }
                  >
                    Use these saved album changes
                  </button>
                </section>
              ) : null}
            </>
          ) : null}
          <h2>3. Review photos</h2>
          <p>
            Open a photo to see it larger. A caption is optional. Excluding a photo keeps its
            library file.
          </p>
          {published > 0 && batch.state !== 'published' ? (
            <p>
              Some photos are already public. Finish this batch, then use the album or photo editor
              to change their order.
            </p>
          ) : null}
          {dirty.size ? (
            <p role="status">Save the changed photo details before adding or publishing photos.</p>
          ) : null}
          <div className="club-photo-grid">
            {items.map((item, index) => (
              <PhotoCard
                key={`${item.id}:${item.photoRevision || ''}:${item.updatedAt}`}
                item={item}
                busy={busy}
                sortingDisabled={busy || !!dirty.size || published > 0}
                drop={(source) =>
                  void run(async () => {
                    const ids = current.current!.items.map((entry) => entry.id)
                    const from = ids.indexOf(source),
                      to = ids.indexOf(item.id)
                    if (from < 0 || to < 0) return
                    ids.splice(from, 1)
                    ids.splice(to, 0, source)
                    await action('reorder', { ids })
                  })
                }
                album={!!album}
                cover={idOf(batch.cover) === idOf(item.media) && !!idOf(batch.cover)}
                preview={previews[item.fingerprint]}
                uploadStatus={progress[item.id]}
                first={index === 0}
                last={index === items.length - 1}
                dirtyChanged={(value) => dirtyChanged(item.id, value)}
                action={(name, data) =>
                  void run(async () => {
                    await action(name, { item: item.id, ...data })
                    dirtyChanged(item.id, false)
                    setMessage(name === 'edit' ? 'Photo details saved.' : 'Batch saved.')
                  })
                }
                move={(direction) =>
                  void run(async () => {
                    if (dirty.size) throw new Error('Save changed photo details before reordering.')
                    const ids = current.current!.items.map((entry) => entry.id)
                    const from = ids.indexOf(item.id),
                      to = ids.indexOf(items[index + direction].id)
                    ;[ids[from], ids[to]] = [ids[to], ids[from]]
                    await action('reorder', { ids })
                  })
                }
              />
            ))}
          </div>
          {album ? (
            <p>
              New albums use an automatic collage. Choose “Make album cover” on a photo for a
              single-image cover. Existing albums keep their saved cover choice.
            </p>
          ) : null}
          {cover?.url ? (
            <section className="club-panel">
              <h3>Album cover crop</h3>
              <button
                type="button"
                disabled={busy || !!dirty.size || batch.state === 'published'}
                onClick={() =>
                  void run(async () => {
                    await action('resetCover')
                  })
                }
              >
                Use album’s default cover instead
              </button>
              <img
                className="club-cover-preview"
                src={cover.sizes?.small?.url || cover.url}
                alt={cover.alt || batch.title}
              />
            </section>
          ) : null}
          {batch.state !== 'published' ? (
            <section className="club-panel">
              <h2>4. Publish reviewed photos</h2>
              {unresolved ? (
                <p>
                  {unresolved} photos need attention. Retry or exclude them first, or deliberately
                  publish only the {ready} ready photos now and return for the rest.
                </p>
              ) : (
                <p>
                  Publish {ready} photos to {album?.title || 'the main gallery'}.
                </p>
              )}
              <button
                type="button"
                disabled={busy || !!dirty.size || albumChanged || (!ready && !published)}
                onClick={() =>
                  void run(async () => {
                    await action('publish', { allowPartial: unresolved > 0 })
                    setMessage('Publication saved. Use View on website to check the result.')
                  })
                }
              >
                {unresolved
                  ? `Publish only the ${ready} ready photos`
                  : ready
                    ? `Publish ${ready} photos`
                    : 'Finish this published batch'}
              </button>
              {published ? (
                <p>
                  <a href={publicHref} target="_blank" rel="noreferrer">
                    View published photos ↗
                  </a>
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
