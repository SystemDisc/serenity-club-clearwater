import type React from 'react'

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirects = await getCachedRedirects()()

  const redirectItem = redirects.find((redirect) => redirect.from === url)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

    const reference = redirectItem.to?.reference
    if (reference?.value) {
      const value = reference.value
      const document = typeof value === 'object'
        ? value
        : await getCachedDocument(reference.relationTo, value)()
      if (document?.slug && document._status === 'published') {
        const prefix = reference.relationTo === 'posts' ? '/posts' : ''
        redirect(document.slug === 'home' && !prefix ? '/' : `${prefix}/${document.slug}`)
      }
    }
  }

  if (disableNotFound) return null

  notFound()
}
