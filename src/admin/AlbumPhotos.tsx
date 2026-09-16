'use client'
/* eslint-disable @next/next/no-img-element -- CMS supplies bounded thumbnail URLs. */
import { useDocumentInfo, useField } from '@payloadcms/ui'
import { useState } from 'react'
import Link from 'next/link'
import type { GalleryItem, Media } from '@/payload-types'
import { AlbumCover } from '@/serenity/AlbumCover'
import { albumCoverImages } from '@/serenity/albumCover'
import { useResource } from './useResource'

type PhotoPage = { docs: GalleryItem[]; totalDocs: number; totalPages: number }
export default function AlbumPhotos() {
  const { id } = useDocumentInfo()
  const [page, setPage] = useState(1)
  const { value: selectedCover, setValue: setCover } = useField<number | Media | null>({
    path: 'cover',
  })
  const coverID = typeof selectedCover === 'object' ? selectedCover?.id : selectedCover
  const base = id ? `/api/galleryItems?where[album][equals]=${id}&depth=1&sort=order,id` : null
  const result = useResource<PhotoPage>(base ? `${base}&draft=true&limit=12&page=${page}` : null)
  const published = useResource<PhotoPage>(
    base ? `${base}&draft=false&where[_status][equals]=published&limit=4` : null,
  )
  const selected = useResource<PhotoPage>(
    base && coverID
      ? `${base}&draft=false&where[_status][equals]=published&where[image][equals]=${coverID}&limit=1`
      : null,
  )
  const selectedImages = albumCoverImages(selected.value?.docs || [])
  const preview =
    coverID && selectedImages.length
      ? selectedImages
      : albumCoverImages(published.value?.docs || [])
  return (
    <section className="club-panel club-admin">
      <h2>Album cover</h2>
      <p>
        A collage uses the first four published photos in album order. With fewer photos, it adjusts
        automatically.
      </p>
      <button
        type="button"
        aria-pressed={!coverID}
        disabled={!coverID}
        onClick={() => setCover(null)}
      >
        {coverID ? 'Use automatic collage' : 'Automatic collage selected'}
      </button>
      <p>
        Prefer one photo? Choose “Use as album cover” below. Publish the album to show your choice
        on the website.
      </p>
      {id ? (
        <>
          <div style={{ maxWidth: 400 }} aria-label="Album cover preview">
            <AlbumCover images={preview} />
          </div>
          <p>
            {coverID && selectedImages.length
              ? 'Selected photo cover'
              : 'Automatic collage preview'}
          </p>
          {coverID && selected.value && !selectedImages.length ? (
            <p role="alert">
              The selected cover is no longer a published photo in this album. The website uses the
              collage. Choose another photo or select the automatic collage before publishing.
            </p>
          ) : null}
          {selected.error || published.error ? (
            <p role="alert">{selected.error || published.error}</p>
          ) : null}
          <h2>Photos in this album</h2>
          <p>
            {result.value?.totalDocs ?? 'Loading'} photos. Draft photos remain private until
            published.
          </p>
          <p>
            <Link href={`/admin/photos?album=${id}`}>Add photos to this album</Link>
          </p>
          <Link href={`/admin/organize-photos?album=${id}`}>Move, reorder, or remove photos</Link>
          {result.error ? <p role="alert">{result.error}</p> : null}
          <div className="club-week-grid" aria-busy={result.loading}>
            {result.value?.docs.map((photo) => {
              const image = typeof photo.image === 'object' ? photo.image : null
              const chosen = image && coverID === image.id
              return (
                <div key={photo.id}>
                  {image?.url ? (
                    <img
                      src={image.sizes?.thumbnail?.url || image.url}
                      alt={photo.imageAlt || photo.title}
                      loading="lazy"
                      style={{ width: '100%', height: 140, objectFit: 'contain' }}
                    />
                  ) : null}
                  <Link href={`/admin/collections/galleryItems/${photo.id}`}>{photo.title}</Link>
                  {image ? (
                    <button
                      type="button"
                      disabled={!!chosen || photo._status !== 'published'}
                      aria-pressed={!!chosen}
                      onClick={() => setCover(image.id)}
                    >
                      {chosen ? 'Selected album cover' : 'Use as album cover'}
                    </button>
                  ) : null}
                  <p>
                    {photo._status === 'published'
                      ? 'Published photo'
                      : 'Publish this photo before using it as a cover.'}
                  </p>
                </div>
              )
            })}
          </div>
          <nav aria-label="Album photo pages" className="club-photo-actions">
            <button
              type="button"
              disabled={page <= 1 || result.loading}
              onClick={() => setPage(page - 1)}
            >
              Previous photos
            </button>
            <span aria-live="polite">
              Page {page} of {result.value?.totalPages || page}
            </span>
            <button
              type="button"
              disabled={!result.value || page >= result.value.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next photos
            </button>
          </nav>
        </>
      ) : (
        <p>Save a draft first. Then add photos to create the collage or choose a cover.</p>
      )}
    </section>
  )
}
