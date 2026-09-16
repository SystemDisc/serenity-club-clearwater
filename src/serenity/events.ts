import type { Event } from '@/payload-types'
import type { EventItem } from './content'
import { displayDate, displayTime, localDateKey, validDateKey } from './calendar'
import { nextOccurrences } from './schedule'

export function eventCalendarDetails(
  event: Pick<
    Event,
    | 'kind'
    | 'date'
    | 'endDate'
    | 'startTime'
    | 'endTime'
    | 'timeMode'
    | 'dateLabel'
    | 'timeLabel'
    | 'meeting'
    | 'archived'
  >,
  today = localDateKey(),
) {
  if (event.kind === 'meeting') {
    const meeting = typeof event.meeting === 'object' ? event.meeting : null
    const next = meeting?._status === 'published' ? nextOccurrences(meeting, today, 1)[0] : null
    return next
      ? {
          date: next.date,
          sortTime: next.time,
          endDate: next.date,
          dateLabel: displayDate(next.date),
          timeLabel: displayTime(next.time),
          location: next.room || undefined,
          visible: true,
          archived: false,
        }
      : { visible: false, dateLabel: '', timeLabel: '' }
  }
  if (event.kind === 'dated' && validDateKey(event.date))
    return {
      date: event.date,
      sortTime:
        event.timeMode === 'allDay'
          ? '00:00'
          : event.timeMode === 'known'
            ? event.startTime || undefined
            : undefined,
      endDate: event.endDate || event.date,
      dateLabel: `${displayDate(event.date)}${event.endDate && event.endDate !== event.date ? ` – ${displayDate(event.endDate)}` : ''}`,
      timeLabel:
        event.timeMode === 'allDay'
          ? 'All day'
          : event.timeMode === 'known'
            ? `${displayTime(event.startTime || '')}${event.endTime ? ` – ${displayTime(event.endTime)}` : ''}`
            : 'Time not announced',
      visible: true,
      archived: false,
    }
  return {
    dateLabel: event.dateLabel || '',
    timeLabel: event.timeLabel || '',
    visible: true,
    archived: !!event.archived,
  }
}

export function isPastEvent(event: EventItem, today = localDateKey()) {
  return !!event.archived || (!!event.endDate && event.endDate < today)
}

export function sortEvents(events: EventItem[]) {
  return [...events].sort(
    (a, b) =>
      (a.date || '9999').localeCompare(b.date || '9999') ||
      (a.sortTime || '99:99').localeCompare(b.sortTime || '99:99') ||
      a.order - b.order ||
      String(a.id).localeCompare(String(b.id)),
  )
}
