'use client'

import { useField, useFormInitializing, useFormProcessing } from '@payloadcms/ui'
import type { SelectFieldClientProps } from 'payload'
import { WEEKDAYS } from '@/serenity/meetings'

export default function WeekdayField({ field, path, readOnly }: SelectFieldClientProps) {
  const { value = [], setValue, showError, errorMessage } = useField<string[]>({ path })
  const busy = useFormProcessing()
  const initializing = useFormInitializing()
  return (
    <fieldset className="club-weekdays" disabled={readOnly || busy || initializing}>
      <legend>{typeof field.label === 'string' ? field.label : 'Days with these details'}</legend>
      <div>
        {[...WEEKDAYS.slice(1), WEEKDAYS[0]].map((day) => (
          <label key={day}>
            <input
              type="checkbox"
              checked={value.includes(day)}
              onChange={(event) =>
                setValue(
                  event.target.checked
                    ? [...value, day]
                    : value.filter((selected) => selected !== day),
                )
              }
            />
            {day}
          </label>
        ))}
      </div>
      {showError ? <p role="alert">{errorMessage}</p> : null}
    </fieldset>
  )
}
