import { DefaultNav } from '@payloadcms/next/rsc'
import type { PayloadRequest, ServerProps } from 'payload'

const everyday = new Set([
  'meetings',
  'events',
  'posts',
  'monthlyFlyers',
  'galleryItems',
  'albums',
  'media',
  'teamMembers',
  'products',
  'policies',
  'sponsors',
])

export default function Navigation(props: ServerProps & { req?: PayloadRequest }) {
  if (!props.visibleEntities) return null
  return (
    <DefaultNav
      {...props}
      visibleEntities={{
        collections: props.visibleEntities.collections.filter((slug) => everyday.has(slug)),
        globals: props.visibleEntities.globals.filter((slug) =>
          ['clubSettings', 'duesReminder'].includes(slug),
        ),
      }}
    />
  )
}
