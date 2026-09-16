'use client'

import { useField, useFormProcessing } from '@payloadcms/ui'
import { useRef, useState } from 'react'
import type { SourceDocument } from '@/payload-types'
import { useResource } from './useResource'

async function responseJSON(response: Response) {
  const body = await response.json().catch(() => {
    throw new Error('The server could not accept this upload. Check the 4 MB limit and try again.')
  })
  if (!response.ok)
    throw new Error(
      body.errors?.[0]?.message ||
        body.message ||
        'The document could not be processed. Your original is retained; try again.',
    )
  return body
}

export default function WordFlyer() {
  const { value: source, setValue: setSource } = useField<number | SourceDocument | null>({
    path: 'sourceDocument',
  })
  const { setValue: setImage } = useField<number>({ path: 'image' })
  const id = typeof source === 'object' ? source?.id : source
  const { value: document } = useResource<SourceDocument>(
    id ? `/api/sourceDocuments/${id}?depth=0` : null,
  )
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const saving = useFormProcessing()
  const convert = async (sourceID: number) => {
    setMessage('Original retained. Creating a readable flyer image…')
    const result = await responseJSON(
      await fetch(`/api/sourceDocuments/${sourceID}/convert`, { method: 'POST' }),
    )
    setImage(result.image.id)
    setMessage(
      'Flyer image ready. Review the large preview, add its text details, then save a draft or publish. The original is retained separately.',
    )
  }
  const upload = async (file: File) => {
    if (file.size > 4 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.docx')) {
      setError(
        'Choose a one-page .docx Word file no larger than 4 MB. You can also upload an image above.',
      )
      return
    }
    setBusy(true)
    setError('')
    setMessage('Uploading the original Word document…')
    try {
      const body = new FormData()
      body.set('_payload', '{}')
      body.set('file', file)
      const result = await responseJSON(
        await fetch('/api/sourceDocuments', { method: 'POST', body }),
      )
      setSource(result.doc.id)
      await convert(result.doc.id)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The upload failed. Try again.')
      setMessage(
        'Save Draft to keep your work. If the original uploaded, retry its conversion below.',
      )
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  return (
    <section className="club-panel club-image-preview">
      <h2>Upload Word flyer</h2>
      <p>
        One-page .docx, up to 4 MB. The original stays unchanged; conversion creates a separate
        image. Use only material intended for the public website.
      </p>
      <label>
        Choose Word document{' '}
        <input
          ref={input}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy || saving}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
      </label>
      {id ? (
        <p>
          Original: {document?.filename || `Document ${id}`}{' '}
          {document?.url ? (
            <a href={document.url} target="_blank" rel="noreferrer">
              Download original ↗
            </a>
          ) : null}
        </p>
      ) : null}
      {id ? (
        <button
          type="button"
          disabled={busy || saving}
          onClick={async () => {
            setBusy(true)
            setError('')
            try {
              await convert(id)
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : 'Conversion failed. Try again.')
            } finally {
              setBusy(false)
            }
          }}
        >
          Create or retry flyer image
        </button>
      ) : null}
      <p role="status">{message}</p>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  )
}
