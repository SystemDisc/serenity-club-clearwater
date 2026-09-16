'use client'

import { Link, useAuth } from '@payloadcms/ui'
import type { User } from '@/payload-types'

export default function NavLinks() {
  const { user } = useAuth<User>()
  return (
    <div className="club-nav-links">
      <Link href="/admin">Home</Link>
      <Link href="/admin/meetings">Change a meeting</Link>
      <Link href="/admin/photos">Add photos</Link>
      <Link href="/admin/organize-photos">Organize gallery photos</Link>
      <Link href="/admin/help">Help & website sections</Link>
      {user?.role === 'admin' ? <Link href="/admin/tools">Manager tools</Link> : null}
      <a href="/" target="_blank" rel="noreferrer">
        View website ↗
      </a>
    </div>
  )
}
