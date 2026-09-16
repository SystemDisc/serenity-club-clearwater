import { Forbidden, type Access, type AccessResult, type Plugin } from 'payload'
import { isAdmin } from '@/access/users'
import { findMediaUses, requireUnusedMedia } from '@/utilities/media/usage'

const recoverable = new Set([
  'pages',
  'posts',
  'meetings',
  'events',
  'galleryItems',
  'albums',
  'monthlyFlyers',
  'teamMembers',
  'products',
  'policies',
  'sponsors',
  'media',
])
const trashOrAdmin: Access = ({ req, data }) =>
  !!req.user && (!!data?.deletedAt || isAdmin(req.user))

export const recoveryPlugin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((collection) => {
    if (!recoverable.has(collection.slug)) return collection
    const media = collection.slug === 'media'
    const originalRead = collection.access?.read
    return {
      ...collection,
      trash: true,
      access: {
        ...collection.access,
        delete: media ? ({ req }) => isAdmin(req.user) : trashOrAdmin,
        read: async (args): Promise<AccessResult> => {
          const result = originalRead ? await originalRead(args) : !!args.req.user
          if (args.req.user || result === false) return result
          return result === true
            ? { deletedAt: { exists: false } }
            : { and: [result, { deletedAt: { exists: false } }] }
        },
      },
      ...(media
        ? {
            fields: [
              ...collection.fields,
              {
                name: 'fileUsage',
                type: 'ui' as const,
                admin: { components: { Field: '@/admin/MediaUsage' } },
              },
            ],
            endpoints: [
              ...(collection.endpoints || []),
              {
                path: '/:id/usage',
                method: 'get' as const,
                handler: async (req) => {
                  if (!req.user) throw new Forbidden()
                  const uses = await findMediaUses(req, Number(req.routeParams?.id))
                  return Response.json({ uses, limited: uses.length >= 20 })
                },
              },
            ],
            hooks: {
              ...collection.hooks,
              beforeDelete: [
                ...(collection.hooks?.beforeDelete || []),
                async ({ id, req }) => {
                  await requireUnusedMedia(req, Number(id))
                },
              ],
              beforeChange: [
                ...(collection.hooks?.beforeChange || []),
                async ({ data, originalDoc, req }) => {
                  if (originalDoc?.id && ((data.deletedAt && !originalDoc.deletedAt) || req.file))
                    await requireUnusedMedia(req, originalDoc.id)
                  return data
                },
              ],
            },
          }
        : {}),
    }
  }),
})
