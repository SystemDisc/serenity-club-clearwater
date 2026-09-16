import type { AdminViewServerProps } from 'payload'
import { AdminPage } from './Help'
import GalleryOrganizerClient from './photos/GalleryOrganizerClient'
import { redirect } from 'next/navigation'

export default async function GalleryOrganizer(props: AdminViewServerProps) {
  const { req } = props.initPageResult
  if (!req.user) redirect('/admin/login')
  const params = await props.searchParams
  const albumID = Number(params?.album) || null
  const albums = await req.payload.find({
    collection: 'albums',
    req,
    overrideAccess: false,
    draft: true,
    depth: 0,
    sort: '-updatedAt',
    limit: 100,
  })
  if (albumID && !albums.docs.some((album) => album.id === albumID)) {
    albums.docs.push(
      await req.payload.findByID({
        collection: 'albums',
        id: albumID,
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
      }),
    )
  }
  return (
    <AdminPage {...props}>
      <h1>Organize gallery photos</h1>
      <p>
        Move existing photos, change their order, or remove them from the website. Their shared
        library files are retained.
      </p>
      <GalleryOrganizerClient initialAlbum={albumID} albums={albums.docs} />
    </AdminPage>
  )
}
