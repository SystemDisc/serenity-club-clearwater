import { PageHeader, SectionHeader, SerenityImage, TeamGrid } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="About" title="A clubhouse for Clearwater's recovery community">
        <p>{data.settings.tagline}</p>
      </PageHeader>

      <section className="bg-white px-4 py-16">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {data.settings.logoImageUrl ? (
            <SerenityImage
              alt="Serenity Club of Clearwater logo"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 object-contain p-8"
              sizes="(min-width: 1024px) 40vw, 100vw"
              src={data.settings.logoImageUrl}
            />
          ) : null}
          <div>
            <SectionHeader eyebrow="Mission" title="Safe, supportive, and member supported">
              <p>
                Serenity Club exists to provide a dependable home for meetings, fellowship, and
                recovery-focused service. Members, volunteers, groups, and supporters help keep the
                space open and useful every day.
              </p>
            </SectionHeader>
            <div className="grid gap-5 text-base leading-8 text-slate-700">
              <p>
                The clubhouse at {data.settings.address} hosts daily meetings and gives people in
                recovery a place to connect between meetings, support newcomers, and take part in
                service.
              </p>
              <p>
                The board and club manager steward the space, policies, events, and membership
                program so the clubhouse can continue serving Clearwater.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7] px-4 py-16">
        <div className="container">
          <SectionHeader eyebrow="Team" title="Board and clubhouse leadership" />
          <TeamGrid teamMembers={data.teamMembers} />
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'About | Serenity Club of Clearwater',
}
