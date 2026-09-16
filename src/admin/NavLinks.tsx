'use client'

import { Link, useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import type { User } from '@/payload-types'

const taskLinks = [
  { href: '/admin', label: 'Home' },
  { href: '/admin/meetings', label: 'Change a meeting' },
  { href: '/admin/photos', label: 'Add photos' },
  { href: '/admin/organize-photos', label: 'Organize gallery photos' },
  { href: '/admin/help', label: 'Help & website sections' },
  { href: '/admin/tools', label: 'Manager tools', managerOnly: true },
]

export default function NavLinks() {
  const { user } = useAuth<User>()
  const pathname = usePathname()
  return (
    <div className="club-nav-links">
      {taskLinks
        .filter((link) => !link.managerOnly || user?.role === 'admin')
        .map((link) => (
          <Link
            href={link.href}
            key={link.href}
            aria-current={pathname === link.href ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
      <a href="/" target="_blank" rel="noreferrer">
        View website ↗
      </a>
    </div>
  )
}
