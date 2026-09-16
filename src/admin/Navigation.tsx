import { DefaultNav } from '@payloadcms/next/rsc'
import type { PayloadRequest, ServerProps } from 'payload'

const everyday = new Set([
  'meetings',
  'events',
  'monthlyFlyers',
  'galleryItems',
  'media',
  'teamMembers',
  'products',
  'policies',
])

export default function Navigation(props: ServerProps & { req?: PayloadRequest }) {
  if (!props.visibleEntities) return null
  return (
    <DefaultNav
      {...props}
      visibleEntities={{
        collections: props.visibleEntities.collections.filter((slug) => everyday.has(slug)),
        globals: props.visibleEntities.globals.filter((slug) => slug === 'clubSettings'),
      }}
    />
  )
}
