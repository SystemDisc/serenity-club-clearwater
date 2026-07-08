declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL?: string
      VERCEL_PROJECT_PRODUCTION_URL?: string
      EMAIL_FROM_ADDRESS?: string
      EMAIL_FROM_NAME?: string
      RESEND_API_KEY?: string
      RESEND_WEBHOOK_SECRET?: string
      RESEND_INBOUND_FORWARD_TO?: string
      RESEND_INBOUND_PRIVATE_COPY_TO?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
