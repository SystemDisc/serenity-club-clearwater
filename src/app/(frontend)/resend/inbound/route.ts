import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const DEFAULT_FORWARD_TO = 'serenityclubclearwater@hotmail.com'
const DEFAULT_PRIVATE_COPY_TO = 'zorn.timothy@gmail.com'
const DEFAULT_FROM_ADDRESS = 'noreply@serenityclubofclearwater.org'
const DEFAULT_FROM_NAME = 'Serenity Club of Clearwater'
const ALLOWED_INBOUND_DOMAIN = 'serenityclubofclearwater.org'

type ReceivedEmailEvent = {
  type: string
  data?: {
    email_id?: string
    to?: string[]
    cc?: string[]
    bcc?: string[]
    received_for?: string[]
  }
}

const parseRecipients = (value: string) =>
  value
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean)

const getSender = () => {
  const address = process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM_ADDRESS
  const name = process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME

  return `${name} <${address}>`
}

const getForwardingTargets = () => {
  const primary = parseRecipients(process.env.RESEND_INBOUND_FORWARD_TO || DEFAULT_FORWARD_TO)
  const privateCopy = parseRecipients(
    process.env.RESEND_INBOUND_PRIVATE_COPY_TO || DEFAULT_PRIVATE_COPY_TO,
  )

  return { primary, privateCopy }
}

const getAddress = (value: string) => {
  const angleAddress = value.match(/<([^>]+)>/)

  return (angleAddress?.[1] || value).trim().toLowerCase()
}

const isAllowedInboundRecipient = (value: string) =>
  getAddress(value).endsWith(`@${ALLOWED_INBOUND_DOMAIN}`)

const getInboundRecipients = (event: ReceivedEmailEvent) => [
  ...(event.data?.received_for || []),
  ...(event.data?.to || []),
  ...(event.data?.cc || []),
  ...(event.data?.bcc || []),
]

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_INBOUND_API_KEY || process.env.RESEND_API_KEY
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  if (!apiKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Inbound email forwarding is not configured.' },
      { status: 500 },
    )
  }

  const resend = new Resend(apiKey)
  const payload = await request.text()

  let event: ReceivedEmailEvent

  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get('svix-id') || '',
        timestamp: request.headers.get('svix-timestamp') || '',
        signature: request.headers.get('svix-signature') || '',
      },
      webhookSecret,
    }) as ReceivedEmailEvent
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ received: true })
  }

  if (!getInboundRecipients(event).some(isAllowedInboundRecipient)) {
    return NextResponse.json({ ignored: true })
  }

  const emailId = event.data?.email_id

  if (!emailId) {
    return NextResponse.json({ error: 'Inbound email id is missing.' }, { status: 400 })
  }

  const { primary, privateCopy } = getForwardingTargets()
  const sender = getSender()

  if (primary.length === 0 && privateCopy.length === 0) {
    return NextResponse.json(
      { error: 'No inbound forwarding recipients configured.' },
      { status: 500 },
    )
  }

  try {
    const primaryForward = primary.length
      ? await resend.emails.receiving.forward(
          {
            emailId,
            from: sender,
            to: primary,
          },
          { idempotencyKey: `inbound-${emailId}-primary` },
        )
      : null

    if (primaryForward?.error) {
      throw primaryForward.error
    }

    // Resend's receiving forward helper has no BCC option, so send a separate private copy.
    const privateCopyForward = privateCopy.length
      ? await resend.emails.receiving.forward(
          {
            emailId,
            from: sender,
            to: privateCopy,
          },
          { idempotencyKey: `inbound-${emailId}-private-copy` },
        )
      : null

    if (privateCopyForward?.error) {
      throw privateCopyForward.error
    }

    return NextResponse.json({
      forwarded: true,
      primaryRecipients: primary.length,
      privateCopyRecipients: privateCopy.length,
    })
  } catch (error) {
    console.error('Failed to forward inbound email', {
      emailId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json({ error: 'Failed to forward inbound email.' }, { status: 500 })
  }
}
