import { documentPath } from './pagePaths'
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

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  collection?: 'pages' | 'posts'
}): Promise<Metadata> => {
  const { doc, collection = 'pages' } = args
  const canonical = documentPath(doc?.slug, collection)

  const ogImage = getImageURL(doc?.meta?.image)
  const title = getDocTitle(doc)
  const description = doc?.meta?.description || siteMetadata.description

  const titleWithSiteName = title === siteMetadata.title ? title : `${title} | ${siteMetadata.name}`

  return {
    description,
    alternates: { canonical },
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
      url: getAbsoluteSiteURL(canonical),
    }),
    title: titleWithSiteName,
  }
}
