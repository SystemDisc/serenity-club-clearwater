'use client'
/* eslint-disable @next/next/no-img-element -- CMS supplies bounded thumbnail URLs. */
import { useDocumentInfo } from '@payloadcms/ui'
import Link from 'next/link'
import type { GalleryItem } from '@/payload-types'
import { useResource } from './useResource'
export default function AlbumPhotos() {
  const { id } = useDocumentInfo()
  const result = useResource<{ docs: GalleryItem[]; totalDocs: number }>(
    id
      ? `/api/galleryItems?where[album][equals]=${id}&draft=true&limit=12&depth=1&sort=order,id`
      : null,
  )
  return (
    <section className="club-panel club-admin">
      <h2>Photos in this album</h2>
      {id ? (
        <>
          <p>
            {result.value?.totalDocs ?? 'Loading'} photos. Draft photos remain private until
            published.
          </p>
          <p>
            <Link href={`/admin/photos?album=${id}`}>Add photos to this album</Link>
          </p>
          <Link href={`/admin/collections/galleryItems?where[album][equals]=${id}`}>
            Manage this album’s photos
          </Link>
          {result.error ? <p role="alert">{result.error}</p> : null}
          <div className="club-week-grid">
            {result.value?.docs.map((photo) => {
              const image = typeof photo.image === 'object' ? photo.image : null
              return (
                <div key={photo.id}>
                  {image?.url ? (
                    <img
                      src={image.sizes?.thumbnail?.url || image.url}
                      alt={photo.imageAlt || photo.title}
                      style={{ width: '100%', height: 140, objectFit: 'contain' }}
                    />
                  ) : null}
                  <Link href={`/admin/collections/galleryItems/${photo.id}`}>{photo.title}</Link>
                  <p>{photo._status === 'published' ? 'Published photo' : 'Draft photo'}</p>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p>Save a draft first. Then add photos and return here to choose the cover.</p>
      )}
    </section>
  )
}
