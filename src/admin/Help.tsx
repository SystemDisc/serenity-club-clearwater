import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export function AdminPage({
  children,
  ...props
}: AdminViewServerProps & { children: React.ReactNode }) {
  const {
    initPageResult: { req, locale, permissions, visibleEntities },
    params,
    searchParams,
  } = props
  if (!req.user) redirect('/admin/login')
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter className="club-admin">{children}</Gutter>
    </DefaultTemplate>
  )
}

export default function Help(props: AdminViewServerProps) {
  const sections = [
    ['Monthly flyer', '/admin/collections/monthlyFlyers', '/events'],
    ['Individual event announcements', '/admin/collections/events', '/events'],
    ['Meeting days, times, and details', '/admin/collections/meetings', '/meeting-schedule'],
    ['About-page dues reminder', '/admin/globals/clubSettings#field-logoImage', '/about'],
    ['Contact details, hours, and homepage pictures', '/admin/globals/clubSettings', '/reach-out'],
    ['Board and team', '/admin/collections/teamMembers', '/about'],
    ['Memberships and shop', '/admin/collections/products', '/shop'],
    ['Club rules', '/admin/collections/policies', '/policies'],
    ['Gallery photos', '/admin/collections/galleryItems', '/gallery'],
  ]
  return (
    <AdminPage {...props}>
      <h1>Help & website sections</h1>
      <p>Choose the part of the website you want to change.</p>
      <div className="club-task-grid">
        {sections.map(([title, edit, view]) => (
          <section className="club-task" key={title}>
            <h2>
              <Link href={edit}>{title}</Link>
            </h2>
            <a href={view} target="_blank" rel="noreferrer">
              View on website ↗
            </a>
          </section>
        ))}
      </div>
      <section className="club-panel">
        <h2>Save, check, publish</h2>
        <ol>
          <li>Open the item you want to change. Review its photo and wording.</li>
          <li>
            Use <strong>Save Draft</strong> to keep unfinished work private.
          </li>
          <li>
            Use <strong>Publish changes</strong> when it is ready. Wait for the result before trying
            again.
          </li>
          <li>Open the public page to check the result. No redeployment is needed.</li>
        </ol>
        <p>Use Versions in the editor to inspect earlier saved versions before restoring one.</p>
      </section>
      <section className="club-panel">
        <h2>Photos and files</h2>
        <p>
          Uploading to the photo library stores a file. Publishing a gallery photo is what adds it
          to the website. Files in the library have public URLs, even when a gallery entry is a
          draft.
        </p>
        <p>
          Use an image or a one-page Word document for a flyer. A Word file with more pages will be
          rejected rather than losing those pages.
        </p>
      </section>
      <section className="club-panel">
        <h2>Meeting details need confirmation</h2>
        <p>
          Check a change with the group before publishing it. Do not guess which days use a book
          study or discussion format.
        </p>
      </section>
      <section className="club-panel">
        <h2>Need help?</h2>
        <p>
          Contact the person who gave you website access. Tell them which screen you are on and what
          you were trying to do. Never send them your password.
        </p>
      </section>
    </AdminPage>
  )
}

export function Tools(props: AdminViewServerProps) {
  const { req, visibleEntities } = props.initPageResult
  if (!req.user) redirect('/admin/login')
  if (req.user.role !== 'admin') redirect('/admin')
  const labels: Record<string, string> = {
    pages: 'Additional custom pages',
    posts: 'News drafts — public launch pending',
    search: 'Generated search records',
    forms: 'Forms — no contact form is currently connected',
    'form-submissions': 'Form submissions — not the club email inbox',
    users: 'People with access',
    sponsors: 'Sponsor listings',
    categories: 'News categories',
    redirects: 'Website redirects',
    sourceDocuments: 'Retained original Word documents',
  }
  return (
    <AdminPage {...props}>
      <h1>Manager tools</h1>
      <p>
        Less frequent settings and advanced tools. Changing a menu or shared setting can affect
        multiple pages immediately.
      </p>
      <ul className="club-recent">
        {visibleEntities.collections
          .filter((slug) => labels[slug])
          .map((slug) => (
            <li key={slug}>
              <Link href={`/admin/collections/${slug}`}>{labels[slug]}</Link>
            </li>
          ))}
        {visibleEntities.globals
          .filter((slug) => ['header', 'footer'].includes(slug))
          .map((slug) => (
            <li key={slug}>
              <Link href={`/admin/globals/${slug}`}>
                {slug === 'header' ? 'Top menu' : 'Bottom menu'}
              </Link>
            </li>
          ))}
      </ul>
    </AdminPage>
  )
}
