import {
  SERENITY_GOOGLE_MAPS_EMBED_URL,
  SERENITY_GOOGLE_MAPS_PLACE_URL,
} from '@/serenity/content'
import { PageHeader, SectionHeader } from '@/serenity/ui'
import { Mail, MapPin, Phone } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export default async function ReachOutPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Reach Out" title="Contact Serenity Club">
        <p>
          Call, email, or visit the clubhouse for membership, meeting, event, and group questions.
          The club is open from 7am to 9pm each day, with meetings from 7am to 9pm.
        </p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader eyebrow="Clubhouse" title="Visit downtown Clearwater">
              <p>{data.settings.hours}</p>
            </SectionHeader>
            <div className="grid gap-3 text-slate-700">
              <a
                className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-[#fbfaf7] px-4 hover:border-emerald-700 hover:text-emerald-900"
                href={`tel:${data.settings.phone}`}
              >
                <Phone aria-hidden="true" className="size-5 text-emerald-900" />
                {data.settings.phone}
              </a>
              <a
                className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-[#fbfaf7] px-4 hover:border-emerald-700 hover:text-emerald-900"
                href={`mailto:${data.settings.email}`}
              >
                <Mail aria-hidden="true" className="size-5 text-emerald-900" />
                {data.settings.email}
              </a>
              <a
                className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-[#fbfaf7] px-4 hover:border-emerald-700 hover:text-emerald-900"
                href={SERENITY_GOOGLE_MAPS_PLACE_URL}
                rel="noreferrer"
                target="_blank"
              >
                <MapPin aria-hidden="true" className="size-5 text-emerald-900" />
                {data.settings.address}, {data.settings.cityStateZip}
              </a>
            </div>
          </div>
          <iframe
            className="min-h-[360px] w-full rounded-lg border border-slate-200"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={SERENITY_GOOGLE_MAPS_EMBED_URL}
            title="Map to Serenity Club of Clearwater"
          />
        </div>
      </section>

      <section className="bg-[#fbfaf7] px-4 py-10 md:py-12">
        <div className="container grid gap-5 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-950">Looking for a meeting place?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Whether you are looking for a recovery meeting or a meeting place, the club can help
              with schedule and room questions.
            </p>
            <a
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              href={`mailto:${data.settings.email}?subject=Meeting%20or%20room%20question`}
            >
              Email a question
            </a>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-950">Reserve a small room</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Members may request one of the small rooms for sponsor and sponsee meetings. Include
              your first and last name, email, phone number, requested date and time, and message.
            </p>
            <a
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
              href={`mailto:${data.settings.email}?subject=Small%20room%20reservation%20request`}
            >
              Request a room
            </a>
          </article>
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Reach Out | Serenity Club of Clearwater',
}
