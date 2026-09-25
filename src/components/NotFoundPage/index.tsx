import Link from 'next/link'

export function NotFoundPage() {
  return (
    <main className="min-h-[60vh] bg-[#fbfaf7] px-4 py-20 text-slate-950 md:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-900">
          404 · Page not found
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          We couldn’t find that page.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
          The link may be out of date, or the address may have a typo. You can return to the
          homepage or find a meeting at Serenity Club.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-900"
            href="/"
          >
            Go to homepage
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-900"
            href="/meeting-schedule"
          >
            Find a meeting
          </Link>
        </div>
      </div>
    </main>
  )
}
