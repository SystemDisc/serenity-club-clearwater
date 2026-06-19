import { PageHeader, SectionHeader, SerenityImage } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  const data = await getSerenityData()
  const images = [
    {
      alt: 'Serenity Club of Clearwater exterior sign',
      src: data.settings.heroImageUrl,
      title: 'Clubhouse sign',
    },
    {
      alt: 'Serenity Club of Clearwater meeting room',
      src: data.settings.roomImageUrl,
      title: 'Meeting room',
    },
    ...data.events
      .filter((event) => event.imageUrl)
      .map((event) => ({
        alt: event.imageAlt || event.title,
        src: event.imageUrl,
        title: event.title,
      })),
  ].filter((image): image is { alt: string; src: string; title: string } => Boolean(image.src))

  return (
    <main>
      <PageHeader eyebrow="Portfolio" title="Clubhouse photos and flyers">
        <p>
          Photos and flyer images from the current Serenity Club site and editable event records.
        </p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container">
          <SectionHeader eyebrow="Gallery" title="Serenity Club media" />
          <div className="grid gap-5 md:grid-cols-3">
            {images.map((image) => (
              <figure
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                key={`${image.title}-${image.src}`}
              >
                <SerenityImage
                  alt={image.alt}
                  className="aspect-[4/3] w-full rounded-md object-cover"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  src={image.src}
                />
                <figcaption className="px-1 pt-3 text-sm font-semibold text-slate-800">
                  {image.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Portfolio | Serenity Club of Clearwater',
}
