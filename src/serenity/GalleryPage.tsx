import Link from 'next/link'
import { AlbumCover } from './AlbumCover'
import { notFound } from 'next/navigation'
import { getGalleryPage } from './gallery'
import { GalleryGrid, PageHeader } from './ui'

export async function GalleryPageContent({ page = 1 }: { page?: number }) {
  if (!Number.isSafeInteger(page) || page < 1) notFound()
  const result = await getGalleryPage(page)
  if (page > result.totalPages) notFound()
  const href = (number: number) => (number === 1 ? '/gallery' : `/gallery/page/${number}`)
  return (
    <main>
      <PageHeader eyebrow="Gallery" title="Photos and flyers from Serenity Club">
        <p>Clubhouse images, monthly flyers, and community moments.</p>
      </PageHeader>
      <section className="bg-white px-4 py-10 text-slate-950 md:py-12">
        <div className="container">
          {result.albums.length ? (
            <>
              <h2 className="mb-5 text-2xl font-semibold">Albums</h2>
              <div className="mb-14 grid gap-8 md:grid-cols-2">
                {result.albums.map((album) => {
                  return (
                    <article key={album.id} className="club-news-card">
                      <Link href={`/gallery/albums/${album.slug}`}>
                        <AlbumCover images={album.preview.images} />
                        <div className="py-5">
                          <h3 className="text-xl font-semibold">{album.title}</h3>
                          <p className="mt-2 text-slate-600">
                            {album.preview.totalPhotos}{' '}
                            {album.preview.totalPhotos === 1 ? 'photo' : 'photos'} · View album
                          </p>
                        </div>
                      </Link>
                    </article>
                  )
                })}
              </div>
            </>
          ) : null}
          {result.items.length ? (
            <>
              <h2 className="mb-5 text-2xl font-semibold">Photos from the club</h2>
              <GalleryGrid items={result.items} />
            </>
          ) : !result.albums.length ? (
            <p>No photos have been published yet.</p>
          ) : null}
          {result.totalPages > 1 && (
            <nav
              aria-label="Gallery pages"
              className="mt-8 flex flex-wrap items-center justify-center gap-6"
            >
              {page > 1 && (
                <Link href={href(page - 1)} rel="prev">
                  Previous
                </Link>
              )}
              <span>
                Page {page} of {result.totalPages} · {result.totalDocs} photos and albums
              </span>
              {page < result.totalPages && (
                <Link href={href(page + 1)} rel="next">
                  Next
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>
    </main>
  )
}
