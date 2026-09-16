import Image from 'next/image'
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
  const month = displayMonth(flyer.month)

  if (compact) {
    if (!image?.url) return null
    return (
      <figure className="mx-auto max-w-lg">
        <a
          className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-900"
          href={image.url}
          target="_blank"
          rel="noreferrer"
        >
          <Image
            src={image.url}
            alt={`${month} events flyer`}
            width={image.width || 1200}
            height={image.height || 1600}
            className="h-auto w-full rounded-lg"
            sizes="(min-width: 544px) 512px, calc(100vw - 32px)"
            quality={85}
            loading={priority ? 'eager' : 'lazy'}
          />
          <span className="mt-3 block text-center font-semibold text-emerald-900 underline">
            Open full-size flyer ↗
          </span>
        </a>
      </figure>
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
