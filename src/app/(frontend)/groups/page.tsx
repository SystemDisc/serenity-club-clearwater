import { ButtonLink, PageHeader, SectionHeader, SerenityImage } from '@/serenity/ui'
import { CalendarDays, Mail, Users } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export default async function GroupsPage() {
  const data = await getSerenityData([])

  return (
    <main>
      <PageHeader eyebrow="Groups" title="Meeting groups and service committees">
        <p>{data.settings.groupIntroduction}</p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeader eyebrow="Use the space" title="Coordinate meeting and event needs">
              <p>{data.settings.facilityInformation}</p>
            </SectionHeader>
            <div className="club-giving-list">
              <article className="">
                <CalendarDays aria-hidden="true" className="hidden" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950">Meeting schedule</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Keep group meeting details current and easy to find.
                </p>
              </article>
              <article className="">
                <Users aria-hidden="true" className="hidden" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950">Service work</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Coordinate volunteers, events, and practical clubhouse support.
                </p>
              </article>
              <article className="">
                <Mail aria-hidden="true" className="hidden" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950">
                  Your meeting could be here
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Reach out if your recovery group needs a consistent clubhouse meeting space.
                </p>
              </article>
            </div>
            <ButtonLink className="mt-8" href={`mailto:${data.settings.email}`} variant="primary">
              <Mail aria-hidden="true" />
              Email the club
            </ButtonLink>
          </div>
          {data.settings.roomImageUrl ? (
            <SerenityImage
              alt="Serenity Club meeting room"
              className="aspect-[4/3] w-full rounded-lg object-cover"
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={data.settings.roomImageUrl}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  alternates: { canonical: '/groups' },
  title: 'Groups | Serenity Club of Clearwater',
}
