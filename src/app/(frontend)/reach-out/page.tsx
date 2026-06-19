import { PageHeader, SectionHeader } from '@/serenity/ui'
import { Mail, MapPin, Phone } from 'lucide-react'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function ReachOutPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Reach Out" title="Contact Serenity Club">
        <p>
          Call, email, or visit the clubhouse for membership, meeting, event, and group questions.
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
                href="https://maps.google.com/?q=631%20Turner%20Street%20Clearwater%20FL%2033756"
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
            src="https://www.google.com/maps?q=631%20Turner%20Street%2C%20Clearwater%2C%20FL%2033756&output=embed"
            title="Map to Serenity Club of Clearwater"
          />
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Reach Out | Serenity Club of Clearwater',
}
