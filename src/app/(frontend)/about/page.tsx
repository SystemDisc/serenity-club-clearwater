import { PageHeader, SectionHeader, SerenityImage, TeamGrid } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'

export default async function AboutPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="About" title="A clubhouse for Clearwater's recovery community">
        <p>{data.settings.tagline}</p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
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
                Serenity Club opened more than 50 years ago as a safe, sober place to go. The club
                was incorporated in 1993 to provide assistance, encouragement, and reassurance to
                people seeking recovery.
              </p>
            </SectionHeader>
            <div className="grid gap-5 text-base leading-8 text-slate-700">
              <p>
                The clubhouse at {data.settings.address} serves people irrespective of race, color,
                creed, or gender, and supports the moral, mental, social, and physical betterment of
                its members.
              </p>
              <p>
                The board and club manager steward the space, policies, events, and membership
                program so the clubhouse can continue serving Clearwater.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf7] px-4 py-10 md:py-12">
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
