import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import { validDateKey, validLocalTime } from '@/serenity/calendar'

export const validateEvent: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if ((data._status ?? originalDoc?._status) !== 'published') return data
  const event = { ...originalDoc, ...data }
  const errors: { path: string; message: string }[] = []
  if (event.kind === 'dated') {
    if (!validDateKey(event.date))
      errors.push({ path: 'date', message: 'Choose the event date before publishing.' })
    if (event.endDate && (!validDateKey(event.endDate) || event.endDate < event.date))
      errors.push({ path: 'endDate', message: 'The last day must be on or after the first day.' })
    if (event.timeMode === 'known' && !validLocalTime(event.startTime))
      errors.push({
        path: 'startTime',
        message: 'Choose a start time, or select “Time not announced”.',
      })
    if (
      event.timeMode === 'known' &&
      event.endTime &&
      (!validLocalTime(event.endTime) ||
        ((!event.endDate || event.endDate === event.date) && event.endTime <= event.startTime))
    )
      errors.push({
        path: 'endTime',
        message:
          'Choose an end time after the start time. For an overnight event, set the last day too.',
      })
  }
  if (event.kind === 'meeting') {
    const id = typeof event.meeting === 'object' ? event.meeting?.id : event.meeting
    const meeting = id
      ? await req.payload.findByID({
          collection: 'meetings',
          id,
          req,
          overrideAccess: false,
          depth: 0,
          disableErrors: true,
          draft: false,
        })
      : null
    if (!meeting || meeting._status !== 'published' || !meeting.sessions?.length)
      errors.push({
        path: 'meeting',
        message:
          'Choose a published meeting with a structured schedule. Its next dates and times will be used automatically.',
      })
  }
  if (event.url) {
    try {
      const url = new URL(event.url)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
        throw new Error()
    } catch {
      errors.push({ path: 'url', message: 'Use a complete http:// or https:// website address.' })
    }
  }
  if (errors.length) throw new ValidationError({ req, collection: 'events', errors })
  return data
}
