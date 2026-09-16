import { WEEKDAYS } from './meetings'
import type { Schedule, Session } from './schedule'

/** Split one weekday while keeping monthly variations and dated exceptions attached to it. */
export function splitMeetingDay(
  schedule: Schedule,
  key: string,
  day: (typeof WEEKDAYS)[number],
  makeKey = () => crypto.randomUUID(),
): Schedule {
  const base = schedule.sessions?.find((session) => session.key === key)
  if (!base || base.recurrence !== 'weekly' || !base.days.includes(day) || base.days.length < 2)
    return schedule
  const movedKeys = new Map<string, string>()
  const sessions: Session[] = []
  for (const session of schedule.sessions || []) {
    if (session.key !== key && session.replaces !== key) {
      sessions.push(session)
      continue
    }
    if (!session.days.includes(day)) {
      sessions.push(session)
      continue
    }
    if (session.key === key || session.days.length > 1) {
      const newKey = makeKey()
      movedKeys.set(session.key, newKey)
      sessions.push({ ...session, days: session.days.filter((value) => value !== day) })
      sessions.push({
        ...session,
        id: undefined,
        key: newKey,
        label: `${day}${session.label ? ` — ${session.label}` : ''}`,
        days: [day],
      })
    } else sessions.push({ ...session })
  }
  // Resolve references after collecting all keys, independent of array order.
  for (const session of sessions) {
    if (session.replaces === key && session.days.includes(day))
      session.replaces = movedKeys.get(key)!
  }
  const exceptions = schedule.exceptions?.map((exception) => {
    const moved = movedKeys.get(exception.session)
    const sourceDay = WEEKDAYS[new Date(`${exception.date}T12:00:00Z`).getUTCDay()]
    return moved && sourceDay === day ? { ...exception, session: moved } : exception
  })
  return { ...schedule, sessions, exceptions }
}
