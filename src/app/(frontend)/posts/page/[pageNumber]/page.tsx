import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { notFound } from 'next/navigation'
import { hasUsableDatabaseUrl } from '@/serenity/data'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise
  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const posts = await queryPosts(sanitizedPageNumber)

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Posts</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    robots: {
      follow: false,
      index: false,
    },
    title: `Posts Page ${pageNumber || ''} | Serenity Club of Clearwater`,
  }
}

export async function generateStaticParams() {
  if (!hasUsableDatabaseUrl()) return []

  try {
    const payload = await getPayload({ config: configPromise })
    const { totalDocs } = await payload.count({
      collection: 'posts',
      overrideAccess: false,
    })

    const totalPages = Math.ceil(totalDocs / 10)

    const pages: { pageNumber: string }[] = []

    for (let i = 1; i <= totalPages; i++) {
      pages.push({ pageNumber: String(i) })
    }

    return pages
  } catch (_error) {
    return []
  }
}

async function queryPosts(page: number) {
  if (!hasUsableDatabaseUrl()) {
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      limit: 12,
      nextPage: null,
      page,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 0,
    }
  }

  try {
    const payload = await getPayload({ config: configPromise })

    return await payload.find({
      collection: 'posts',
      depth: 1,
      limit: 12,
      page,
      overrideAccess: false,
    })
  } catch (_error) {
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      limit: 12,
      nextPage: null,
      page,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 0,
    }
  }
}
