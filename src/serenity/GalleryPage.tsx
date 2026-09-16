import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGalleryPage } from './gallery'
import { GalleryGrid, PageHeader, SectionHeader, SerenityImage } from './ui'

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
          <SectionHeader eyebrow="Serenity Club media" title="A look inside the clubhouse">
            <p>Get to know our space and see moments from club events.</p>
          </SectionHeader>
          {result.albums.length ? (
            <>
              <h2 className="mb-5 text-2xl font-semibold">Albums</h2>
              <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.albums.map((album) => {
                  const cover = typeof album.cover === 'object' ? album.cover : null
                  return (
                    <article
                      key={album.id}
                      className="overflow-hidden rounded-lg border border-slate-200"
                    >
                      <Link href={`/gallery/albums/${album.slug}`}>
                        {cover?.url ? (
                          <SerenityImage
                            src={cover.sizes?.medium?.url || cover.url}
                            alt=""
                            className="aspect-[4/3] w-full object-cover"
                          />
                        ) : null}
                        <h3 className="p-5 text-xl font-semibold">{album.title}</h3>
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
