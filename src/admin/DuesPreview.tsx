'use client'
import { useFormFields } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useState } from 'react'
import type { DuesReminder, ClubSetting, Media } from '@/payload-types'
import { localDateKey } from '@/serenity/calendar'
import { duesView } from '@/serenity/dues'
import { DuesNotice } from '@/serenity/DuesNotice'
import { useResource } from './useResource'

export default function DuesPreview() {
  const values = useFormFields(
    ([fields]) => reduceFieldsToValues(fields, true) as Partial<DuesReminder>,
  )
  const [nextMonth, setNextMonth] = useState(false)
  const [phone, setPhone] = useState(false)
  const artworkID = typeof values.artwork === 'object' ? values.artwork?.id : values.artwork
  const image = useResource<Media>(artworkID ? `/api/media/${artworkID}?depth=0` : null)
  const old = useResource<ClubSetting>(
    values.mode === 'legacy' ? '/api/globals/clubSettings?depth=1' : null,
  )
  const legacyImage =
    typeof old.value?.logoImage === 'object' ? old.value.logoImage?.url : old.value?.logoImageUrl
  const today = localDateKey()
  const next = new Date(`${today.slice(0, 7)}-01T12:00:00Z`)
  next.setUTCMonth(next.getUTCMonth() + 1)
  const notice = duesView(
    { ...values, artwork: image.value },
    nextMonth ? next.toISOString().slice(0, 10) : today,
  )
  return (
    <section className="club-panel club-admin">
      <h2>Preview on About</h2>
      <p>
        This shows your unsaved edits. Publish when the message is ready. Previous versions remain
        available in Versions.
      </p>
      <div className="club-preview-controls">
        <button type="button" aria-pressed={!nextMonth} onClick={() => setNextMonth(false)}>
          This month
        </button>
        <button type="button" aria-pressed={nextMonth} onClick={() => setNextMonth(true)}>
          Next month
        </button>
        <button type="button" aria-pressed={phone} onClick={() => setPhone(!phone)}>
          {phone ? 'Show computer width' : 'Show phone width'}
        </button>
      </div>
      {notice.expiredArt && values.artworkKind === 'monthly' ? (
        <p role="status">
          This month-specific artwork does not match the preview month and will be hidden.
        </p>
      ) : null}
      {notice.mode === 'off' ? <p>The dues reminder will not appear on About.</p> : null}
      {image.error || old.error ? <p role="alert">{image.error || old.error}</p> : null}
      <div style={{ maxWidth: phone ? 320 : 680, marginTop: 20 }}>
        <DuesNotice notice={notice} legacyImage={legacyImage || undefined} />
      </div>
      <p>
        Automatic months use Clearwater time. The public page refreshes as visitors load it,
        normally within five minutes plus regeneration time after a month changes.
      </p>
      <a href="/about" target="_blank" rel="noreferrer">
        Open the currently published About page ↗
      </a>
    </section>
  )
}
