import Image from 'next/image'
import { PageHeader, SectionHeader, TeamGrid, ButtonLink } from '@/serenity/ui'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { DuesNotice } from '@/serenity/DuesNotice'
import { duesView } from '@/serenity/dues'
import { getSerenityData } from '@/serenity/data'
import clubFront from '@/serenity/artwork/club-front.webp'
import { mapLinks } from '@/serenity/siteCopy'

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
      <PageHeader
        eyebrow="Here for one another"
        title="A clubhouse for Clearwater's recovery community"
      >
        <p>{data.settings.tagline}</p>
      </PageHeader>
      <section className="club-section">
        <div className="club-shell club-split">
          <figure>
            <Image
              src={clubFront}
              alt="The Serenity Club sign outside the clubhouse"
              sizes="(min-width: 760px) 45vw, 100vw"
              className="club-wide-photo"
            />
            <figcaption className="club-photo-credit">
              <a href={mapLinks().place} target="_blank" rel="noreferrer">
                Photo via Google Maps ↗
              </a>
            </figcaption>
          </figure>
          <div>
            <p className="club-eyebrow">Our story</p>
            <h2>
              A place to find support.
              <br />A community to call your own.
            </h2>
            <p>{data.settings.aboutHistory}</p>
            <p>{data.settings.aboutWelcome}</p>
            <p>{data.settings.aboutStewardship}</p>
            <div className="club-actions">
              <ButtonLink href="/reach-out" variant="secondary">
                Visit the Club →
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <section className="club-section club-tint">
        <div className="club-shell">
          <SectionHeader eyebrow="People behind the place" title="Board and clubhouse leadership" />
          <TeamGrid teamMembers={data.teamMembers} />
        </div>
      </section>
      {hasNotice && (
        <section className="club-section">
          <div className="club-shell max-w-3xl">
            <DuesNotice compact notice={notice} legacyImage={data.settings.logoImageUrl} />
          </div>
        </section>
      )}
    </main>
  )
}
export const metadata = {
  alternates: { canonical: '/about' },
  title: 'About | Serenity Club of Clearwater',
}
