import { APIError, type Field, type PayloadRequest, type CollectionSlug } from 'payload'

type RecordValue = Record<string, unknown>
export type MediaUse = { title: string; href: string; location: string }
const object = (value: unknown): RecordValue =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordValue) : {}
const referenceID = (value: unknown) => (typeof value === 'object' ? object(value).id : value)
const normalizeURL = (value: string) => {
  try {
    return decodeURIComponent(value.split(/[?#]/)[0])
  } catch {
    return value.split(/[?#]/)[0]
  }
}

function richTextUses(value: unknown, id: number): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some((entry) => richTextUses(entry, id))
  const node = object(value)
  if (node.relationTo === 'media' && referenceID(node.value) === id) return true
  // Payload's media block fields are embedded within Lexical block nodes.
  if (node.blockType === 'mediaBlock' && referenceID(node.media) === id) return true
  return Object.values(node).some((entry) => richTextUses(entry, id))
}

export function hasMediaFields(fields: Field[]): boolean {
  return fields.some(
    (field) =>
      ((field.type === 'upload' || field.type === 'relationship') &&
        (field.relationTo === 'media' ||
          (Array.isArray(field.relationTo) && field.relationTo.includes('media')))) ||
      field.type === 'richText' ||
      (field.type === 'text' && /(?:image|artwork|cover).*url/i.test(field.name)) ||
      ('fields' in field && hasMediaFields(field.fields)) ||
      (field.type === 'tabs' && field.tabs.some((tab) => hasMediaFields(tab.fields))) ||
      (field.type === 'blocks' &&
        field.blocks.some((block) => typeof block !== 'string' && hasMediaFields(block.fields))),
  )
}

export function documentUsesMedia(
  fields: Field[],
  data: unknown,
  id: number,
  urls: Set<string>,
): boolean {
  const doc = object(data)
  return fields.some((field) => {
    const value = 'name' in field && field.name ? doc[field.name] : doc
    if (field.type === 'upload' || field.type === 'relationship') {
      const entries = Array.isArray(value) ? value : [value]
      return entries.some((entry) =>
        typeof field.relationTo === 'string'
          ? field.relationTo === 'media' && referenceID(entry) === id
          : object(entry).relationTo === 'media' && referenceID(object(entry).value) === id,
      )
    }
    if (field.type === 'richText') return richTextUses(value, id)
    if (field.type === 'text' && typeof value === 'string' && urls.has(normalizeURL(value)))
      return true
    if (field.type === 'tabs')
      return field.tabs.some((tab) =>
        documentUsesMedia(tab.fields, 'name' in tab && tab.name ? doc[tab.name] : doc, id, urls),
      )
    if (field.type === 'blocks' && Array.isArray(value))
      return value.some((row) => {
        const block = field.blocks.find(
          (candidate) => typeof candidate !== 'string' && candidate.slug === object(row).blockType,
        )
        return block && typeof block !== 'string'
          ? documentUsesMedia(block.fields, row, id, urls)
          : false
      })
    if ('fields' in field)
      return field.type === 'array' && Array.isArray(value)
        ? value.some((row) => documentUsesMedia(field.fields, row, id, urls))
        : documentUsesMedia(field.fields, value, id, urls)
    return false
  })
}

/** Integrity scan includes retained versions and trash, so restoring content cannot resurrect broken files.
 * Read-only override is deliberate: access-filtered results would hide references from the guard.
 * The endpoint and delete hooks authenticate before calling this function.
 */
export async function findMediaUses(req: PayloadRequest, id: number): Promise<MediaUse[]> {
  const media = await req.payload.findByID({
    collection: 'media',
    id,
    req,
    overrideAccess: true,
    trash: true,
    depth: 0,
  })
  const urls = new Set(
    [
      media.url,
      ...Object.values(media.sizes || {}).map((size) => size?.url),
      media.filename ? `/api/media/file/${encodeURIComponent(media.filename)}` : null,
    ]
      .filter((url): url is string => !!url)
      .map(normalizeURL),
  )
  const uses: MediaUse[] = []
  const add = (doc: unknown, href: string, location: string) => {
    const data = object(doc)
    if (!uses.some((use) => use.href === href && use.location === location))
      uses.push({
        title: String(data.title || data.name || data.month || location),
        href,
        location,
      })
  }
  for (const collection of req.payload.config.collections) {
    if (collection.slug === 'media' || !hasMediaFields(collection.fields)) continue
    const slug = collection.slug as CollectionSlug
    const label = typeof collection.labels.singular === 'string' ? collection.labels.singular : slug
    for (let page = 1; ; page++) {
      if (page > 100)
        throw new APIError(
          'The file-use check reached its safety limit. Keep the file and ask the website manager to review retained content.',
          409,
          undefined,
          true,
        )
      const result = await req.payload.find({
        collection: slug,
        req,
        overrideAccess: true,
        trash: true,
        depth: 0,
        page,
        limit: 100,
        sort: 'id',
      })
      for (const doc of result.docs)
        if (documentUsesMedia(collection.fields, doc, id, urls))
          add(doc, `/admin/collections/${slug}/${doc.id}`, `${label} — saved content`)
      if (!result.hasNextPage || uses.length >= 20) break
    }
    if (collection.versions && uses.length < 20) {
      for (let page = 1; ; page++) {
        if (page > 100)
          throw new APIError(
            'The file-use check reached its safety limit. Keep the file and ask the website manager to review retained versions.',
            409,
            undefined,
            true,
          )
        const result = await req.payload.findVersions({
          collection: slug,
          req,
          overrideAccess: true,
          trash: true,
          depth: 0,
          page,
          limit: 100,
          sort: '-updatedAt',
        })
        for (const version of result.docs)
          if (documentUsesMedia(collection.fields, version.version, id, urls))
            add(
              version.version,
              `/admin/collections/${slug}/${referenceID(version.parent)}/versions`,
              `${label} — previous or draft version`,
            )
        if (!result.hasNextPage || uses.length >= 20) break
      }
    }
    if (uses.length >= 20) break
  }
  if (uses.length < 20)
    for (const global of req.payload.config.globals) {
      if (!hasMediaFields(global.fields)) continue
      const doc = await req.payload.findGlobal({
        slug: global.slug,
        req,
        overrideAccess: true,
        depth: 0,
      })
      if (documentUsesMedia(global.fields, doc, id, urls))
        add(doc, `/admin/globals/${global.slug}`, `${global.label || global.slug} — saved content`)
      if (global.versions) {
        for (let page = 1; ; page++) {
          if (page > 100)
            throw new APIError(
              'The file-use check reached its safety limit. Keep the file and ask the website manager to review retained versions.',
              409,
              undefined,
              true,
            )
          const result = await req.payload.findGlobalVersions({
            slug: global.slug,
            req,
            overrideAccess: true,
            depth: 0,
            page,
            limit: 100,
            sort: '-updatedAt',
          })
          for (const version of result.docs)
            if (documentUsesMedia(global.fields, version.version, id, urls))
              add(
                version.version,
                `/admin/globals/${global.slug}/versions`,
                `${global.label || global.slug} — previous or draft version`,
              )
          if (!result.hasNextPage || uses.length >= 20) break
        }
      }
      if (uses.length >= 20) break
    }
  return uses
}

export async function requireUnusedMedia(req: PayloadRequest, id: number) {
  const uses = await findMediaUses(req, id)
  if (uses.length)
    throw new APIError(
      `This file is still used by ${uses[0].title} (${uses[0].location}). Keep it so saved content and previous versions can be restored. Upload a separate file to replace a picture.`,
      409,
      undefined,
      true,
    )
}
