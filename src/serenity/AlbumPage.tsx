import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAlbumPage } from './gallery'
import { GalleryGrid, PageHeader } from './ui'
import { displayDate } from './calendar'

export async function AlbumPageContent({ slug, page = 1 }: { slug: string; page?: number }) {
  if (!Number.isSafeInteger(page) || page < 1) notFound()
  const result = await getAlbumPage(slug, page)
  if (!result || page > result.totalPages) notFound()
  const href = (number: number) =>
    number === 1 ? `/gallery/albums/${slug}` : `/gallery/albums/${slug}/page/${number}`
  return (
    <main>
      <PageHeader eyebrow="Gallery album" title={result.album.title}>
        <p>{result.album.description}</p>
        {result.album.date ? <p>{displayDate(result.album.date)}</p> : null}
      </PageHeader>
      <section className="bg-white px-4 py-10 text-slate-950">
        <div className="container">
          <Link href="/gallery" className="mb-8 inline-block underline">
            ← All photos and albums
          </Link>
          <GalleryGrid items={result.items} />
          {result.totalPages > 1 ? (
            <nav
              aria-label="Album pages"
              className="mt-8 flex flex-wrap items-center justify-center gap-6"
            >
              {page > 1 ? (
                <Link href={href(page - 1)} rel="prev">
                  Previous photos
                </Link>
              ) : null}
              <span>
                Page {page} of {result.totalPages} · {result.totalDocs} photos
              </span>
              {page < result.totalPages ? (
                <Link href={href(page + 1)} rel="next">
                  More photos
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  )
}
