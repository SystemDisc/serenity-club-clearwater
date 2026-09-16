import type { MonthlyFlyer } from '@/payload-types'
import { displayMonth } from './flyers'
import { SerenityImage } from './ui'

export function FlyerCard({
  flyer,
  compact = false,
  priority = false,
}: {
  flyer: MonthlyFlyer
  compact?: boolean
  priority?: boolean
}) {
  const image = typeof flyer.image === 'object' ? flyer.image : null
  return (
    <article className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">
          {displayMonth(flyer.month)} at the club
        </h2>
        <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">
          {compact
            ? 'See this month’s activities and announcements on the full flyer.'
            : flyer.details}
        </p>
        <a
          className="mt-5 inline-block font-semibold text-emerald-900 underline"
          href={compact ? '/events' : image?.url || '/events'}
          target={compact ? undefined : '_blank'}
          rel="noreferrer"
        >
          {compact ? 'Read this month’s events' : 'Open full-size flyer ↗'}
        </a>
      </div>
      {image?.url ? (
        <a href={image.url} target="_blank" rel="noreferrer">
          <SerenityImage
            priority={priority}
            src={image.url}
            alt={`${displayMonth(flyer.month)} events flyer. Event details are provided as text alongside the image.`}
            className="max-h-[650px] w-full object-contain"
            sizes="(min-width: 768px) 45vw, 100vw"
          />
        </a>
      ) : null}
    </article>
  )
}
