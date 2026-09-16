import type { Access, CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { batchAction, startBatch } from '@/photoBatches/service'
export const batchWrite: Access = ({ req }) => !!req.user && req.context.photoBatchAction === true
export const PhotoBatches: CollectionConfig = {
  slug: 'photoBatches',
  labels: { singular: 'Photo upload batch', plural: 'Photo upload batches' },
  admin: { hidden: true, useAsTitle: 'title' },
  access: { create: batchWrite, update: batchWrite, read: authenticated, delete: () => false },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'date', type: 'text' },
    { name: 'album', type: 'relationship', relationTo: 'albums' },
    { name: 'albumRevision', type: 'text' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
    { name: 'revision', type: 'number', required: true, defaultValue: 0 },
    {
      name: 'state',
      type: 'select',
      required: true,
      defaultValue: 'reviewing',
      options: ['reviewing', 'published'],
    },
  ],
  endpoints: [
    { path: '/start', method: 'post', handler: startBatch },
    { path: '/:id/action', method: 'post', handler: batchAction },
  ],
}
export const PhotoBatchItems: CollectionConfig = {
  slug: 'photoBatchItems',
  admin: { hidden: true, useAsTitle: 'filename' },
  access: { create: batchWrite, update: batchWrite, read: authenticated, delete: () => false },
  indexes: [{ fields: ['batch', 'fingerprint'], unique: true }],
  fields: [
    {
      name: 'batch',
      type: 'relationship',
      relationTo: 'photoBatches',
      required: true,
      index: true,
    },
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'fingerprint', type: 'text', required: true },
    { name: 'filename', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'caption', type: 'textarea' },
    { name: 'alt', type: 'textarea' },
    { name: 'position', type: 'number', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'ready', 'error', 'excluded', 'published'],
    },
    { name: 'error', type: 'text' },
    { name: 'receipt', type: 'json' },
    { name: 'media', type: 'upload', relationTo: 'media' },
    { name: 'photoRevision', type: 'text' },
    { name: 'photo', type: 'relationship', relationTo: 'galleryItems', unique: true },
  ],
}
