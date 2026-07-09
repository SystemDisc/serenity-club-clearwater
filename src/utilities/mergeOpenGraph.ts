import type { Metadata } from 'next'
import { getAbsoluteSiteURL, siteMetadata } from './siteURL'

const getDefaultOpenGraph = (): NonNullable<Metadata['openGraph']> => {
  return {
    type: 'website',
    description: siteMetadata.description,
    images: [
      {
        url: getAbsoluteSiteURL(siteMetadata.ogImagePath),
        width: 1200,
        height: 630,
        alt: siteMetadata.ogImageAlt,
      },
    ],
    locale: 'en_US',
    siteName: siteMetadata.name,
    title: siteMetadata.title,
    url: getAbsoluteSiteURL('/'),
  }
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  const defaultOpenGraph = getDefaultOpenGraph()

  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
