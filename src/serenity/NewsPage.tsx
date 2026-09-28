import Image from 'next/image'
import communityArt from './artwork/community.webp'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNewsPage } from './news'
import { ButtonLink, PageHeader, SerenityImage } from './ui'
import { displayDate, localDateKey } from './calendar'
export async function NewsPageContent({ page = 1 }: { page?: number }) {
  if (!Number.isSafeInteger(page) || page < 1) notFound()
  const result = await getNewsPage(page)
  if (page > Math.max(1, result.totalPages)) notFound()
  const href = (value: number) => (value === 1 ? '/posts' : `/posts/page/${value}`)
  return (
    <main>
      <PageHeader eyebrow="From the clubhouse" title="News & updates">
        <p>Club news, stories, and information for our community.</p>
      </PageHeader>
      <section className="bg-white px-4 py-10 text-slate-950">
        <div className="container">
          {result.docs.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.docs.map((post) => {
                const cover = typeof post.heroImage === 'object' ? post.heroImage : null
                return (
                  <article key={post.id} className="club-news-card">
                    <Link href={`/posts/${post.slug}`} className="block">
                      {cover?.url ? (
                        <SerenityImage
                          src={cover.sizes?.medium?.url || cover.url}
                          alt=""
                          className="aspect-[3/2] w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={communityArt}
                          alt="Illustrated clubhouse noticeboard and coffee cups"
                          className="aspect-[3/2] w-full object-cover"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      )}
                      <div className="py-5">
                        <h2 className="text-xl font-semibold text-slate-950">{post.title}</h2>
                        {post.publishedAt ? (
                          <p className="mt-2 text-sm text-slate-600">
                            <time dateTime={post.publishedAt}>
                              {displayDate(localDateKey(new Date(post.publishedAt)))}
                            </time>
                          </p>
                        ) : null}
                        {post.excerpt || post.meta?.description ? (
                          <p className="mt-3 leading-7 text-slate-700">
                            {post.excerpt || post.meta?.description}
                          </p>
                        ) : null}
                        <p className="mt-4 font-semibold text-emerald-900">Read update →</p>
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="club-split py-8">
              <Image
                src={communityArt}
                alt="Illustration of coffee, books, and a clubhouse noticeboard"
                className="club-wide-photo"
                sizes="(min-width: 760px) 45vw, 100vw"
              />
              <div>
                <p className="club-eyebrow">From our community</p>
                <h2>There’s always something happening.</h2>
                <p>
                  News and stories from the Club will appear here as they’re published. In the
                  meantime, see what’s coming up on the events calendar.
                </p>
                <div className="club-actions">
                  <ButtonLink href="/events">Explore Club events →</ButtonLink>
                </div>
              </div>
            </div>
          )}
          {result.totalPages > 1 ? (
            <nav
              aria-label="News pages"
              className="mt-8 flex flex-wrap items-center justify-center gap-6"
            >
              {page > 1 ? (
                <Link
                  className="inline-flex min-h-11 items-center underline"
                  href={href(page - 1)}
                  rel="prev"
                >
                  Newer updates
                </Link>
              ) : null}
              <span>
                Page {page} of {result.totalPages}
              </span>
              {page < result.totalPages ? (
                <Link
                  className="inline-flex min-h-11 items-center underline"
                  href={href(page + 1)}
                  rel="next"
                >
                  Older updates
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  )
}
