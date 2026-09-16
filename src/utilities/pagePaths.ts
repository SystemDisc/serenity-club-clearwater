export const reservedPageSlugs = new Set([
  'home', 'about', 'events', 'gallery', 'groups', 'meeting-schedule', 'policies',
  'reach-out', 'shop', 'ways-to-give', 'admin', 'api', 'next', 'portfolio', 'posts',
  'resend', 'search', 'robots.txt', 'sitemap.xml',
])

export function validatePageSlug(value: unknown): true | string {
  if (typeof value !== 'string' || !value || !/^[a-z0-9][a-z0-9-]*$/.test(value)) return 'Use a URL slug with lowercase letters, numbers, and hyphens.'
  return reservedPageSlugs.has(value) ? 'This URL belongs to a built-in site page. Choose a different slug.' : true
}

export function documentPath(slug: string | null | undefined, collection: 'pages' | 'posts' = 'pages'): string {
  if (!slug || (collection === 'pages' && slug === 'home')) return '/'
  return collection === 'posts' ? `/posts/${slug}` : `/${slug}`
}
