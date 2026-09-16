import { expect, it } from 'vitest'
import { documentPath, validatePageSlug } from '../../src/utilities/pagePaths'
it('reserves built-in routes and rejects nested or invalid page slugs', () => {
  for (const slug of ['gallery', 'home', 'about', 'shop', 'api', '../admin', 'gallery/photos', '']) expect(validatePageSlug(slug)).not.toBe(true)
  expect(validatePageSlug('club-history')).toBe(true)
})
it('constructs collection-specific canonical paths', () => {
  expect(documentPath('club-history')).toBe('/club-history')
  expect(documentPath('news', 'posts')).toBe('/posts/news')
  expect(documentPath('home')).toBe('/')
})
