import type { Meeting } from './content'
import { displayTime, localDateKey } from './calendar'
import { meetingRunsOnDate, sortedMeetingsByTime } from './meetings'
import {
  attendanceLabels,
  formatLabels,
  resolveSchedule,
  sessionDescription,
  type Session,
} from './schedule'

const displaySession = (meeting: Meeting, session: Session, days: string): Meeting => ({
  ...meeting,
  id: `${meeting.id}-${session.key}`,
  days,
  time: displayTime(session.time),
  room: session.room || undefined,
  format: session.confirmed
    ? [
        formatLabels[session.format || ''],
        session.topic,
        attendanceLabels[session.attendance || ''],
      ]
        .filter(Boolean)
        .join(' · ') || undefined
    : undefined,
})

export function meetingsOnDate(meetings: Meeting[], date = new Date()) {
  const key = localDateKey(date)
  return sortedMeetingsByTime(
    meetings.flatMap<Meeting>((meeting) =>
      meeting.sessions?.length
        ? resolveSchedule(meeting, key).map((session) => ({
            ...displaySession(meeting, session, 'Today'),
            description: [meeting.description, session.note].filter(Boolean).join(' '),
          }))
        : meetingRunsOnDate(meeting, date)
          ? [{ ...meeting, format: undefined }]
          : [],
    ),
  )
}

export function regularMeetingRows(meetings: Meeting[], date = new Date()) {
  const key = localDateKey(date)
  return sortedMeetingsByTime(
    meetings.flatMap<Meeting>((meeting) =>
      meeting.sessions?.length
        ? meeting.sessions
            .filter((session) => !session.until || session.until >= key)
            .map((session) =>
              displaySession(
                meeting,
                session,
                [
                  sessionDescription(session).split(' · ')[0],
                  session.replaces ? 'monthly variation' : '',
                  session.from && session.from > key ? `from ${session.from}` : '',
                ]
                  .filter(Boolean)
                  .join(' · '),
              ),
            )
        : [{ ...meeting, format: undefined }],
    ),
  )
}
