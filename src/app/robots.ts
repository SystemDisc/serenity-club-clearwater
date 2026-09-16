import type { MetadataRoute } from 'next'

import { getCanonicalSiteURL } from '@/utilities/siteURL'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteURL()

  return {
    rules: {
      userAgent: '*',
      disallow: ['/admin/*', '/api/*', '/next/*', '/search'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
