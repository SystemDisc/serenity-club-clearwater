import { AsyncLocalStorage } from 'node:async_hooks'
import { revalidatePath, revalidateTag } from 'next/cache'

export const publicCollections = [
  'meetings',
  'events',
  'galleryItems',
  'teamMembers',
  'products',
  'policies',
  'sponsors',
  'pages',
  'posts',
  'media',
  'categories',
  'forms',
  'users',
  'redirects',
] as const
type Change = {
  collection: string
  operation?: string
  status?: string
  previousStatus?: string
  id?: number | string
  slug?: string | null
  previousSlug?: string | null
}
type Pending = { changes: Change[] }
// Next can bundle this module separately for admin and API routes while Payload
// reuses its initialized config/hooks across them. Share the scope per process.
const scopeKey = Symbol.for('serenity.publicMutationScope')
const scopes = globalThis as unknown as Record<symbol, AsyncLocalStorage<Pending>>
const pending = (scopes[scopeKey] ??= new AsyncLocalStorage<Pending>())

const routes: Record<string, string[]> = {
  meetings: ['/', '/meeting-schedule', '/groups'],
  events: ['/', '/events'],
  galleryItems: ['/gallery', '/gallery/page/[page]'],
  teamMembers: ['/about'],
  products: ['/', '/shop', '/shop/[slug]', '/sitemap.xml'],
  policies: ['/policies'],
  sponsors: ['/'],
}

export function queuePublicChange(change: Change): void {
  const scope = pending.getStore()
  if (scope) scope.changes.push(change)
  else
    console.warn(
      JSON.stringify({
        event: 'public-revalidation-unscoped',
        collection: change.collection,
        id: change.id,
        recovery: 'finite-cache-ttl',
      }),
    )
}

export function invalidatePublicChanges(changes: Change[]): void {
  if (!changes.length) return
  const paths = new Set<string>()
  const tags = new Set<string>()
  let layout = false
  for (const change of changes) {
    tags.add(`public-${change.collection}`)
    if (routes[change.collection]) routes[change.collection].forEach((path) => paths.add(path))
    else layout = true // Shared media, navigation, forms, and authored-page relationships.
    if (['pages', 'products'].includes(change.collection)) {
      tags.add(`${change.collection}-sitemap`)
      paths.add('/sitemap.xml')
    }
    if (['pages', 'posts', 'redirects'].includes(change.collection)) tags.add('redirects')
    for (const slug of [change.previousSlug, change.slug]) {
      if (!slug) continue
      if (change.collection === 'pages') paths.add(slug === 'home' ? '/' : `/${slug}`)
      if (change.collection === 'posts') paths.add(`/posts/${slug}`)
      if (change.collection === 'products') paths.add(`/shop/${slug}`)
    }
  }
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  if (layout) revalidatePath('/', 'layout')
  else for (const path of paths) revalidatePath(path, 'page')
  console.info(
    JSON.stringify({
      event: 'public-revalidation-complete',
      changes,
      paths: layout ? ['root layout'] : [...paths],
      tags: [...tags],
    }),
  )
}

/** Await the full Payload operation (including commit) before invalidating caches.
 * REST, GraphQL, admin server functions, and maintenance handlers all use this scope.
 * Nested uploads and bulk mutations coalesce into one invalidation per request.
 */
export async function withPublicMutation<T>(operation: () => Promise<T>): Promise<T> {
  if (pending.getStore()) return operation()
  const scope: Pending = { changes: [] }
  return pending.run(scope, async () => {
    try {
      return await operation()
    } finally {
      try {
        invalidatePublicChanges(scope.changes)
      } catch (error) {
        // The database may already be committed. Preserve the save result and
        // emit an actionable error; the five-minute TTL is the recovery path.
        console.error(
          JSON.stringify({
            event: 'public-revalidation-failed',
            collections: [...new Set(scope.changes.map((change) => change.collection))],
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        )
      }
    }
  })
}

export function withPublicRevalidation<Args extends unknown[], Result>(
  handler: (...args: Args) => Promise<Result>,
) {
  return (...args: Args): Promise<Result> => withPublicMutation(() => handler(...args))
}
