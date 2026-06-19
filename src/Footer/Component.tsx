import { getSerenitySettings } from '@/serenity/data'
import { primaryNavItems, secondaryNavItems } from '@/serenity/ui'
import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export async function Footer() {
  const settings = await getSerenitySettings()
  const navItems = [...primaryNavItems, ...secondaryNavItems]

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 px-4 text-white">
      <div className="container grid gap-10 py-10 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="flex size-11 items-center justify-center rounded-md bg-amber-300 text-lg font-semibold text-slate-950">
              SC
            </span>
            <span className="text-lg font-semibold">{settings.name}</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">{settings.summary}</p>
        </div>

        <nav className="grid gap-2 text-sm" aria-label="Footer navigation">
          <p className="mb-2 font-semibold uppercase tracking-[0.14em] text-amber-200">Site</p>
          {navItems.map((item) => (
            <Link className="text-slate-300 hover:text-white" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="grid gap-3 text-sm text-slate-300">
          <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-amber-200">Contact</p>
          <a className="flex items-start gap-3 hover:text-white" href={`tel:${settings.phone}`}>
            <Phone aria-hidden="true" className="mt-0.5 size-4 text-amber-200" />
            {settings.phone}
          </a>
          <a className="flex items-start gap-3 hover:text-white" href={`mailto:${settings.email}`}>
            <Mail aria-hidden="true" className="mt-0.5 size-4 text-amber-200" />
            {settings.email}
          </a>
          <a
            className="flex items-start gap-3 hover:text-white"
            href="https://maps.google.com/?q=631%20Turner%20Street%20Clearwater%20FL%2033756"
            rel="noreferrer"
            target="_blank"
          >
            <MapPin aria-hidden="true" className="mt-0.5 size-4 text-amber-200" />
            <span>
              {settings.address}
              <br />
              {settings.cityStateZip}
            </span>
          </a>
          <p>{settings.hours}</p>
        </div>
      </div>
      <div className="container border-t border-slate-800 py-5 text-xs text-slate-400">
        <p>
          Copyright {new Date().getFullYear()} {settings.legalName}
        </p>
      </div>
    </footer>
  )
}
