import { GalleryGrid, PageHeader, SectionHeader } from '@/serenity/ui'

import { getSerenityData } from '@/serenity/data'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const data = await getSerenityData()

  return (
    <main>
      <PageHeader eyebrow="Gallery" title="Photos and flyers from Serenity Club">
        <p>
          Clubhouse images, monthly flyers, and community moments. Admins can add, edit, reorder,
          and publish gallery items from the CMS.
        </p>
      </PageHeader>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="container">
          <SectionHeader eyebrow="Serenity Club media" title="A look inside the clubhouse">
            <p>
              These images help visitors recognize the space before they arrive and keep current
              flyers easy to find.
            </p>
          </SectionHeader>
          <GalleryGrid items={data.galleryItems} />
        </div>
      </section>
    </main>
  )
}

export const metadata = {
  title: 'Gallery | Serenity Club of Clearwater',
}
