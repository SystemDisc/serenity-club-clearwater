import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNewsPage } from './news'
import { PageHeader, SerenityImage } from './ui'
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
      <section className="bg-white px-4 py-10">
        <div className="container">
          {result.docs.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.docs.map((post) => {
                const cover = typeof post.heroImage === 'object' ? post.heroImage : null
                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <Link href={`/posts/${post.slug}`} className="block">
                      {cover?.url ? (
                        <SerenityImage
                          src={cover.sizes?.medium?.url || cover.url}
                          alt=""
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : null}
                      <div className="p-5">
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
            <p>
              No club updates have been published yet. Check the{' '}
              <Link href="/events" className="underline">
                Events page
              </Link>{' '}
              for current activities.
            </p>
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
