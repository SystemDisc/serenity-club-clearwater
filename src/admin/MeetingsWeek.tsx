import type { AdminViewServerProps } from 'payload'
import { AdminPage } from './Help'
import MeetingsAgenda from './MeetingsAgenda'

export default async function MeetingsWeek(props: AdminViewServerProps) {
  const { req } = props.initPageResult
  // AdminPage handles the redirect; never query private records before authentication.
  if (!req.user)
    return (
      <AdminPage {...props}>
        <p>Sign in to manage meetings.</p>
      </AdminPage>
    )
  const meetings = await req.payload.find({
    collection: 'meetings',
    req,
    overrideAccess: false,
    draft: true,
    depth: 0,
    pagination: false,
    limit: 0,
    sort: 'name',
  })
  return (
    <AdminPage {...props}>
      <h1>Change a meeting</h1>
      <p>
        Find a group, then open its schedule to correct one day, time, format, or date. This
        overview includes the latest saved drafts; check publication status before expecting changes
        on the website.
      </p>
      <MeetingsAgenda meetings={meetings.docs} />
    </AdminPage>
  )
}
