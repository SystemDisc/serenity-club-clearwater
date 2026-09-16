import { duesView } from './dues'
import { SerenityImage } from './ui'

export function DuesNotice({
  notice,
  legacyImage,
}: {
  notice: ReturnType<typeof duesView>
  legacyImage?: string
}) {
  if (notice.mode === 'off') return null
  if (notice.mode === 'legacy')
    return legacyImage ? (
      <SerenityImage
        src={legacyImage}
        alt="Previously uploaded membership dues reminder. Check the month printed on the poster."
        className="w-full rounded-lg border border-slate-200 bg-slate-50 object-contain p-8"
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    ) : null
  return (
    <aside
      style={{
        border: '1px solid #cbd5d1',
        borderRadius: 12,
        padding: 'clamp(20px, 4vw, 40px)',
        background: '#edf5ef',
        color: '#173c2c',
        lineHeight: 1.6,
      }}
      aria-label="Membership dues reminder"
    >
      <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 0 }}>
        Member supported
      </p>
      <h2
        style={{
          fontSize: 'clamp(24px, 3vw, 34px)',
          lineHeight: 1.2,
          margin: '12px 0 20px',
          color: 'inherit',
        }}
      >
        {notice.heading}
      </h2>
      <p style={{ whiteSpace: 'pre-line', fontSize: 18 }}>{notice.message}</p>
      {notice.image ? (
        <SerenityImage
          src={notice.image}
          alt={notice.imageAlt}
          className="w-full object-contain"
          sizes="(min-width: 1024px) 40vw, 100vw"
        />
      ) : null}
      {notice.link ? (
        <a
          href={notice.link}
          style={{
            display: 'inline-block',
            color: 'inherit',
            fontWeight: 700,
            padding: '12px 0',
            textDecoration: 'underline',
          }}
        >
          Membership information
        </a>
      ) : null}
    </aside>
  )
}
