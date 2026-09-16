'use client'

import { useField, useFormInitializing, useFormProcessing } from '@payloadcms/ui'
import type { SelectFieldClientProps } from 'payload'

/** Native named controls for the club's small, fixed choice lists. Relationships retain Payload's picker. */
export default function SimpleSelectField({ field, path, readOnly }: SelectFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<string | null>({ path })
  const busy = useFormProcessing()
  const initializing = useFormInitializing()
  const id = `field-${path.replaceAll('.', '-')}-select`
  const description = typeof field.admin?.description === 'string' ? field.admin.description : ''
  return (
    <div className="field-type select club-calendar-field">
      <label className="field-label" htmlFor={id}>
        {typeof field.label === 'string' ? field.label : field.name}
        {field.required ? ' *' : ''}
      </label>
      <select
        id={id}
        name={path}
        value={value || ''}
        disabled={readOnly || busy || initializing}
        onChange={(event) => setValue(event.target.value || null)}
        aria-invalid={showError}
        aria-describedby={
          [description && `${id}-description`, showError && `${id}-error`]
            .filter(Boolean)
            .join(' ') || undefined
        }
      >
        <option value="">{field.required ? 'Choose an option' : 'Not selected'}</option>
        {field.options.map((option) =>
          typeof option === 'string' ? (
            <option key={option} value={option}>
              {option}
            </option>
          ) : (
            <option key={option.value} value={option.value}>
              {typeof option.label === 'string' ? option.label : option.value}
            </option>
          ),
        )}
      </select>
      {description ? (
        <p className="field-description" id={`${id}-description`}>
          {description}
        </p>
      ) : null}
      {showError ? (
        <p id={`${id}-error`} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
