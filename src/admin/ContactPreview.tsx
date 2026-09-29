'use client'
import { useFormFields } from '@payloadcms/ui'
import { mapLinks } from '@/serenity/siteCopy'
export default function ContactPreview() {
  const values = useFormFields(([fields]) => ({
    address: String(fields.address?.value || ''),
    city: String(fields.cityStateZip?.value || ''),
    hours: String(fields.hours?.value || ''),
    phone: String(fields.phone?.value || ''),
    email: String(fields.email?.value || ''),
  }))
  return (
    <section className="club-panel">
      <h2>Check contact details together</h2>
      <p>
        {values.address}, {values.city}
      </p>
      <p>{values.hours}</p>
      <p>
        {values.phone} · {values.email}
      </p>
      <a href={mapLinks().place} target="_blank" rel="noreferrer">
        View the Club listing on Google Maps ↗
      </a>
      <p>
        The map uses the Club&apos;s Google Maps listing. Confirm that the address above matches the
        listing before saving. These details also appear in the site footer.
      </p>
    </section>
  )
}
