import { ButtonLink, PageHeader, SectionHeader } from '@/serenity/ui'
import { HeartHandshake, Shirt, Users } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function WaysToGivePage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Ways to Give" title="Support Serenity Club">
        <p>
          Serenity Club is sustained by memberships, donations, volunteers, and community support.
        </p>
        <div className="mt-5">
          <ButtonLink href={data.settings.donationUrl} variant="primary">
            <HeartHandshake aria-hidden="true" />
            Donate online
          </ButtonLink>
        </div>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container grid gap-5 md:grid-cols-3">
          <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <HeartHandshake aria-hidden="true" className="size-7 text-emerald-900" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Donate</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Donations help cover clubhouse operations and keep the space available for meetings.
            </p>
            <div className="mt-auto pt-5">
              <ButtonLink href={data.settings.donationUrl} variant="primary">
                Donate online
              </ButtonLink>
            </div>
          </article>
          <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Users aria-hidden="true" className="size-7 text-emerald-900" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Become a member</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Monthly and annual memberships are one of the simplest ways to support the club.
            </p>
            <div className="mt-auto pt-5">
              <ButtonLink href="/shop" variant="secondary">
                View memberships
              </ButtonLink>
            </div>
          </article>
          <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Shirt aria-hidden="true" className="size-7 text-emerald-900" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Volunteer</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Service work helps with events, housekeeping, meeting support, and day-to-day needs.
            </p>
            <div className="mt-auto pt-5">
              <ButtonLink href="/reach-out" variant="secondary">
                Reach out
              </ButtonLink>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-[#f7f2e8] px-4 py-10 md:py-12">
        <div className="container">
          <SectionHeader eyebrow="Sponsors" title="Community sponsorships">
            <p>
              Sponsors can support events, supplies, and clubhouse needs. Contact the club to
              discuss current opportunities.
            </p>
          </SectionHeader>
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Ways to Give | Serenity Club of Clearwater',
}
