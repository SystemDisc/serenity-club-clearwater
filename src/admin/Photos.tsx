import type { AdminViewServerProps } from 'payload'
import { AdminPage } from './Help'
import PhotoWorkspace from './photos/PhotoWorkspace'
import { batchSnapshot } from '@/photoBatches/service'

export default async function Photos(props: AdminViewServerProps) {
  const { req } = props.initPageResult
  if (!req.user)
    return (
      <AdminPage {...props}>
        <p>Sign in to add photos.</p>
      </AdminPage>
    )
  const params = await props.searchParams
  const id = Number(params?.batch)
  const [recent, albums, initial] = await Promise.all([
    req.payload.find({
      collection: 'photoBatches',
      req,
      overrideAccess: false,
      sort: '-updatedAt',
      limit: 20,
      depth: 0,
    }),
    req.payload.find({
      collection: 'albums',
      req,
      overrideAccess: false,
      draft: true,
      sort: '-updatedAt',
      limit: 100,
      depth: 0,
    }),
    Number.isSafeInteger(id) && id > 0 ? batchSnapshot(req, id) : Promise.resolve(null),
  ])
  const selectedAlbum = Number(params?.album)
  if (
    Number.isSafeInteger(selectedAlbum) &&
    selectedAlbum > 0 &&
    !albums.docs.some((album) => album.id === selectedAlbum)
  ) {
    const selected = await req.payload.findByID({
      collection: 'albums',
      id: selectedAlbum,
      req,
      overrideAccess: false,
      draft: true,
      depth: 0,
    })
    albums.docs.push(selected)
  }
  return (
    <AdminPage {...props}>
      <h1>Add photos</h1>
      <p>Choose several photos, check their previews, then publish them together.</p>
      <PhotoWorkspace
        key={initial?.batch.id || 'new'}
        initial={initial}
        recent={recent.docs}
        albums={albums.docs}
        initialDestination={
          params?.destination === 'new' ? 'new' : params?.album ? 'existing' : 'main'
        }
        initialAlbum={Number(params?.album) || undefined}
      />
    </AdminPage>
  )
}
