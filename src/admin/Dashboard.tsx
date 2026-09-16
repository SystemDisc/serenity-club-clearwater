import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'
import { localDateKey } from '@/serenity/calendar'
import { displayMonth } from '@/serenity/flyers'

export default async function Dashboard({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  if (!req.user) redirect('/admin/login')
  const month = localDateKey().slice(0, 7)
  const [events, meetings, photos, flyers] = await Promise.all([
    req.payload.find({
      collection: 'events',
      req,
      overrideAccess: false,
      draft: true,
      sort: '-updatedAt',
      limit: 4,
      depth: 1,
    }),
    req.payload.find({
      collection: 'meetings',
      req,
      overrideAccess: false,
      draft: true,
      sort: 'name',
      limit: 0,
      depth: 0,
    }),
    req.payload.find({
      collection: 'galleryItems',
      req,
      overrideAccess: false,
      draft: true,
      sort: '-updatedAt',
      limit: 4,
      depth: 1,
    }),
    req.payload.find({
      collection: 'monthlyFlyers',
      req,
      overrideAccess: false,
      draft: true,
      where: { month: { equals: month } },
      limit: 1,
      depth: 1,
    }),
  ])
  const liveIDs = async (
    collection: 'events' | 'galleryItems' | 'monthlyFlyers',
    ids: number[],
  ) => {
    if (!ids.length) return new Set<number>()
    const result = await req.payload.find({
      collection,
      req,
      overrideAccess: false,
      draft: false,
      where: { and: [{ id: { in: ids } }, { _status: { equals: 'published' } }] },
      limit: ids.length,
      depth: 0,
      select: { updatedAt: true },
    })
    return new Set(result.docs.map((doc) => doc.id))
  }
  const [liveEvents, livePhotos, liveFlyers] = await Promise.all([
    liveIDs(
      'events',
      events.docs.map((doc) => doc.id),
    ),
    liveIDs(
      'galleryItems',
      photos.docs.map((doc) => doc.id),
    ),
    liveIDs(
      'monthlyFlyers',
      flyers.docs.map((doc) => doc.id),
    ),
  ])
  const flyer = flyers.docs[0]
  const flyerImage = flyer && typeof flyer.image === 'object' ? flyer.image : null
  const needsChecking = meetings.docs.filter(
    (meeting) => !meeting.checkedOn || meeting.sessions?.some((session) => !session.confirmed),
  ).length
  const status = (latest: string | null | undefined, live: boolean) =>
    latest === 'published'
      ? 'Published on website'
      : live
        ? 'Published version on website — draft changes waiting'
        : 'Draft — not on website'
  const tasks = [
    {
      title: 'Update this month’s flyer',
      text: flyer
        ? `${displayMonth(month)}: ${status(flyer._status, liveFlyers.has(flyer.id))}.`
        : `${displayMonth(month)} needs a flyer. Choose an image or a one-page Word document.`,
      href: flyer
        ? `/admin/collections/monthlyFlyers/${flyer.id}`
        : '/admin/collections/monthlyFlyers/create',
      image: flyerImage?.sizes?.small?.url || flyerImage?.url,
      publicHref: '/events',
      publicLabel: 'View Events page',
    },
    {
      title: 'Update dues reminder',
      text: 'Change the reminder shown on the About page.',
      href: '/admin/globals/clubSettings#field-logoImage',
      publicHref: '/about',
      publicLabel: 'View About page',
    },
    {
      title: 'Change a meeting',
      text: `${meetings.totalDocs} groups and club activities. ${needsChecking} need their schedule or format details checked.`,
      href: '/admin/collections/meetings',
      publicHref: '/meeting-schedule',
      publicLabel: 'View meeting schedule',
    },
    {
      title: 'Add photos',
      text: 'Choose a photo, check its preview, and publish it to the gallery.',
      href: '/admin/collections/galleryItems/create',
      publicHref: '/gallery',
      publicLabel: 'View Gallery',
    },
  ]
  const recent = [
    ...events.docs.map((doc) => ({
      id: `event-${doc.id}`,
      title: doc.title,
      status: status(doc._status, liveEvents.has(doc.id)),
      updated: doc.updatedAt,
      href: `/admin/collections/events/${doc.id}`,
    })),
    ...photos.docs.map((doc) => ({
      id: `photo-${doc.id}`,
      title: doc.title,
      status: status(doc._status, livePhotos.has(doc.id)),
      updated: doc.updatedAt,
      href: `/admin/collections/galleryItems/${doc.id}`,
    })),
  ]
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 6)
  return (
    <Gutter className="club-admin">
      <header className="club-admin__heading">
        <p>Serenity Club of Clearwater</p>
        <h1>Manage the website</h1>
        <p>
          Choose what you want to update. Save a draft to keep working privately; publish when it is
          ready for visitors.
        </p>
      </header>
      <div className="club-task-grid">
        {tasks.map((task) => (
          <section className="club-task" key={task.title}>
            <h2>
              <Link href={task.href}>{task.title}</Link>
            </h2>
            <p>{task.text}</p>
            {task.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={task.image}
                  alt="Current monthly flyer preview"
                  style={{
                    maxHeight: 220,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    marginBottom: 16,
                  }}
                />
              </>
            ) : null}
            <a href={task.publicHref} target="_blank" rel="noreferrer">
              {task.publicLabel} ↗
            </a>
          </section>
        ))}
      </div>
      <section className="club-panel">
        <h2>Continue editing</h2>
        {recent.length ? (
          <ul className="club-recent">
            {recent.map((doc) => (
              <li key={doc.id}>
                <Link href={doc.href}>{doc.title || 'Untitled draft'}</Link>
                <span>{doc.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent work yet. Choose a task above to get started.</p>
        )}
      </section>
      <section className="club-panel">
        <h2>Not sure where to edit?</h2>
        <p>
          <Link href="/admin/help">Find a section of the website or read a short task guide.</Link>
        </p>
      </section>
    </Gutter>
  )
}
