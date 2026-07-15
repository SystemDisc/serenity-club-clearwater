import { ContactBand, MeetingList, PageHeader, SectionHeader } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'
import type { Meeting } from '@/serenity/content'
import { sortedMeetingsByTime } from '@/serenity/meetings'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const groupNotes = [
  {
    title: 'AA group formats',
    items: [
      'Feelings Group rotates book study and discussion formats Monday through Saturday.',
      'TGIF meets at noon daily, with Big Book study on Tuesday and 12 Steps and 12 Traditions on Thursday.',
      'Mid-Day meets daily at 3pm for open discussion.',
      'Turner Street meets nightly, with the Saturday campfire meeting.',
      'Women With Freedom is a closed women-only meeting on Wednesday mornings.',
    ],
  },
  {
    title: 'NA group formats',
    items: [
      'Serenity in Addiction rotates open discussion, literature study, beginner, speaker, celebration, and IP discussion formats.',
      'Serenity in Addiction holds its business meeting the first Monday of the month at 8pm.',
      'The Noon Group meets Sundays at noon in the back room.',
    ],
  },
]

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
        <p>
          {data.settings.hours} Serenity Club hosts multiple AA and NA recovery groups. Non-members
          may access the club 30 minutes before and after the meetings they attend.
        </p>
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

      <section className="bg-[#fbfaf7] px-4 py-10 md:py-12">
        <div className="container">
          <SectionHeader eyebrow="Group details" title="Meeting formats and group notes">
            <p>
              These notes mirror the group-level details from the club schedule and help visitors
              choose the right room, day, and format.
            </p>
          </SectionHeader>
          <div className="grid gap-5 lg:grid-cols-2">
            {groupNotes.map((group) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5"
                key={group.title}
              >
                <h2 className="text-xl font-semibold text-slate-950">{group.title}</h2>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                  {group.items.map((item) => (
                    <li className="flex gap-3" key={item}>
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-800"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

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
              <article
                className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-5"
                key={amenity.title}
              >
                <h2 className="text-lg font-semibold text-slate-950">{amenity.title}</h2>
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
  title: 'Meeting Schedule | Serenity Club of Clearwater',
}
