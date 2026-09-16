import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

export default async function Dashboard({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  if (!req.user) redirect('/admin/login')
  const [events, meetings, photos] = await Promise.all([
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
  ])
  const tasks = [
    {
      title: 'Update this month’s flyer',
      text: 'Review a readable flyer and publish the right month.',
      href: '/admin/collections/events',
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
      text: `${meetings.totalDocs} recurring meeting records. Check the days, times, and formats.`,
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
      status: doc._status,
      updated: doc.updatedAt,
      href: `/admin/collections/events/${doc.id}`,
    })),
    ...photos.docs.map((doc) => ({
      id: `photo-${doc.id}`,
      title: doc.title,
      status: doc._status,
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
                <span>
                  {doc.status === 'published'
                    ? 'Published — check for unpublished changes in the editor'
                    : 'Draft — not on website'}
                </span>
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
