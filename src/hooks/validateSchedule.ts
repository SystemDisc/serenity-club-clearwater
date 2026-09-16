import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import { scheduleErrors, type Schedule } from '@/serenity/schedule'

export const validateSchedule: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if ((data._status ?? originalDoc?._status) !== 'published') return data
  const schedule = { ...originalDoc, ...data } as Schedule
  const errors = scheduleErrors(schedule)
  if (!schedule.sessions?.length)
    errors.unshift('Add at least one session with days and a start time before publishing.')
  if (errors.length)
    throw new ValidationError({
      collection: 'meetings',
      req,
      errors: [{ path: 'sessions', message: errors.join(' ') }],
    })
  return data
}
