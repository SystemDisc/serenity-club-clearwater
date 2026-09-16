import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { queuePublicChange } from '@/utilities/publicCache'

const getStatus = (doc: unknown) => {
  if (!doc || typeof doc !== 'object' || !('_status' in doc)) return undefined

  return (doc as { _status?: unknown })._status
}

const affectsPublishedContent = (doc: unknown, previousDoc: unknown) => {
  const status = getStatus(doc)
  const previousStatus = getStatus(previousDoc)

  return status === undefined || status === 'published' || previousStatus === 'published'
}

export const revalidatePublicSiteAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
  req: { context },
}) => {
  if (!context.disableRevalidate && affectsPublishedContent(doc, previousDoc)) {
    queuePublicChange({
      collection: collection.slug,
      id: doc.id,
      slug: doc.slug,
      previousSlug: previousDoc?.slug,
    })
  }

  return doc
}

export const revalidatePublicSiteAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  collection,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    queuePublicChange({ collection: collection.slug, id: doc.id, slug: doc.slug })
  }

  return doc
}

export const revalidatePublicSiteAfterGlobalChange: GlobalAfterChangeHook = ({
  doc,
  global,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    queuePublicChange({ collection: global.slug })
  }

  return doc
}
