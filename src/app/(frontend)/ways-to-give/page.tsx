import { ButtonLink, PageHeader, SectionHeader } from '@/serenity/ui'
import { Coffee, Gift, HeartHandshake, Mail, Phone, Shirt, Users } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

const donationMethods = [
  {
    title: 'In person',
    text: 'Donate at the coffee bar when the clubhouse is open.',
    icon: Coffee,
  },
  {
    title: 'By phone',
    text: 'Call the club and ask for the coffee bar manager.',
    icon: Phone,
  },
  {
    title: 'Items',
    text: 'Drop off new and gently used donations during weekday business hours.',
    icon: Shirt,
  },
]

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
        <div className="container">
          <SectionHeader eyebrow="Donate" title="Give money, items, or time">
            <p>
              Donations help cover clubhouse operations and keep the space available for meetings,
              fellowship, and community support.
            </p>
          </SectionHeader>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <HeartHandshake aria-hidden="true" className="size-7 text-emerald-900" />
              <h2 className="mt-4 text-xl font-semibold text-slate-950">Online</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Make a donation online through the club donation link.
              </p>
              <div className="mt-auto pt-5">
                <ButtonLink href={data.settings.donationUrl} variant="primary">
                  Donate online
                </ButtonLink>
              </div>
            </article>
            {donationMethods.map(({ icon: Icon, text, title }) => (
              <article
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={title}
              >
                <Icon aria-hidden="true" className="size-7 text-emerald-900" />
                <h2 className="mt-4 text-xl font-semibold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f2e8] px-4 py-10 md:py-12">
        <div className="container grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader eyebrow="Membership" title="Become a member">
              <p>
                Monthly and annual memberships are one of the simplest ways to support the club
                year-round.
              </p>
            </SectionHeader>
            <ButtonLink href="/shop" variant="secondary">
              <Users aria-hidden="true" />
              View memberships
            </ButtonLink>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Gift aria-hidden="true" className="size-7 text-emerald-900" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">Volunteer in the office</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Contact the coffee bar manager about office volunteer needs.
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Coffee aria-hidden="true" className="size-7 text-emerald-900" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                Volunteer at the coffee bar
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Monthly coffee bar volunteer schedules are coordinated through the club manager.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeader eyebrow="Sponsors" title="Community sponsorships">
            <p>
              Club sponsors support events, supplies, and clubhouse needs. The sponsor level listed
              by the club starts at a $500 annual donation.
            </p>
          </SectionHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Start a sponsorship conversation
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Contact the club manager with your name, email, phone number, and sponsorship
                message.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <ButtonLink href={`mailto:${data.settings.email}`} variant="primary">
                  <Mail aria-hidden="true" />
                  Email the club
                </ButtonLink>
                {data.settings.facebookUrl ? (
                  <ButtonLink href={data.settings.facebookUrl} variant="secondary">
                    Facebook
                  </ButtonLink>
                ) : null}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-5">
              <h2 className="text-xl font-semibold text-slate-950">Stay connected</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                The club shares event and announcement updates. Email the club if you want to be
                added to update lists or receive current event information.
              </p>
              <div className="mt-5">
                <ButtonLink
                  href={`mailto:${data.settings.email}?subject=Serenity%20Club%20updates`}
                  variant="secondary"
                >
                  <Mail aria-hidden="true" />
                  Request updates
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Ways to Give | Serenity Club of Clearwater',
}
