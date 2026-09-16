import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ path: vi.fn(), tag: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.path, revalidateTag: mocks.tag }))
import { queuePublicChange, withPublicMutation } from '../../src/utilities/publicCache'

beforeEach(() => {
  vi.clearAllMocks()
})

it('waits until the mutation completes and coalesces a batch', async () => {
  await withPublicMutation(async () => {
    queuePublicChange({ collection: 'galleryItems', id: 1 })
    queuePublicChange({ collection: 'galleryItems', id: 2 })
    expect(mocks.path).not.toHaveBeenCalled()
    await Promise.resolve() // Payload completes its transaction before returning.
  })
  expect(mocks.tag).toHaveBeenCalledExactlyOnceWith('public-galleryItems', { expire: 0 })
  expect(mocks.path).toHaveBeenCalledWith('/gallery', 'page')
  expect(mocks.path).not.toHaveBeenCalledWith('/', 'layout')
})

it('invalidates both sides of a published slug rename and the sitemap', async () => {
  await withPublicMutation(async () =>
    queuePublicChange({ collection: 'products', slug: 'new', previousSlug: 'old' }),
  )
  expect(mocks.path).toHaveBeenCalledWith('/shop/old', 'page')
  expect(mocks.path).toHaveBeenCalledWith('/shop/new', 'page')
  expect(mocks.tag).toHaveBeenCalledWith('products-sitemap', { expire: 0 })
})

it('invalidates shared media dependencies across public pages', async () => {
  await withPublicMutation(async () => queuePublicChange({ collection: 'media', id: 1 }))
  expect(mocks.tag).toHaveBeenCalledWith('public-media', { expire: 0 })
  expect(mocks.path).toHaveBeenCalledWith('/', 'layout')
})

it('preserves a committed save result when invalidation fails and logs the failure', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.tag.mockImplementationOnce(() => {
    throw new Error('cache unavailable')
  })
  const result = await withPublicMutation(async () => {
    queuePublicChange({ collection: 'galleryItems' })
    return { id: 2 }
  })
  expect(result).toEqual({ id: 2 })
  expect(error).toHaveBeenCalledWith(expect.stringContaining('public-revalidation-failed'))
  error.mockRestore()
})
