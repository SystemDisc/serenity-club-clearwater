import type { EventItem } from './content'
import community from './artwork/community.webp'
import pool from './artwork/pool.webp'
import board from './artwork/board.webp'
import bake from './artwork/bake.webp'
import movie from './artwork/movie.webp'
import paint from './artwork/paint.webp'
import blood from './artwork/blood.webp'
import halloween from './artwork/halloween.webp'

export const communityArtwork = community

// Keep event facts in accessible page text, outside the decorative illustrations.
const themes = [
  { title: /\bpool\b|\bbilliards?\b/i, image: pool },
  { title: /\bboard\b|\btrustees\b/i, image: board },
  { title: /\bbake\b|\bbaking\b/i, image: bake },
  { title: /\bmovie\b|\bcinema\b/i, image: movie },
  { title: /\bpaint\b|\bpainting\b/i, image: paint },
  { title: /\bblood drive\b/i, image: blood },
  { title: /\bhalloween\b/i, image: halloween },
  { title: /\bspeakers?\b/i, image: community },
]

export function getEventArtwork(event: EventItem) {
  if (event.coverImageUrl) {
    return { src: event.coverImageUrl, alt: event.imageAlt || event.title }
  }
  const theme = themes.find(({ title }) => title.test(event.title))
  if (theme) return { src: theme.image.src, alt: '' }
  if (event.imageUrl) return { src: event.imageUrl, alt: event.imageAlt || event.title }
  return { src: community.src, alt: '' }
}
