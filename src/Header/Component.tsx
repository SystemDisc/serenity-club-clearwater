import { getSerenitySettings } from '@/serenity/data'
import Link from 'next/link'
import React from 'react'

import { SiteNav } from './SiteNav.client'

export async function Header() {
  const settings = await getSerenitySettings()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 backdrop-blur">
      <div className="container flex min-h-16 items-center justify-between gap-2 py-2 lg:min-h-20 lg:gap-3">
        <Link className="flex min-h-11 min-w-0 flex-1 items-center gap-2 sm:gap-3" href="/">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-900 text-base font-semibold text-white lg:size-11 lg:text-lg">
            SC
          </span>
          <span className="grid min-w-0">
            <span className="truncate text-[0.8125rem] font-semibold leading-5 sm:text-base">
              {settings.name}
            </span>
            <span className="truncate text-[0.62rem] uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
              Clearwater, Florida
            </span>
          </span>
        </Link>

        <SiteNav donationUrl={settings.donationUrl} />
      </div>
    </header>
  )
}
