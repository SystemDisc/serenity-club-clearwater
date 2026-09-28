import { ButtonLink, PageHeader, ProductGrid, SectionHeader } from '@/serenity/ui'
import { getSerenityData } from '@/serenity/data'
import { ExternalLink, Mail } from 'lucide-react'

export default async function ShopPage() {
  const { products, settings } = await getSerenityData(['products'])
  const isMembership = (slug: string) => ['monthly-membership', 'annual-membership'].includes(slug)
  const memberships = products.filter((product) => isMembership(product.slug))
  const items = products.filter((product) => !isMembership(product.slug))
  return (
    <main>
      <PageHeader eyebrow="Belong. Support. Make a difference." title="Memberships and club items">
        <p>Your support helps keep a welcoming space for recovery, every day of the year.</p>
      </PageHeader>
      {memberships.length > 0 && (
        <section className="club-section">
          <div className="club-shell">
            <SectionHeader
              eyebrow="Become a member"
              title="A little from each of us goes a long way"
            >
              <p>
                Choose the membership that works for you. Monthly and annual options both support
                the Club.
              </p>
            </SectionHeader>
            <div className="club-memberships">
              {memberships.map((product) => (
                <article className="club-membership" key={product.slug}>
                  <h3>{product.title}</h3>
                  <p className="club-price">{product.price}</p>
                  <p>{product.description}</p>
                  <p className="mt-3 text-sm">{product.fulfillmentNote}</p>
                  {product.badge && <p className="mt-3 font-semibold">{product.badge}</p>}
                  {product.checkoutUrl ? (
                    <ButtonLink href={product.checkoutUrl}>
                      Checkout <ExternalLink aria-hidden="true" />
                    </ButtonLink>
                  ) : (
                    <ButtonLink
                      href={`mailto:${settings.email}?subject=${encodeURIComponent(`${product.title} inquiry`)}`}
                    >
                      <Mail aria-hidden="true" />
                      Contact the club
                    </ButtonLink>
                  )}
                </article>
              ))}
            </div>
            <p className="club-note">
              You don’t need to be a member to attend a meeting. Non-members may access the Club 30
              minutes before and after the meetings they attend.
            </p>
          </div>
        </section>
      )}
      {items.length > 0 && (
        <section className="club-section club-tint">
          <div className="club-shell">
            <SectionHeader eyebrow="From the coffee bar" title="A little piece of Serenity" />
            <ProductGrid products={items} />
            {items.some(
              (product) =>
                product.slug === 'medallions' && product.imageUrl === '/shop/aa-medallions.jpg',
            ) ? (
              <p className="club-photo-credit">
                Representative medallion photo by{' '}
                <a
                  href="https://commons.wikimedia.org/wiki/File:Enduring_Strength_(3144377781).jpg"
                  target="_blank"
                  rel="noreferrer"
                >
                  frankieleon / Wikimedia Commons
                </a>{' '}
                ·{' '}
                <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noreferrer">
                  CC BY 2.0
                </a>
                . Card image is cropped to fit.
              </p>
            ) : null}
          </div>
        </section>
      )}
    </main>
  )
}
export const metadata = {
  alternates: { canonical: '/shop' },
  title: 'Shop | Serenity Club of Clearwater',
}
