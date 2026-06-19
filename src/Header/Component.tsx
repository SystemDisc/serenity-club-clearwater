import { getSerenitySettings } from '@/serenity/data'
import { ButtonLink, primaryNavItems, secondaryNavItems } from '@/serenity/ui'
import { HeartHandshake } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export async function Header() {
  const settings = await getSerenitySettings()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 text-slate-950 backdrop-blur">
      <div className="container flex min-h-20 flex-col justify-center gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-11 items-center justify-center rounded-md bg-emerald-900 text-lg font-semibold text-white">
            SC
          </span>
          <span className="grid">
            <span className="text-base font-semibold leading-5">{settings.name}</span>
            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
              Clearwater, Florida
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium"
        >
          {primaryNavItems.map((item) => (
            <Link className="text-slate-700 hover:text-emerald-900" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          {secondaryNavItems.map((item) => (
            <Link className="text-slate-500 hover:text-emerald-900" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <ButtonLink className="lg:ml-2" href={settings.donationUrl} variant="primary">
            <HeartHandshake aria-hidden="true" />
            Donate
          </ButtonLink>
        </nav>
      </div>
    </header>
  )
}
