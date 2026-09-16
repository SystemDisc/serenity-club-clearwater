import { redirect } from 'next/navigation'
import { AlbumPageContent } from '@/serenity/AlbumPage'
type Args = { params: Promise<{ slug: string; page: string }> }
export const revalidate = 300
export function generateStaticParams() {
  return []
}
export default async function AlbumPagination({ params }: Args) {
  const { slug, page } = await params
  if (page === '1') redirect(`/gallery/albums/${slug}`)
  return <AlbumPageContent slug={slug} page={/^\d+$/.test(page) ? Number(page) : NaN} />
}
export async function generateMetadata({ params }: Args) {
  const { slug, page } = await params
  return {
    title: `Album — Page ${page} | Serenity Club of Clearwater`,
    alternates: { canonical: `/gallery/albums/${slug}/page/${page}` },
  }
}
