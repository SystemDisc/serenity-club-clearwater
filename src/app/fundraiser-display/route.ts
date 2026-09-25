import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-static'

export async function GET() {
  // A standalone kiosk document intentionally omits website navigation and CMS UI.
  const html = await readFile(
    path.join(process.cwd(), 'src/fundraiser-display/display.html'),
    'utf8',
  )
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://res.cloudinary.com; frame-src https://www.zeffy.com https://zeffy.com; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    },
  })
}
