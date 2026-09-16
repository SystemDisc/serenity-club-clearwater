'use client'
import { useField, useFormInitializing, useFormProcessing } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
const pages = [
  ['/', 'Home'],
  ['/meeting-schedule', 'Meeting schedule'],
  ['/events', 'Events & flyers'],
  ['/gallery', 'Gallery'],
  ['/about', 'About'],
  ['/ways-to-give', 'Ways to give'],
  ['/groups', 'Groups & facilities'],
  ['/reach-out', 'Contact the club'],
  ['/shop', 'Memberships & shop'],
  ['/policies', 'Club rules'],
  ['/posts', 'News & updates'],
]
export default function WebsiteLinkField({ path, readOnly }: TextFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const busy = useFormProcessing(),
    initializing = useFormInitializing()
  const id = `field-${path.replaceAll('.', '-')}`
  return (
    <div className="field-type text club-calendar-field">
      <label className="field-label" htmlFor={`${id}-page`}>
        Choose a club page
      </label>
      <select
        id={`${id}-page`}
        disabled={readOnly || busy || initializing}
        value={pages.some(([url]) => url === value) ? value : ''}
        onChange={(event) => setValue(event.target.value)}
      >
        <option value="">Another web address</option>
        {pages.map(([url, label]) => (
          <option key={url} value={url}>
            {label}
          </option>
        ))}
      </select>
      <label className="field-label" htmlFor={id}>
        Website address *
      </label>
      <input
        id={id}
        name={path}
        value={value || ''}
        readOnly={readOnly}
        disabled={busy || initializing}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
      />
      {showError ? (
        <p id={`${id}-error`} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
