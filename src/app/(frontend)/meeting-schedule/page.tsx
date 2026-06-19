import { ContactBand, MeetingList, PageHeader, SectionHeader } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function MeetingSchedulePage() {
  const data = await getSerenityData()
  const aaMeetings = data.meetings.filter((meeting) => meeting.fellowship === 'AA')
  const naMeetings = data.meetings.filter((meeting) => meeting.fellowship === 'NA')
  const clubMeetings = data.meetings.filter((meeting) => meeting.fellowship === 'Club')

  return (
    <main>
      <PageHeader eyebrow="Meeting Schedule" title="Recovery meetings from morning through evening">
        <p>{data.settings.hours}</p>
      </PageHeader>
      <ContactBand settings={data.settings} />

      <section className="bg-white px-4 py-16">
        <div className="container">
          <SectionHeader eyebrow="AA" title="Alcoholics Anonymous meetings" />
          <MeetingList meetings={aaMeetings} />
        </div>
      </section>

      <section className="bg-[#fbfaf7] px-4 py-16">
        <div className="container">
          <SectionHeader eyebrow="NA" title="Narcotics Anonymous meetings" />
          <MeetingList meetings={naMeetings} />
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="container">
          <SectionHeader eyebrow="Club" title="Club meetings and service" />
          <MeetingList meetings={clubMeetings} />
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Meeting Schedule | Serenity Club of Clearwater',
}
