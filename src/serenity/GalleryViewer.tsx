'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { GalleryItem } from './content'

/** Only the open image is enlarged. Native dialog supplies focus containment and Escape behavior. */
export function GalleryViewer({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const [loadedURL, setLoadedURL] = useState<string>()
  const [failedURL, setFailedURL] = useState<string>()
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const photos = items.filter((item) => item.imageUrl)
  const opened = index !== null
  const current = index === null ? null : photos[index]
  useEffect(() => {
    if (!opened) return
    const element = dialog.current!
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!element.open) element.showModal()
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      opener.current?.focus()
    }
  }, [opened])
  const move = (direction: -1 | 1) =>
    setIndex((value) =>
      value === null ? null : Math.min(photos.length - 1, Math.max(0, value + direction)),
    )
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <figure
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            key={item.id || item.title}
          >
            {item.imageUrl ? (
              <a
                href={item.imageUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Enlarge ${item.title}`}
                className="block bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-900"
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                  event.preventDefault()
                  opener.current = event.currentTarget
                  setIndex(photos.indexOf(item))
                }}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt || item.title}
                  width={800}
                  height={600}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-[4/3] w-full object-contain"
                />
              </a>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-600">
                Photo unavailable
              </div>
            )}
            <figcaption className="p-5">
              <p className="text-sm font-semibold text-emerald-900">{item.category}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.title}</h2>
              {item.description ? (
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="club-gallery-dialog"
        aria-labelledby="gallery-viewer-title"
        onCancel={(event) => {
          event.preventDefault()
          setIndex(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            move(1)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            move(-1)
          }
        }}
      >
        {current ? (
          <div className="club-gallery-viewer">
            <header>
              <h2 id="gallery-viewer-title">{current.title}</h2>
              <button type="button" autoFocus onClick={() => setIndex(null)}>
                Close photos ×
              </button>
            </header>
            <div
              className="club-gallery-image"
              onTouchStart={(event) => {
                touch.current =
                  event.touches.length === 1
                    ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
                    : null
              }}
              onTouchEnd={(event) => {
                const start = touch.current
                touch.current = null
                if (!start || !event.changedTouches[0]) return
                const dx = event.changedTouches[0].clientX - start.x,
                  dy = event.changedTouches[0].clientY - start.y
                if (Math.abs(dx) > 60 && Math.abs(dy) < 60) move(dx < 0 ? 1 : -1)
              }}
            >
              {current.imageUrl &&
              loadedURL !== current.imageUrl &&
              failedURL !== current.imageUrl ? (
                <p role="status">Loading photo…</p>
              ) : null}
              {current.imageUrl && failedURL !== current.imageUrl ? (
                <Image
                  key={current.imageUrl}
                  src={current.imageUrl}
                  alt={current.imageAlt || current.title}
                  fill
                  sizes="(min-width: 1200px) 1200px, 100vw"
                  loading="eager"
                  onLoad={() => setLoadedURL(current.imageUrl)}
                  className="object-contain"
                  onError={() => setFailedURL(current.imageUrl)}
                />
              ) : (
                <p role="status">This preview could not load. Try opening the original below.</p>
              )}
            </div>
            <div className="club-gallery-caption">
              <p role="status" aria-live="polite">
                Photo {index! + 1} of {photos.length} on this page
              </p>
              {current.description ? <p>{current.description}</p> : null}
            </div>
            <footer>
              <button type="button" disabled={index === 0} onClick={() => move(-1)}>
                ← Previous photo
              </button>
              <a href={current.imageUrl} target="_blank" rel="noreferrer">
                Open original ↗
              </a>
              <button type="button" disabled={index === photos.length - 1} onClick={() => move(1)}>
                Next photo →
              </button>
            </footer>
            <p className="club-gallery-hint">
              Use the arrow keys or swipe to browse. Close to return to the same place in the
              gallery{index === photos.length - 1 ? ' or choose the next page of photos' : ''}.
            </p>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
