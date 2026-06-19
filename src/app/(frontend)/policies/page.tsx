import { PageHeader, PolicyList } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function PoliciesPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Policies" title="Clubhouse policies">
        <p>
          Policies help keep Serenity Club safe, welcoming, and useful for meetings, members, and
          visitors.
        </p>
      </PageHeader>

      <section className="bg-[#fbfaf7] px-4 py-10 md:py-12">
        <div className="container max-w-4xl">
          <PolicyList policies={data.policies} />
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Policies | Serenity Club of Clearwater',
}
