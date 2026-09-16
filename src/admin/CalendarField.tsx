'use client'

import { useField, useFormInitializing, useFormProcessing } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

export default function CalendarField({
  field,
  path,
  readOnly,
  inputType,
}: TextFieldClientProps & { inputType: 'date' | 'time' | 'month' }) {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const busy = useFormProcessing()
  const initializing = useFormInitializing()
  const id = `field-${path.replaceAll('.', '-')}`
  return (
    <div className="field-type text club-calendar-field">
      <label htmlFor={id} className="field-label">
        {typeof field.label === 'string' ? field.label : field.name}
        {field.required ? ' *' : ''}
      </label>
      <input
        id={id}
        name={path}
        type={inputType}
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
