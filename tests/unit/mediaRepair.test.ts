import { expect, it } from 'vitest'
import { prepareMediaRepair, type MediaRepair } from '../../src/utilities/mediaRepair'

const repair: MediaRepair = { id: 45, changes: {
  original: { from: 'wrong-large.jpg', to: 'original.jpg', url: 'https://store.example/original.jpg' },
  sizes: { thumbnail: { from: 'missing-thumb.jpg', to: 'real-thumb.jpg', url: 'https://store.example/real-thumb.jpg' } },
} }

it('repairs filenames without replacing other media metadata', () => {
  expect(prepareMediaRepair({ filename: 'wrong-large.jpg', sizes: { thumbnail: { filename: 'missing-thumb.jpg' } } }, repair)).toEqual({ filename: 'original.jpg', sizes: { thumbnail: { filename: 'real-thumb.jpg' } } })
})
it('is safe to run again after a successful repair', () => {
  expect(prepareMediaRepair({ filename: 'original.jpg', sizes: { thumbnail: { filename: 'real-thumb.jpg' } } }, repair)).toEqual({})
})
it('refuses to overwrite a replaced image', () => {
  expect(() => prepareMediaRepair({ filename: 'new-upload.jpg' }, repair)).toThrow('changed since the audit')
})
