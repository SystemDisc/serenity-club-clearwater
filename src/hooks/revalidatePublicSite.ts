import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { revalidatePath } from 'next/cache'

const getStatus = (doc: unknown) => {
  if (!doc || typeof doc !== 'object' || !('_status' in doc)) return undefined

  return (doc as { _status?: unknown })._status
}

const affectsPublishedContent = (doc: unknown, previousDoc: unknown) => {
  const status = getStatus(doc)
  const previousStatus = getStatus(previousDoc)

  return status === undefined || status === 'published' || previousStatus === 'published'
}

const revalidatePublicSite = (payload: { logger: { info: (message: string) => void } }) => {
  payload.logger.info('Revalidating public site')
  revalidatePath('/', 'layout')
}

export const revalidatePublicSiteAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate && affectsPublishedContent(doc, previousDoc)) {
    revalidatePublicSite(payload)
  }

  return doc
}

export const revalidatePublicSiteAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    revalidatePublicSite(payload)
  }

  return doc
}

export const revalidatePublicSiteAfterGlobalChange: GlobalAfterChangeHook = ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    revalidatePublicSite(payload)
  }

  return doc
}
