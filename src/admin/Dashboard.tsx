import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'
import { localDateKey } from '@/serenity/calendar'
import { duesView } from '@/serenity/dues'
import { displayMonth } from '@/serenity/flyers'

export default async function Dashboard({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  if (!req.user) redirect('/admin/login')
  const month = localDateKey().slice(0, 7)
  const [events, meetings, photos, flyers, dues, albums, news, batches] = await Promise.all([
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
    req.payload.findGlobal({
      slug: 'duesReminder',
      req,
      overrideAccess: false,
      draft: false,
      depth: 1,
    }),
    req.payload.find({
      collection: 'albums',
      req,
      overrideAccess: false,
      draft: true,
      sort: '-updatedAt',
      limit: 4,
      depth: 1,
    }),
    req.payload.find({
      collection: 'posts',
      req,
      overrideAccess: false,
      draft: true,
      sort: '-updatedAt',
      limit: 4,
      depth: 0,
    }),
    req.payload.find({
      collection: 'photoBatches',
      req,
      overrideAccess: false,
      where: { state: { equals: 'reviewing' } },
      sort: '-updatedAt',
      limit: 6,
      depth: 0,
    }),
  ])
  const liveIDs = async (
    collection: 'events' | 'galleryItems' | 'monthlyFlyers' | 'albums' | 'posts',
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
  const [liveEvents, livePhotos, liveFlyers, liveAlbums, liveNews] = await Promise.all([
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
    liveIDs(
      'albums',
      albums.docs.map((doc) => doc.id),
    ),
    liveIDs(
      'posts',
      news.docs.map((doc) => doc.id),
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
  const reminder = duesView(dues._status === 'published' ? dues : null)
  const reminderStatus =
    reminder.mode === 'legacy'
      ? 'The earlier poster is still in use. Check its month or switch to an automatic text reminder.'
      : reminder.mode === 'off'
        ? 'The reminder is turned off.'
        : `${reminder.heading}.${reminder.expiredArt ? ' Old artwork is hidden; choose new artwork if wanted.' : ''}`
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
      text: reminderStatus,
      href: '/admin/globals/duesReminder',
      publicHref: '/about',
      publicLabel: 'View About page',
    },
    {
      title: 'Change a meeting',
      text: `${meetings.totalDocs} groups and club activities. ${needsChecking} need their schedule or format details checked.`,
      href: '/admin/meetings',
      publicHref: '/meeting-schedule',
      publicLabel: 'View meeting schedule',
    },
    {
      title: 'Add photos',
      text: batches.totalDocs
        ? `${batches.totalDocs} saved photo batches are waiting to finish. Choose one below or add more photos.`
        : 'Choose many photos, review, and publish together.',
      href: '/admin/photos',
      publicHref: '/gallery',
      publicLabel: 'View Gallery',
    },
  ]
  tasks.push({
    title: 'Create an album',
    text: 'Group an event’s photos together, use a collage or choose a cover photo, and publish the album.',
    href: '/admin/photos?destination=new',
    publicHref: '/gallery',
    publicLabel: 'View Gallery',
  })
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
    ...albums.docs.map((doc) => ({
      id: `album-${doc.id}`,
      title: doc.title,
      status: status(doc._status, liveAlbums.has(doc.id)),
      updated: doc.updatedAt,
      href: `/admin/collections/albums/${doc.id}`,
    })),
    ...news.docs.map((doc) => ({
      id: `news-${doc.id}`,
      title: doc.title,
      status: status(doc._status, liveNews.has(doc.id)),
      updated: doc.updatedAt,
      href: `/admin/collections/posts/${doc.id}`,
    })),
    ...flyers.docs.map((doc) => ({
      id: `flyer-${doc.id}`,
      title: `${displayMonth(doc.month)} flyer`,
      status: status(doc._status, liveFlyers.has(doc.id)),
      updated: doc.updatedAt,
      href: `/admin/collections/monthlyFlyers/${doc.id}`,
    })),
  ]
    .filter((doc) => !!doc.title)
    .sort((a, b) => b.updated.localeCompare(a.updated))
  const drafts = recent.filter((doc) => doc.status !== 'Published on website').slice(0, 6)
  const published = recent.filter((doc) => doc.status === 'Published on website').slice(0, 6)
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
        <h2>{displayMonth(month)} — things to check</h2>
        <ul className="club-recent">
          <li>
            <Link href={tasks[0].href}>This month’s flyer</Link>
            <span>
              {liveFlyers.size
                ? 'Published for this month'
                : 'Needs attention — no published flyer for this month'}
            </span>
          </li>
          <li>
            <Link href="/admin/globals/duesReminder">Dues reminder</Link>
            <span>{reminderStatus}</span>
          </li>
          <li>
            <Link href="/admin/meetings">Meeting details</Link>
            <span>
              {needsChecking
                ? `${needsChecking} groups or activities need confirmation`
                : 'Saved schedules have been checked; review any new changes with the group.'}
            </span>
          </li>
        </ul>
      </section>
      {batches.docs.length ? (
        <section className="club-panel">
          <h2>Finish adding photos</h2>
          <p>
            Your completed uploads are saved. Reopening a batch shows which photos need attention.
          </p>
          <ul className="club-recent">
            {batches.docs.map((batch) => (
              <li key={batch.id}>
                <Link href={`/admin/photos?batch=${batch.id}`}>{batch.title}</Link>
                <span>Review or resume</span>
              </li>
            ))}
          </ul>
          {batches.totalDocs > batches.docs.length ? (
            <Link href="/admin/photos">More saved batches</Link>
          ) : null}
        </section>
      ) : null}
      <section className="club-panel">
        <h2>Continue editing</h2>
        {drafts.length ? (
          <ul className="club-recent">
            {drafts.map((doc) => (
              <li key={doc.id}>
                <Link href={doc.href}>{doc.title}</Link>
                <span>{doc.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent unfinished drafts. Choose a task above to get started.</p>
        )}
      </section>
      <section className="club-panel">
        <h2>Recently published</h2>
        <ul className="club-recent">
          {published.map((doc) => (
            <li key={doc.id}>
              <Link href={doc.href}>{doc.title}</Link>
              <span>{doc.status}</span>
            </li>
          ))}
        </ul>
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
