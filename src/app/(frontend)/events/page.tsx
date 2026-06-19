import { ButtonLink, EventGrid, PageHeader, SectionHeader } from '@/serenity/ui'
import { HeartHandshake } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Events" title="Fellowship, service, speakers, and fundraisers">
        <p>Find current club events, speaker meetings, fundraisers, and service opportunities.</p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container">
          <EventGrid events={data.events} />
        </div>
      </section>

      <section className="bg-[#f7f2e8] px-4 py-10 md:py-12">
        <div className="container flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <SectionHeader eyebrow="Support" title="Help keep events running">
            <p>
              Donations, memberships, volunteers, and event participation support the clubhouse.
            </p>
          </SectionHeader>
          <ButtonLink href={data.settings.donationUrl} variant="primary">
            <HeartHandshake aria-hidden="true" />
            Donate
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Events | Serenity Club of Clearwater',
}
