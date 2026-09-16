'use client'

import { Link, useAuth, useNav } from '@payloadcms/ui'
import type { User } from '@/payload-types'

export default function NavLinks() {
  const { setNavOpen } = useNav()
  const { user } = useAuth<User>()
  return (
    <div className="club-nav-links">
      <Link href="/admin" onClick={() => setNavOpen(false)}>
        Home
      </Link>
      <Link href="/admin/meetings" onClick={() => setNavOpen(false)}>
        Change a meeting
      </Link>
      <Link href="/admin/photos" onClick={() => setNavOpen(false)}>
        Add photos
      </Link>
      <Link href="/admin/organize-photos" onClick={() => setNavOpen(false)}>
        Organize gallery photos
      </Link>
      <Link href="/admin/help" onClick={() => setNavOpen(false)}>
        Help & website sections
      </Link>
      {user?.role === 'admin' ? (
        <Link href="/admin/tools" onClick={() => setNavOpen(false)}>
          Manager tools
        </Link>
      ) : null}
      <a href="/" target="_blank" rel="noreferrer">
        View website ↗
      </a>
    </div>
  )
}
