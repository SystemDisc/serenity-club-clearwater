'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'
import { useResource } from './useResource'
import type { MediaUse } from '@/utilities/media/usage'

export default function MediaUsage() {
  const { id } = useDocumentInfo()
  const [checked, setChecked] = useState(false)
  const result = useResource<{ uses: MediaUse[]; limited: boolean }>(
    id && checked ? `/api/media/${id}/usage` : null,
  )
  if (!id) return null
  return (
    <section className="club-panel club-admin">
      <h2>Where this file is used</h2>
      <p>
        Removing a gallery photo keeps its shared file. Files used in saved content, trash, or
        previous versions cannot be deleted or replaced. Upload a separate file when changing a
        picture.
      </p>
      {!checked ? (
        <button type="button" onClick={() => setChecked(true)}>
          Check where this file is used
        </button>
      ) : result.loading ? (
        <p role="status">Checking saved content and previous versions…</p>
      ) : result.error ? (
        <p role="alert">{result.error}</p>
      ) : result.value?.uses.length ? (
        <>
          <ul>
            {result.value.uses.map((use) => (
              <li key={`${use.href}-${use.location}`}>
                <a href={use.href}>{use.title}</a> — {use.location}
              </li>
            ))}
          </ul>
          {result.value.limited ? <p>Showing the first 20 uses.</p> : null}
        </>
      ) : (
        <p>
          No saved content or previous versions currently use this file. The manager can move it to
          Trash; its file is retained until permanently deleted.
        </p>
      )}
    </section>
  )
}
