import { redirect } from 'next/navigation'
import { GalleryPageContent } from '@/serenity/GalleryPage'

type Args = { params: Promise<{ page: string }> }

export function generateStaticParams() {
  return []
}

export default async function GalleryPagination({ params }: Args) {
  const { page } = await params
  if (page === '1') redirect('/gallery')
  return <GalleryPageContent page={/^\d+$/.test(page) ? Number(page) : NaN} />
}

export async function generateMetadata({ params }: Args) {
  const { page } = await params
  return {
    title: `Gallery — Page ${page} | Serenity Club of Clearwater`,
    alternates: { canonical: `/gallery/page/${page}` },
  }
}
