'use client'

import type { NavItem } from '@/serenity/content'
import { ButtonLink } from '@/serenity/ui'
import { ChevronDown, HeartHandshake, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const activeLink = 'bg-emerald-50 text-emerald-950 ring-1 ring-inset ring-emerald-100'
const idleLink = 'text-slate-700 hover:bg-slate-100 hover:text-emerald-950'

function isActive(pathname: string | null, href: string) {
  if (!pathname || href.startsWith('http')) return false

  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  href,
  label,
  newTab,
  onClick,
}: NavItem & {
  onClick?: () => void
}) {
  const pathname = usePathname()
  const current = isActive(pathname, href)
  const classes = `flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition ${
    current ? activeLink : idleLink
  }`

  if (href.startsWith('http')) {
    return (
      <a
        className={classes}
        href={href}
        onClick={onClick}
        rel={newTab ? 'noreferrer' : undefined}
        target={newTab ? '_blank' : undefined}
      >
        {label}
      </a>
    )
  }

  return (
    <Link
      aria-current={current ? 'page' : undefined}
      className={classes}
      href={href}
      onClick={onClick}
    >
      {label}
    </Link>
  )
}

export function SiteNav({
  donationUrl,
  primaryNavItems,
  secondaryNavItems,
}: {
  donationUrl: string
  primaryNavItems: NavItem[]
  secondaryNavItems: NavItem[]
}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const hasSecondaryActive = secondaryNavItems.some((item) => isActive(pathname, item.href))

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
        {primaryNavItems.map((item) => (
          <NavLink key={`${item.href}-${item.label}`} {...item} />
        ))}

        <details className="group relative">
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md px-3 text-sm font-semibold transition marker:hidden [&::-webkit-details-marker]:hidden ${
              hasSecondaryActive ? activeLink : idleLink
            }`}
          >
            More
            <ChevronDown aria-hidden="true" className="size-4 transition group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 top-full mt-2 grid min-w-44 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {secondaryNavItems.map((item) => (
              <NavLink key={`${item.href}-${item.label}`} {...item} />
            ))}
          </div>
        </details>

        <ButtonLink className="ml-2 px-4" href={donationUrl} variant="primary">
          <HeartHandshake aria-hidden="true" className="size-4" />
          Donate
        </ButtonLink>
      </nav>

      <div className="flex items-center gap-2 lg:hidden">
        <ButtonLink className="size-11 px-0" href={donationUrl} variant="primary">
          <HeartHandshake aria-hidden="true" className="size-4" />
          <span className="sr-only">Donate</span>
        </ButtonLink>
        <button
          aria-controls="mobile-site-menu"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex size-11 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {isOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden"
          id="mobile-site-menu"
        >
          <nav aria-label="Mobile navigation" className="container grid gap-1">
            {[...primaryNavItems, ...secondaryNavItems].map((item) => (
              <NavLink
                key={`${item.href}-${item.label}`}
                {...item}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </nav>
        </div>
      ) : null}
    </>
  )
}
