import { ButtonLink, PageHeader, SerenityImage } from '@/serenity/ui'
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react'
import { notFound } from 'next/navigation'

import { getProductBySlug, getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  return {
    title: product
      ? `${product.title} | Serenity Club of Clearwater`
      : 'Shop | Serenity Club of Clearwater',
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const [product, data] = await Promise.all([getProductBySlug(slug), getSerenityData()])

  if (!product) notFound()

  return (
    <main>
      <PageHeader eyebrow="Shop Item" title={product.title}>
        <p>{product.description}</p>
      </PageHeader>

      <section className="bg-white px-4 py-16">
        <div className="container grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-start">
          {product.imageUrl ? (
            <SerenityImage
              alt={product.imageAlt || product.title}
              className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
              src={product.imageUrl}
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-slate-200 bg-emerald-50 text-6xl font-semibold text-emerald-900">
              {product.title.slice(0, 1)}
            </div>
          )}
          <div>
            {product.badge ? (
              <p className="mb-3 w-fit rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-amber-950">
                {product.badge}
              </p>
            ) : null}
            <p className="text-3xl font-semibold text-emerald-900">{product.price}</p>
            <p className="mt-5 text-lg leading-8 text-slate-700">{product.fulfillmentNote}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {product.checkoutUrl ? (
                <ButtonLink href={product.checkoutUrl} variant="primary">
                  Checkout
                  <ExternalLink aria-hidden="true" />
                </ButtonLink>
              ) : (
                <ButtonLink href={`mailto:${data.settings.email}`} variant="primary">
                  <Mail aria-hidden="true" />
                  Contact the club
                </ButtonLink>
              )}
              <ButtonLink href="/shop" variant="secondary">
                <ArrowLeft aria-hidden="true" />
                Back to shop
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
