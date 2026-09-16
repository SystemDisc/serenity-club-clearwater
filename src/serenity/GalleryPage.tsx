import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGalleryPage } from './gallery'
import { GalleryGrid, PageHeader, SectionHeader } from './ui'

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
      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container">
          <SectionHeader eyebrow="Serenity Club media" title="A look inside the clubhouse">
            <p>Get to know our space and see moments from club events.</p>
          </SectionHeader>
          {result.items.length ? (
            <GalleryGrid items={result.items} />
          ) : (
            <p>No photos have been published yet.</p>
          )}
          {result.totalPages > 1 && (
            <nav aria-label="Gallery pages" className="mt-8 flex items-center justify-center gap-6">
              {page > 1 && (
                <Link href={href(page - 1)} rel="prev">
                  Previous
                </Link>
              )}
              <span>
                Page {page} of {result.totalPages} · {result.totalDocs} photos
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
