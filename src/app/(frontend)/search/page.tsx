import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { CardPostData } from '@/components/Card'
import { hasUsableDatabaseUrl } from '@/serenity/data'

type Args = {
  searchParams: Promise<{
    q: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const posts = await querySearchPosts(query)

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as CardPostData[]} />
      ) : (
        <div className="container">No results found.</div>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    robots: {
      follow: false,
      index: false,
    },
    title: `Search | Serenity Club of Clearwater`,
  }
}

async function querySearchPosts(query: string) {
  if (!hasUsableDatabaseUrl()) {
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      limit: 12,
      nextPage: null,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 0,
    }
  }

  try {
    const payload = await getPayload({ config: configPromise })

    return await payload.find({
      collection: 'search',
      depth: 1,
      limit: 12,
      select: {
        title: true,
        slug: true,
        categories: true,
        meta: true,
      },
      pagination: false,
      ...(query
        ? {
            where: {
              or: [
                {
                  title: {
                    like: query,
                  },
                },
                {
                  'meta.description': {
                    like: query,
                  },
                },
                {
                  'meta.title': {
                    like: query,
                  },
                },
                {
                  slug: {
                    like: query,
                  },
                },
              ],
            },
          }
        : {}),
    })
  } catch (_error) {
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      limit: 12,
      nextPage: null,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 0,
    }
  }
}
