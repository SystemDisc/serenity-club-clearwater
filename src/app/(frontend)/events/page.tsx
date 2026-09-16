import { ButtonLink, EventGrid, PageHeader, SectionHeader } from '@/serenity/ui'
import { HeartHandshake } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'
import { getMonthlyFlyers, displayMonth } from '@/serenity/flyers'
import { FlyerCard } from '@/serenity/FlyerCard'
import { localDateKey } from '@/serenity/calendar'

export default async function EventsPage() {
  const [data, flyers] = await Promise.all([getSerenityData(['events']), getMonthlyFlyers()])

  return (
    <main>
      <PageHeader eyebrow="Events" title="Fellowship, service, speakers, and fundraisers">
        <p>Find current club events, speaker meetings, fundraisers, and service opportunities.</p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container">
          {flyers.current ? (
            <div className="mb-10">
              <FlyerCard flyer={flyers.current} priority />
            </div>
          ) : (
            <p className="mb-8">
              The {displayMonth(localDateKey().slice(0, 7))} monthly flyer has not been posted yet.
            </p>
          )}
          <EventGrid events={data.events} headingLevel="h2" />
        </div>
      </section>
      {flyers.archive.length ? (
        <section className="bg-[#fbfaf7] px-4 py-10">
          <div className="container">
            <h2 className="mb-6 text-2xl font-semibold">Previous monthly flyers</h2>
            {flyers.archive.map((flyer) => (
              <details
                className="mb-4 rounded-lg border border-slate-200 bg-white p-4"
                key={flyer.id}
              >
                <summary className="cursor-pointer py-2 text-lg font-semibold">
                  {displayMonth(flyer.month)}
                </summary>
                <FlyerCard flyer={flyer} />
              </details>
            ))}
          </div>
        </section>
      ) : null}

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
  alternates: { canonical: '/events' },
  title: 'Events | Serenity Club of Clearwater',
}
