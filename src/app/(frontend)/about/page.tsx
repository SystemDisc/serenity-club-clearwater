import { PageHeader, SectionHeader, TeamGrid } from '@/serenity/ui'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { DuesNotice } from '@/serenity/DuesNotice'
import { duesView } from '@/serenity/dues'
import { getSerenityData } from '@/serenity/data'

export default async function AboutPage() {
  const [data, reminder] = await Promise.all([
    getSerenityData(['teamMembers']),
    getCachedGlobal('duesReminder', 1)(),
  ])
  const notice = duesView(reminder._status === 'published' ? reminder : null)
  const hasNotice =
    notice.mode !== 'off' && (notice.mode !== 'legacy' || !!data.settings.logoImageUrl)

  return (
    <main>
      <PageHeader eyebrow="About" title="A clubhouse for Clearwater's recovery community">
        <p>{data.settings.tagline}</p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div
          className={`container grid gap-10 lg:items-center ${hasNotice ? 'lg:grid-cols-[0.9fr_1.1fr]' : ''}`}
        >
          <DuesNotice notice={notice} legacyImage={data.settings.logoImageUrl} />
          <div>
            <SectionHeader eyebrow="Mission" title="Safe, supportive, and member supported">
              <p>{data.settings.aboutHistory}</p>
            </SectionHeader>
            <div className="grid gap-5 text-base leading-8 text-slate-700">
              <p>{data.settings.aboutWelcome}</p>
              <p>{data.settings.aboutStewardship}</p>
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
  alternates: { canonical: '/about' },
  title: 'About | Serenity Club of Clearwater',
}
