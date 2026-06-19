import { ContactBand, MeetingList, PageHeader, SectionHeader } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'
import type { Meeting } from '@/serenity/content'
import { sortedMeetingsByTime } from '@/serenity/meetings'

export const dynamic = 'force-dynamic'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function meetingRunsToday(meeting: Meeting, today: string) {
  const days = meeting.days.toLowerCase()
  const todayName = today.toLowerCase()

  if (days.includes('daily')) return true
  if (days.includes(todayName)) return true

  if (days.includes('monday through friday')) {
    return weekdays.includes(today)
  }

  return false
}

export default async function MeetingSchedulePage() {
  const data = await getSerenityData()
  const sortedMeetings = sortedMeetingsByTime(data.meetings)
  const aaMeetings = sortedMeetings.filter((meeting) => meeting.fellowship === 'AA')
  const naMeetings = sortedMeetings.filter((meeting) => meeting.fellowship === 'NA')
  const clubMeetings = sortedMeetings.filter((meeting) => meeting.fellowship === 'Club')
  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
  }).format(new Date())
  const todayMeetings = sortedMeetings.filter((meeting) => meetingRunsToday(meeting, today))

  return (
    <main>
      <PageHeader eyebrow="Meeting Schedule" title="Find a meeting at Serenity Club">
        <p>{data.settings.hours}</p>
      </PageHeader>
      <ContactBand settings={data.settings} />

      <section className="border-b border-slate-200 bg-white px-4 py-8">
        <div className="container">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { count: aaMeetings.length, href: '#aa', label: 'AA meetings' },
              { count: naMeetings.length, href: '#na', label: 'NA meetings' },
              { count: clubMeetings.length, href: '#club', label: 'Club service' },
            ].map((item) => (
              <a
                className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-4 transition hover:border-emerald-700 hover:bg-white"
                href={item.href}
                key={item.href}
              >
                <span className="block text-2xl font-semibold text-emerald-900">{item.count}</span>
                <span className="mt-1 block text-sm font-semibold text-slate-950">
                  {item.label}
                </span>
              </a>
            ))}
          </div>

          {todayMeetings.length ? (
            <div className="mt-8">
              <SectionHeader eyebrow="Today" title={`${today} meetings`}>
                <p>Regularly listed meetings for today, followed by the full schedule below.</p>
              </SectionHeader>
              <MeetingList compact meetings={todayMeetings} />
            </div>
          ) : null}
        </div>
      </section>

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
    </main>
  )
}

export const metadata = {
  title: 'Meeting Schedule | Serenity Club of Clearwater',
}
