import { ButtonLink, PageHeader, SectionHeader, SerenityImage } from '@/serenity/ui'
import { CalendarDays, Mail, Users } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export default async function GroupsPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Groups" title="Meeting groups and service committees">
        <p>
          Serenity Club hosts recovery meetings and club service work in a practical, central
          clubhouse space.
        </p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeader eyebrow="Use the space" title="Coordinate meeting and event needs">
              <p>
                Groups can reach out about meeting room use, schedule questions, special events, and
                service opportunities.
              </p>
            </SectionHeader>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-lg border border-slate-200 bg-white p-5">
                <CalendarDays aria-hidden="true" className="size-7 text-emerald-900" />
                <h2 className="mt-4 text-lg font-semibold text-slate-950">Meeting schedule</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Keep group meeting details current and easy to find.
                </p>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-5">
                <Users aria-hidden="true" className="size-7 text-emerald-900" />
                <h2 className="mt-4 text-lg font-semibold text-slate-950">Service work</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Coordinate volunteers, events, and practical clubhouse support.
                </p>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-5">
                <Mail aria-hidden="true" className="size-7 text-emerald-900" />
                <h2 className="mt-4 text-lg font-semibold text-slate-950">
                  Your meeting could be here
                </h2>
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
  title: 'Groups | Serenity Club of Clearwater',
}
