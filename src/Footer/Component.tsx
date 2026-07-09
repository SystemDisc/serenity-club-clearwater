import type { NavItem } from '@/serenity/content'
import { SerenityMark } from '@/components/SerenityMark'
import { getSerenitySettings, getSiteNavigation } from '@/serenity/data'
import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function FooterNavLink({ item }: { item: NavItem }) {
  const className = 'flex min-h-11 items-center text-slate-300 hover:text-white'

  if (item.href.startsWith('http')) {
    return (
      <a
        className={className}
        href={item.href}
        rel={item.newTab ? 'noreferrer' : undefined}
        target={item.newTab ? '_blank' : undefined}
      >
        {item.label}
      </a>
    )
  }

  return (
    <Link className={className} href={item.href}>
      {item.label}
    </Link>
  )
}

export async function Footer() {
  const [settings, navigation] = await Promise.all([getSerenitySettings(), getSiteNavigation()])

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 px-4 text-white">
      <div className="container grid gap-6 py-7 md:grid-cols-2 md:py-8 lg:grid-cols-[1.1fr_1fr_1.1fr] lg:gap-8 lg:py-10">
        <div>
          <Link className="inline-flex items-center gap-3" href="/">
            <SerenityMark className="size-11 ring-1 ring-white/20" />
            <span className="text-lg font-semibold">{settings.name}</span>
          </Link>
          <p className="mt-4 hidden max-w-md text-sm leading-6 text-slate-300 sm:block">
            {settings.summary}
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <p className="mb-3 font-semibold uppercase tracking-[0.14em] text-amber-200">Site</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm lg:grid-cols-2 lg:gap-x-6">
            {navigation.footerNavItems.map((item) => (
              <FooterNavLink item={item} key={`${item.href}-${item.label}`} />
            ))}
          </div>
        </nav>

        <div className="grid gap-3 text-sm text-slate-300">
          <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-amber-200">Contact</p>
          <a
            className="flex min-h-11 items-center gap-3 hover:text-white"
            href={`tel:${settings.phone}`}
          >
            <Phone aria-hidden="true" className="size-4 text-amber-200" />
            {settings.phone}
          </a>
          <a
            className="flex min-h-11 items-center gap-3 hover:text-white"
            href={`mailto:${settings.email}`}
          >
            <Mail aria-hidden="true" className="size-4 text-amber-200" />
            {settings.email}
          </a>
          <a
            className="flex min-h-11 items-center gap-3 hover:text-white"
            href="https://maps.google.com/?q=631%20Turner%20Street%20Clearwater%20FL%2033756"
            rel="noreferrer"
            target="_blank"
          >
            <MapPin aria-hidden="true" className="size-4 text-amber-200" />
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
