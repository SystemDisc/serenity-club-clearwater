import { createHash } from 'node:crypto'
import path from 'node:path'
import { APIError, type CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { convertSourceDocument } from '@/endpoints/convertSourceDocument'

export const sourceDocumentDirectory = path.resolve(process.cwd(), 'storage/source-documents')
export const MAX_SOURCE_BYTES = 4 * 1024 * 1024

export const SourceDocuments: CollectionConfig = {
  slug: 'sourceDocuments',
  labels: { singular: 'Original Word document', plural: 'Original Word documents' },
  admin: {
    useAsTitle: 'filename',
    group: 'Website details',
    hideAPIURL: true,
    description:
      'Retained originals for flyer versions. Upload a new original when replacing a flyer; previous originals stay available. Files in production Blob storage have public URLs.',
  },
  access: { create: authenticated, read: authenticated, update: () => false, delete: () => false },
  fields: [{ name: 'sha256', type: 'text', admin: { readOnly: true } }],
  upload: {
    staticDir: sourceDocumentDirectory,
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation !== 'create')
          throw new APIError(
            'Original documents are retained unchanged. Upload a new version instead.',
            400,
          )
        const file = req.file
        if (!file?.data?.length || file.size > MAX_SOURCE_BYTES)
          throw new APIError('Upload a one-page Word document no larger than 4 MB.', 400)
        if (file.data[0] !== 0x50 || file.data[1] !== 0x4b)
          throw new APIError(
            'This does not appear to be a Word document. Choose a .docx file.',
            400,
          )
        data.sha256 = createHash('sha256').update(file.data).digest('hex')
        return data
      },
    ],
  },
  endpoints: [{ path: '/:id/convert', method: 'post', handler: convertSourceDocument }],
}
