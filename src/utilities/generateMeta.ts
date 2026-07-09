import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getAbsoluteSiteURL, siteMetadata } from './siteURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  let url = getAbsoluteSiteURL(siteMetadata.ogImagePath)

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = getAbsoluteSiteURL(ogUrl || image.url || siteMetadata.ogImagePath)
  }

  return url
}

const getDocTitle = (doc: Partial<Page> | Partial<Post> | null) => {
  return doc?.meta?.title || doc?.title || siteMetadata.title
}

const getDocPath = (doc: Partial<Page> | Partial<Post> | null) => {
  const slug = Array.isArray(doc?.slug) ? doc?.slug.join('/') : doc?.slug

  if (!slug || slug === 'home') return '/'

  return `/${slug}`
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)
  const title = getDocTitle(doc)
  const description = doc?.meta?.description || siteMetadata.description

  const titleWithSiteName = title === siteMetadata.title ? title : `${title} | ${siteMetadata.name}`

  return {
    description,
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: siteMetadata.ogImageAlt,
            },
          ]
        : undefined,
      title: titleWithSiteName,
      url: getAbsoluteSiteURL(getDocPath(doc)),
    }),
    title: titleWithSiteName,
  }
}
