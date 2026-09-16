'use client'
import { useForm, useFormFields, useFormProcessing } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useState } from 'react'
import { WEEKDAYS } from '@/serenity/meetings'
import { displayTime } from '@/serenity/calendar'
import { formatLabels } from '@/serenity/schedule'
import { scheduleFromForm } from './scheduleFromForm'
import { splitMeetingDay } from '@/serenity/splitMeetingDay'

export default function WeeklyEditor() {
  const { getData, reset, setModified } = useForm()
  const schedule = useFormFields(([fields]) => scheduleFromForm(reduceFieldsToValues(fields, true)))
  const processing = useFormProcessing()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const separate = async (key: string, day: (typeof WEEKDAYS)[number]) => {
    setBusy(true)
    try {
      const current = getData()
      await reset({ ...current, ...splitMeetingDay(scheduleFromForm(current), key, day) })
      setModified(true)
      setMessage(
        `${day} now has its own session below. Change its time or format, check the preview, then publish.`,
      )
    } catch (error) {
      console.error('Meeting day separation failed', error)
      setMessage(
        'The day could not be separated. Your saved version has not changed. Reload and try again.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="club-panel club-admin">
      <h2>Weekly overview</h2>
      <p>
        Days in the same session share their settings. Use “Separate this day” before changing only
        one day. Monthly variations and one-date changes stay attached to the correct day.
      </p>
      <div className="club-week-grid">
        {[...WEEKDAYS.slice(1), WEEKDAYS[0]].map((day) => {
          const sessions = schedule.sessions?.filter((session) => session.days?.includes(day)) || []
          return (
            <section className="club-task" key={day}>
              <h3>{day}</h3>
              {sessions.length ? (
                sessions.map((session) => (
                  <div key={session.key}>
                    <p>
                      <strong>{displayTime(session.time)}</strong>
                      {session.recurrence === 'monthly' ? ` · ${session.ordinal} week` : ''}
                      <br />
                      {formatLabels[session.format || ''] || 'Format not specified'}
                      {session.topic ? ` — ${session.topic}` : ''}
                      {!session.confirmed ? ' · Needs confirmation' : ''}
                    </p>
                    {session.recurrence === 'weekly' && session.days.length > 1 ? (
                      <button
                        type="button"
                        disabled={busy || processing}
                        aria-label={`Separate ${day} at ${displayTime(session.time)}`}
                        onClick={() => void separate(session.key, day)}
                      >
                        Separate this day
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p>No session</p>
              )}
            </section>
          )
        })}
      </div>
      <p role="status">{message}</p>
    </section>
  )
}
