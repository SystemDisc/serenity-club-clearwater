import { PageHeader, ProductGrid, SectionHeader } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Shop" title="Memberships and club items">
        <p>
          Memberships and clubhouse items directly support Serenity Club operations, meetings, and
          events.
        </p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container">
          <SectionHeader eyebrow="Items" title="Memberships first, clubhouse items below">
            <p>Memberships are the clearest way to support the club year-round.</p>
          </SectionHeader>
          <ProductGrid products={data.products} />
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Shop | Serenity Club of Clearwater',
}
