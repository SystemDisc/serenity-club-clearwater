import type { Post } from '@/payload-types'
import { PageHeader, SerenityImage } from '@/serenity/ui'
import { displayDate, localDateKey } from '@/serenity/calendar'
import { formatAuthors } from '@/utilities/formatAuthors'
export function PostHero({ post }: { post: Post }) {
  const image = typeof post.heroImage === 'object' ? post.heroImage : null
  const byline = post.byline || formatAuthors(post.populatedAuthors || [])
  return (
    <>
      <PageHeader eyebrow="News & updates" title={post.title}>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        {post.publishedAt ? (
          <p>
            <time dateTime={post.publishedAt}>
              {displayDate(localDateKey(new Date(post.publishedAt)))}
            </time>
            {byline ? ` · ${byline}` : ''}
          </p>
        ) : byline ? (
          <p>{byline}</p>
        ) : null}
      </PageHeader>
      {image?.url ? (
        <div className="container mt-8 max-w-4xl">
          <SerenityImage
            src={image.url}
            alt={image.alt || post.title}
            priority
            sizes="(min-width: 900px) 900px, 100vw"
            className="max-h-[65vh] w-full rounded-lg object-contain"
          />
        </div>
      ) : null}
    </>
  )
}
