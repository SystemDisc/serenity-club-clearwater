'use client'
import Link from 'next/link'
import { useState } from 'react'
export default function PasswordResetRequest() {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  return (
    <section className="club-password-help">
      <p>Serenity Club of Clearwater</p>
      <h1>{sent ? 'Check your email' : 'Reset your website password'}</h1>
      {sent ? (
        <p>
          If this email has website access, a reset link is on its way. Check spam or junk too. If
          it does not arrive, contact the person who gave you access.
        </p>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            const email = new FormData(event.currentTarget).get('email')
            setBusy(true)
            setError('')
            try {
              const response = await fetch('/api/users/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              })
              if (!response.ok)
                throw new Error(
                  response.status === 429
                    ? 'Too many attempts. Wait a few minutes before trying again.'
                    : 'The request could not be completed. Try again, or contact the person who gave you access.',
                )
              setSent(true)
            } catch (failure) {
              setError(
                failure instanceof Error ? failure.message : 'Check your connection and try again.',
              )
            } finally {
              setBusy(false)
            }
          }}
        >
          <p>
            Enter the email address you use to sign in. We will send instructions to choose a new
            password.
          </p>
          <label>
            Email address
            <input type="email" name="email" required autoComplete="email" disabled={busy} />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send password reset email'}
          </button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      )}
      <p>
        <Link href="/admin/login">Back to sign in</Link>
      </p>
      <p>Never share your password or reset link.</p>
    </section>
  )
}
