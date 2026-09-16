'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import type { TextFieldClientProps } from 'payload'
import type { Schedule } from '@/serenity/schedule'
import { sessionDescription } from '@/serenity/schedule'

export default function SessionReference({ field, path, readOnly }: TextFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const sessions = useFormFields(
    ([fields]) => (reduceFieldsToValues(fields, true) as Schedule).sessions || [],
  )
  const id = `field-${path.replaceAll('.', '-')}`
  const options = sessions.filter(
    (session) => !path.endsWith('.replaces') || session.recurrence === 'weekly',
  )
  return (
    <div className="field-type text club-calendar-field">
      <label htmlFor={id} className="field-label">
        {typeof field.label === 'string' ? field.label : field.name}
      </label>
      <select
        id={id}
        name={path}
        value={value || ''}
        disabled={readOnly}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={showError}
      >
        <option value="">
          {field.required ? 'Choose a session' : 'Additional session — does not replace another'}
        </option>
        {options.map((session, index) => (
          <option key={session.key || index} value={session.key}>
            {session.label || sessionDescription(session)}
          </option>
        ))}
      </select>
      {showError ? <p role="alert">{errorMessage}</p> : null}
    </div>
  )
}
