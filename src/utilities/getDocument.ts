import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Collection = 'pages' | 'posts'

async function getDocument(collection: Collection, id: number | string, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection,
    depth,
    overrideAccess: false,
    draft: false,
    limit: 1,
    where: {
      id: { equals: id },
      _status: { equals: 'published' },
    },
  })

  return page.docs[0]
}

/**
 * Resolve redirect relationships by their ID while respecting published access.
 */
export const getCachedDocument = (collection: Collection, id: number | string) =>
  unstable_cache(async () => getDocument(collection, id), [collection, String(id)], {
    revalidate: 300,
    tags: [`public-${collection}`, 'public-media'],
  })
