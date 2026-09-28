import { ContactBand, MeetingList, PageHeader, SectionHeader } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'
import { regularMeetingRows } from '@/serenity/publicMeetings'

import { MeetingFinder } from '@/serenity/MeetingFinder'

const amenities = [
  {
    title: 'Coffee bar',
    text: 'Coffee, snacks, merchandise, and books are available in the remodeled coffee bar.',
  },
  {
    title: 'Free store',
    text: 'Donated clothing, shoes, and similar items are available to anyone in need.',
  },
  {
    title: 'Computer center',
    text: 'Members can use the computer center for news, opportunities, and social service research.',
  },
  {
    title: 'Pool table',
    text: 'Members have access to the pool table and seasonal pool tournaments.',
  },
]

export default async function MeetingSchedulePage() {
  const data = await getSerenityData(['meetings'])
  const sortedMeetings = regularMeetingRows(data.meetings)
  const aaMeetings = sortedMeetings.filter((meeting) => meeting.fellowship === 'AA')
  const naMeetings = sortedMeetings.filter((meeting) => meeting.fellowship === 'NA')
  const clubMeetings = sortedMeetings.filter((meeting) => meeting.fellowship === 'Club')

  return (
    <main className="meeting-page">
      <PageHeader eyebrow="Meeting Schedule" title="Find a meeting at Serenity Club">
        <p>
          {data.settings.hours} Serenity Club hosts multiple AA and NA recovery groups. Non-members
          may access the club 30 minutes before and after the meetings they attend.
        </p>
      </PageHeader>

      <MeetingFinder meetings={data.meetings} initialNow={new Date().getTime()} />

      <ContactBand settings={data.settings} />

      <details className="club-shell my-12">
        <summary className="club-text-link cursor-pointer">
          Browse the full recurring schedule
        </summary>
        <section className="bg-white px-4 py-10 md:py-12" id="aa">
          <div className="container">
            <SectionHeader eyebrow="AA" title="Alcoholics Anonymous meetings" />
            <MeetingList meetings={aaMeetings} />
          </div>
        </section>

        <section className="bg-[#fbfaf7] px-4 py-10 md:py-12" id="na">
          <div className="container">
            <SectionHeader eyebrow="NA" title="Narcotics Anonymous meetings" />
            <MeetingList meetings={naMeetings} />
          </div>
        </section>

        <section className="bg-white px-4 py-10 md:py-12" id="club">
          <div className="container">
            <SectionHeader eyebrow="Club" title="Club meetings and service" />
            <MeetingList meetings={clubMeetings} />
          </div>
        </section>
      </details>
      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container">
          <SectionHeader eyebrow="Around the club" title="Between meetings">
            <p>
              The clubhouse also gives members and visitors practical places to connect, get coffee,
              and use shared resources.
            </p>
          </SectionHeader>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {amenities.map((amenity) => (
              <article className="border-t border-[#cbd3c5] pt-5" key={amenity.title}>
                <h3 className="text-lg font-semibold text-slate-950">{amenity.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{amenity.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  alternates: { canonical: '/meeting-schedule' },
  title: 'Meeting Schedule | Serenity Club of Clearwater',
}
