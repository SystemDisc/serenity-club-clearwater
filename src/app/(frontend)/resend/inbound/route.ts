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

const getAddressDomain = (value: string) => getAddress(value).split('@')[1] || 'unknown'

const getRecipientDomains = (recipients: string[]) =>
  Array.from(new Set(recipients.map(getAddressDomain))).sort()

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>

    return {
      name: typeof errorRecord.name === 'string' ? errorRecord.name : undefined,
      message: typeof errorRecord.message === 'string' ? errorRecord.message : undefined,
      statusCode:
        typeof errorRecord.statusCode === 'number' ? errorRecord.statusCode : errorRecord.status,
      code: errorRecord.code,
    }
  }

  return {
    message: String(error),
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  if (!apiKey || !webhookSecret) {
    console.error('Resend inbound forwarding is missing configuration', {
      hasResendApiKey: Boolean(apiKey),
      hasWebhookSecret: Boolean(webhookSecret),
    })

    return NextResponse.json(
      { error: 'Inbound email forwarding is not configured.' },
      { status: 500 },
    )
  }

  const resend = new Resend(apiKey)
  const payload = await request.text()
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  let event: ReceivedEmailEvent

  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: svixId || '',
        timestamp: svixTimestamp || '',
        signature: svixSignature || '',
      },
      webhookSecret,
    }) as ReceivedEmailEvent
  } catch (error) {
    console.warn('Resend inbound webhook signature rejected', {
      hasSvixId: Boolean(svixId),
      hasSvixTimestamp: Boolean(svixTimestamp),
      hasSvixSignature: Boolean(svixSignature),
      error: getErrorDetails(error),
    })

    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }

  if (event.type !== 'email.received') {
    console.info('Resend inbound webhook ignored unsupported event', {
      eventType: event.type,
    })

    return NextResponse.json({ received: true })
  }

  const inboundRecipients = getInboundRecipients(event)

  console.info('Resend inbound webhook verified', {
    eventType: event.type,
    emailId: event.data?.email_id || null,
    recipientCount: inboundRecipients.length,
    recipientDomains: getRecipientDomains(inboundRecipients),
  })

  if (!inboundRecipients.some(isAllowedInboundRecipient)) {
    console.info('Resend inbound webhook ignored recipient domain', {
      emailId: event.data?.email_id || null,
      allowedDomain: ALLOWED_INBOUND_DOMAIN,
      recipientDomains: getRecipientDomains(inboundRecipients),
    })

    return NextResponse.json({ ignored: true })
  }

  const emailId = event.data?.email_id

  if (!emailId) {
    console.error('Resend inbound webhook missing email id', {
      eventType: event.type,
    })

    return NextResponse.json({ error: 'Inbound email id is missing.' }, { status: 400 })
  }

  const { primary, privateCopy } = getForwardingTargets()
  const sender = getSender()

  if (primary.length === 0 && privateCopy.length === 0) {
    console.error('Resend inbound forwarding has no recipients configured', {
      emailId,
    })

    return NextResponse.json(
      { error: 'No inbound forwarding recipients configured.' },
      { status: 500 },
    )
  }

  try {
    console.info('Resend inbound forwarding started', {
      emailId,
      primaryRecipients: primary.length,
      privateCopyRecipients: privateCopy.length,
    })

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
      console.error('Resend inbound primary forward failed', {
        emailId,
        error: getErrorDetails(primaryForward.error),
      })

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
      console.error('Resend inbound private copy forward failed', {
        emailId,
        error: getErrorDetails(privateCopyForward.error),
      })

      throw privateCopyForward.error
    }

    console.info('Resend inbound forwarding completed', {
      emailId,
      primaryRecipients: primary.length,
      privateCopyRecipients: privateCopy.length,
    })

    return NextResponse.json({
      forwarded: true,
      primaryRecipients: primary.length,
      privateCopyRecipients: privateCopy.length,
    })
  } catch (error) {
    console.error('Failed to forward inbound email', {
      emailId,
      error: getErrorDetails(error),
    })

    return NextResponse.json({ error: 'Failed to forward inbound email.' }, { status: 500 })
  }
}
