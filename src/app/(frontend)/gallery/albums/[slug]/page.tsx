import { AlbumPageContent } from '@/serenity/AlbumPage'
import { getAlbumPage } from '@/serenity/gallery'
type Args = { params: Promise<{ slug: string }> }
export const revalidate = 300
export function generateStaticParams() {
  return []
}
export default async function AlbumPage({ params }: Args) {
  const { slug } = await params
  return <AlbumPageContent slug={slug} />
}
export async function generateMetadata({ params }: Args) {
  const { slug } = await params
  const result = await getAlbumPage(slug, 1)
  return {
    title: `${result?.album.title || 'Album'} | Serenity Club of Clearwater`,
    alternates: { canonical: `/gallery/albums/${slug}` },
  }
}
