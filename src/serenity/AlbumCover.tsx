import Image from 'next/image'
import type { AlbumCoverImage } from './albumCover'

/** Shared crop/layout for the public card and the editor's cover preview. */
export function AlbumCover({ images }: { images: AlbumCoverImage[] }) {
  const photos = images.slice(0, 4)
  return (
    <div
      data-album-cover={photos.length}
      style={{
        aspectRatio: '4 / 3',
        display: 'grid',
        overflow: 'hidden',
        background: '#e2e8f0',
        gridTemplateColumns: photos.length > 1 ? '1fr 1fr' : '1fr',
        gridTemplateRows: photos.length > 2 ? '1fr 1fr' : '1fr',
        gap: 3,
      }}
    >
      {photos.length ? (
        photos.map((photo, index) => (
          <div
            key={photo.id}
            style={{
              position: 'relative',
              minWidth: 0,
              minHeight: 0,
              gridRow: photos.length === 3 && index === 0 ? 'span 2' : undefined,
            }}
          >
            <Image
              src={photo.src}
              alt=""
              fill
              sizes={
                photos.length > 1
                  ? '(min-width: 1024px) 17vw, (min-width: 640px) 25vw, 50vw'
                  : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
              }
              quality={85}
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))
      ) : (
        <span style={{ alignSelf: 'center', textAlign: 'center', color: '#334155' }}>
          No published photos yet
        </span>
      )}
    </div>
  )
}
