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

      <section className="bg-white px-4 py-16">
        <div className="container">
          <SectionHeader eyebrow="Items" title="Available from Serenity Club" />
          <ProductGrid products={data.products} />
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Shop | Serenity Club of Clearwater',
}
