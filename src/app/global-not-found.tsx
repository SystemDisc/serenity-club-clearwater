import type { Metadata } from 'next'
import Link from 'next/link'
import { GeistSans } from 'geist/font/sans'

import { NotFoundPage } from '@/components/NotFoundPage'
import './(frontend)/globals.css'

export const metadata: Metadata = {
  title: 'Page not found | Serenity Club of Clearwater',
  description: 'This page could not be found. Return to Serenity Club or find a recovery meeting.',
}

export default function GlobalNotFound() {
  return (
    <html lang="en" className={GeistSans.variable} data-theme="light">
      <body className="bg-[#fbfaf7] font-sans">
        <header className="border-b border-slate-200 bg-white px-4 py-5 text-slate-950">
          <div className="mx-auto max-w-3xl">
            <Link className="text-lg font-semibold" href="/">
              Serenity Club of Clearwater
            </Link>
          </div>
        </header>
        <NotFoundPage />
      </body>
    </html>
  )
}
