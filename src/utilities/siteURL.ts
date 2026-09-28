const DEFAULT_SITE_URL = 'https://www.serenityclubofclearwater.org'

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '')

export const siteMetadata = {
  description:
    'Serenity Club of Clearwater hosts daily recovery meetings, fellowship, memberships, events, and support in downtown Clearwater, Florida.',
  name: 'Serenity Club of Clearwater',
  ogImageAlt: 'Serenity Club of Clearwater daily recovery meetings heading beside the illustrated clubhouse sign',
  ogImagePath: '/og-image-2026-aligned.png',
  title: 'Serenity Club of Clearwater',
}

export const getCanonicalSiteURL = () => {
  return trimTrailingSlash(process.env.SITE_URL || DEFAULT_SITE_URL)
}

export const getAbsoluteSiteURL = (pathname = '/') => {
  return new URL(pathname, `${getCanonicalSiteURL()}/`).toString()
}
