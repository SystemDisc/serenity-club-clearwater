import type { Schedule, Session, ScheduleException } from '@/serenity/schedule'

/** Payload uses a row count for an empty array in client form state. */
export function scheduleFromForm(data: Record<string, unknown>): Schedule {
  return {
    sessions: Array.isArray(data.sessions)
      ? (data.sessions as Session[]).map((session) => ({
          ...session,
          days: session.days || [],
          time: session.time || '',
        }))
      : [],
    exceptions: Array.isArray(data.exceptions) ? (data.exceptions as ScheduleException[]) : [],
  }
}
