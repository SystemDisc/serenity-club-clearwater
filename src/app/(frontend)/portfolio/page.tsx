import { redirect } from 'next/navigation'

export default async function PortfolioPage() {
  redirect('/gallery')
}

export const metadata = {
  title: 'Gallery | Serenity Club of Clearwater',
}
