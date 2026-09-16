import type { Access, CollectionBeforeChangeHook, CollectionBeforeDeleteHook } from 'payload'

export const isAdmin = (user: { role?: string | null } | null | undefined): boolean => user?.role === 'admin'
export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const adminOrSelf: Access = ({ req }) => isAdmin(req.user) || (req.user ? { id: { equals: req.user.id } } : false)

export const protectUserRole: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation === 'create') {
    const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
    if (totalDocs === 0) data.role = 'admin'
  }
  if (originalDoc?.role === 'admin' && req.user?.id === originalDoc.id && data.role && data.role !== 'admin') {
    throw new Error('Another administrator must change your administrator role.')
  }
  return data
}
export const preventSelfDeletion: CollectionBeforeDeleteHook = ({ id, req }) => {
  if (req.user?.id === id) throw new Error('You cannot delete your own administrator account.')
}
