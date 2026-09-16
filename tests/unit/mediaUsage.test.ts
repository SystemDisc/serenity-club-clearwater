import { expect, it } from 'vitest'
import type { Field } from 'payload'
import { documentUsesMedia } from '../../src/utilities/media/usage'
const fields: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        name: 'layout',
        label: 'Layout',
        fields: [
          {
            name: 'cards',
            type: 'array',
            fields: [{ name: 'picture', type: 'upload', relationTo: 'media' }],
          },
        ],
      },
    ],
  },
  { name: 'content', type: 'richText' },
  { name: 'heroImageUrl', type: 'text' },
  {
    name: 'blocks',
    type: 'blocks',
    blocks: [{ slug: 'photo', fields: [{ name: 'media', type: 'upload', relationTo: 'media' }] }],
  },
]
it('finds media in schema fields, named tabs, array rows, blocks, rich text and copied URLs', () => {
  const urls = new Set(['/api/media/file/example.png'])
  for (const value of [
    { layout: { cards: [{ picture: 7 }] } },
    { blocks: [{ blockType: 'photo', media: { id: 7 } }] },
    { content: { root: { children: [{ type: 'upload', relationTo: 'media', value: 7 }] } } },
    {
      content: {
        root: { children: [{ type: 'block', fields: { blockType: 'mediaBlock', media: 7 } }] },
      },
    },
    { heroImageUrl: '/api/media/file/example.png?v=2' },
  ])
    expect(documentUsesMedia(fields, value, 7, urls)).toBe(true)
  expect(
    documentUsesMedia(
      fields,
      { id: 7, layout: { cards: [{ picture: 8 }] }, content: { text: '7' } },
      7,
      urls,
    ),
  ).toBe(false)
})
