import type { CollectionConfig, Field, Plugin } from 'payload'
const everyday = new Set(['meetings', 'events', 'monthlyFlyers', 'galleryItems', 'albums', 'posts'])
const status: Field = {
  name: 'publicationHelp',
  type: 'ui',
  admin: { components: { Field: '@/admin/PublicationStatus' } },
}
const editing = (collection: CollectionConfig): CollectionConfig => {
  if (
    !everyday.has(collection.slug) ||
    typeof collection.versions !== 'object' ||
    !collection.versions.drafts
  )
    return collection
  const drafts = typeof collection.versions.drafts === 'object' ? collection.versions.drafts : {}
  return {
    ...collection,
    fields: [status, ...collection.fields],
    versions: {
      ...collection.versions,
      drafts: {
        ...drafts,
        validate: true,
        autosave: { interval: 2000, showSaveDraftButton: true },
      },
    },
  }
}
export const editorWorkflowPlugin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map(editing),
  globals: config.globals?.map((global) =>
    global.slug !== 'duesReminder'
      ? global
      : {
          ...global,
          fields: [status, ...global.fields],
          versions: {
            ...(typeof global.versions === 'object' ? global.versions : {}),
            drafts: { validate: true, autosave: { interval: 2000, showSaveDraftButton: true } },
          },
        },
  ),
})
