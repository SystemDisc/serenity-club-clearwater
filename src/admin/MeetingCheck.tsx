'use client'
import { useForm, useFormFields, useFormProcessing } from '@payloadcms/ui'
import { localDateKey } from '@/serenity/calendar'
export default function MeetingCheck() {
  const { dispatchFields, setModified } = useForm()
  const checkedOn = useFormFields(([fields]) => fields.checkedOn?.value) as string | undefined
  const busy = useFormProcessing()
  return (
    <section className="club-panel">
      <h2>Record a schedule check</h2>
      <p>
        After checking the dates and times with the group, record today below. Confirm each day’s
        format separately; this button leaves unknown formats unchanged.
      </p>
      <button
        type="button"
        disabled={busy || checkedOn === localDateKey()}
        onClick={() => {
          dispatchFields({ type: 'UPDATE', path: 'checkedOn', value: localDateKey() })
          setModified(true)
        }}
      >
        Dates and times checked today
      </button>
      <p>
        Add the group contact or responsible role in “Checked with” below. Save or publish to retain
        the check.
      </p>
    </section>
  )
}
