import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

const invalidateRedirects = ({
  context,
  payload,
}: {
  context: Record<string, unknown>
  payload: { logger: { info: (message: string) => void } }
}) => {
  if (context.disableRevalidate) return

  payload.logger.info('Revalidating redirects')

  revalidateTag('redirects', 'max')
}

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req }) => {
  invalidateRedirects(req)

  return doc
}

export const revalidateRedirectsAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  invalidateRedirects(req)

  return doc
}
