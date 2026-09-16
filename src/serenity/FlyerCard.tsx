import { ArrowRight } from 'lucide-react'
import type { MonthlyFlyer } from '@/payload-types'
import { displayMonth } from './flyers'
import { ButtonLink, SerenityImage } from './ui'

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
  const month = displayMonth(flyer.month)

  if (compact) {
    return (
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {image?.url ? (
          <a
            aria-label={`Open full-size ${month} events flyer`}
            className="block bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-900"
            href={image.url}
            target="_blank"
            rel="noreferrer"
          >
            <SerenityImage
              src={image.url}
              alt={`${month} events flyer`}
              priority={priority}
              className="aspect-[4/3] w-full object-contain"
              sizes="(min-width: 768px) 33vw, 100vw"
            />
          </a>
        ) : null}
        <div className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-900">
            Monthly flyer
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{month} at the club</h3>
          <ButtonLink className="mt-5" href="/events" variant="secondary">
            Read this month’s events
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
          {image?.url ? (
            <a
              className="mt-3 block w-fit py-2 text-sm font-semibold text-emerald-900 underline"
              href={image.url}
              target="_blank"
              rel="noreferrer"
            >
              Open full-size flyer ↗
            </a>
          ) : null}
        </div>
      </article>
    )
  }
  return (
    <article className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">{month} at the club</h2>
        <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{flyer.details}</p>
        <a
          className="mt-5 inline-block font-semibold text-emerald-900 underline"
          href={image?.url || '/events'}
          target="_blank"
          rel="noreferrer"
        >
          Open full-size flyer ↗
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
