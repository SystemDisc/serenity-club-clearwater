import { NewsPageContent } from '@/serenity/NewsPage'
import { permanentRedirect } from 'next/navigation'
type Args = { params: Promise<{ pageNumber: string }> }
export default async function NewsPage({ params }: Args) {
  const { pageNumber } = await params
  if (pageNumber === '1') permanentRedirect('/posts')
  return <NewsPageContent page={Number(pageNumber)} />
}
export async function generateMetadata({ params }: Args) {
  const { pageNumber } = await params
  return {
    title: `News & updates — page ${pageNumber} | Serenity Club of Clearwater`,
    alternates: { canonical: `/posts/page/${pageNumber}` },
  }
}
export async function generateStaticParams() {
  return []
}
