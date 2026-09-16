import type { TextField } from 'payload'
import { validDateKey, validLocalTime } from '@/serenity/calendar'

export function calendarField(
  name: string,
  label: string,
  inputType: 'date' | 'time',
  required = false,
): TextField {
  return {
    name,
    label,
    type: 'text',
    required,
    validate: (value) =>
      !value ||
      (inputType === 'date' ? validDateKey(value) : validLocalTime(value)) ||
      `Choose a valid ${inputType}.`,
    admin: { components: { Field: { path: '@/admin/CalendarField', clientProps: { inputType } } } },
  }
}
