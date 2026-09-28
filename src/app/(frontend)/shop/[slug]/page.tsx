import { ButtonLink, PageHeader, SerenityImage } from '@/serenity/ui'
import { ArrowLeft, ExternalLink, Mail, ShoppingBag } from 'lucide-react'
import { notFound } from 'next/navigation'

import { getProductBySlug, getSerenityData } from '@/serenity/data'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const data = await getSerenityData(['products'])

  return data.products.filter((product) => product.slug).map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: Args) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  return {
    alternates: { canonical: `/shop/${slug}` },
    title: product
      ? `${product.title} | Serenity Club of Clearwater`
      : 'Shop | Serenity Club of Clearwater',
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const [product, data] = await Promise.all([getProductBySlug(slug), getSerenityData(['products'])])

  if (!product) notFound()

  return (
    <main>
      <PageHeader eyebrow="Shop Item" title={product.title}>
        <p>{product.description}</p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-start">
          {product.imageUrl ? (
            <figure>
              <SerenityImage
                alt={product.imageAlt || product.title}
                className={`aspect-[4/3] w-full rounded-lg border border-slate-200 object-contain ${product.imageUrl === '/brand/shop-coffee-mug.svg' ? 'bg-[#e8ebe5]' : 'bg-[#f0eee6]'}`}
                sizes="(min-width: 1024px) 40vw, 100vw"
                src={product.imageUrl}
              />
              {product.slug === 'medallions' && product.imageUrl === '/shop/aa-medallions.jpg' ? (
                <figcaption className="club-photo-credit">
                  Representative AA medallions; designs and milestones may vary. Photo by{' '}
                  <a
                    href="https://commons.wikimedia.org/wiki/File:Enduring_Strength_(3144377781).jpg"
                    target="_blank"
                    rel="noreferrer"
                  >
                    frankieleon / Wikimedia Commons
                  </a>{' '}
                  ·{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/2.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY 2.0
                  </a>
                  .
                </figcaption>
              ) : null}
            </figure>
          ) : (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-6 text-emerald-950">
              <ShoppingBag aria-hidden="true" className="size-8 text-emerald-900" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-900">
                Support the clubhouse
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{product.title}</h2>
              <p className="mt-3 leading-7 text-slate-700">
                Memberships and clubhouse items help keep meetings, events, and daily operations
                available to the Clearwater recovery community.
              </p>
            </div>
          )}
          <div className="border-t-2 border-[#163e32] py-6">
            {product.badge ? (
              <p className="mb-3 w-fit rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-amber-950">
                {product.badge}
              </p>
            ) : null}
            <p className="font-serif text-5xl text-[#a44224]">{product.price}</p>
            <p className="mt-4 text-base leading-7 text-slate-700">{product.fulfillmentNote}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
