import Image from 'next/image'
import { ButtonLink, PageHeader, SectionHeader } from '@/serenity/ui'
import { getSerenityData } from '@/serenity/data'
import communityArt from '@/serenity/artwork/community.webp'

export default async function WaysToGivePage() {
  const { settings } = await getSerenityData([])
  return (
    <main>
      <PageHeader eyebrow="Many ways to make a difference" title="Support Serenity Club">
        <p>
          Serenity Club is sustained by memberships, donations, volunteers, and community support.
          There’s a place for your contribution.
        </p>
      </PageHeader>
      <section className="club-section">
        <div className="club-shell club-split">
          <div>
            <p className="club-eyebrow">Keep the doors open</p>
            <h2>
              Give a little.
              <br />
              Help a lot.
            </h2>
            <p>
              Donations help cover clubhouse operations and keep the space available for meetings,
              fellowship, and community support.
            </p>
            <div className="club-actions">
              <ButtonLink href={settings.donationUrl}>Donate online ↗</ButtonLink>
              <ButtonLink href="/shop" variant="secondary">
                Become a member →
              </ButtonLink>
            </div>
            <p>Monthly and annual memberships are a simple way to support the Club year-round.</p>
          </div>
          <Image
            src={communityArt}
            alt="Illustration of coffee cups, books, and a community noticeboard"
            className="club-wide-photo"
            sizes="(min-width: 760px) 45vw, 100vw"
          />
        </div>
      </section>
      <section className="club-section club-tint">
        <div className="club-shell club-split items-start">
          <SectionHeader eyebrow="Every contribution counts" title="Give money, items, or time">
            <p>Choose a way to help that fits your life.</p>
          </SectionHeader>
          <div className="club-giving-list">
            <article>
              <h3>At the coffee bar</h3>
              <p>
                Donate in person when the clubhouse is open, or call and ask for the coffee bar
                manager.
              </p>
              <a className="club-text-link" href={`tel:${settings.phone}`}>
                Call {settings.phone} →
              </a>
            </article>
            <article>
              <h3>Donate useful items</h3>
              <p>{settings.donatedItemsInformation}</p>
            </article>
            <article>
              <h3>Volunteer in the office</h3>
              <p>{settings.officeVolunteerInformation}</p>
            </article>
            <article>
              <h3>Volunteer at the coffee bar</h3>
              <p>{settings.coffeeVolunteerInformation}</p>
              <a
                className="club-text-link"
                href={`mailto:${settings.email}?subject=Volunteering%20at%20Serenity%20Club`}
              >
                Ask about volunteering →
              </a>
            </article>
          </div>
        </div>
      </section>
      <section className="club-section">
        <div className="club-shell club-split items-start">
          <div>
            <SectionHeader eyebrow="Community sponsors" title="Help our community thrive">
              <p>{settings.sponsorshipInformation}</p>
              <p className="mt-4">{settings.sponsorshipContact}</p>
            </SectionHeader>
            <ButtonLink href={`mailto:${settings.email}?subject=Community%20sponsorship`}>
              Start a sponsorship conversation →
            </ButtonLink>
          </div>
          <div>
            <SectionHeader eyebrow="Stay connected" title="Be part of what’s next">
              <p>
                The Club shares events and announcements. Email us to join update lists or receive
                current event information.
              </p>
            </SectionHeader>
            <ButtonLink
              href={`mailto:${settings.email}?subject=Serenity%20Club%20updates`}
              variant="secondary"
            >
              Request updates
            </ButtonLink>
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="club-text-link ml-5"
              >
                Follow on Facebook ↗
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
export const metadata = {
  alternates: { canonical: '/ways-to-give' },
  title: 'Ways to Give | Serenity Club of Clearwater',
}
