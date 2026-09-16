type Environment = Record<string, string | undefined>

export function isLocalDatabase(databaseURL: string | undefined): boolean {
  if (!databaseURL) return false
  try {
    const url = new URL(databaseURL)
    return ['postgres:', 'postgresql:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

export function assertDatabaseSafety(env: Environment = process.env): void {
  if (!env.DATABASE_URL && env.DEMO_MODE === 'true') return
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required. Use DEMO_MODE=true only for an explicit demo.')
  if (!isLocalDatabase(env.DATABASE_URL) && env.VERCEL !== '1' && env.ALLOW_REMOTE_DATABASE !== 'true') {
    throw new Error('Remote database access is disabled outside Vercel. Configure a local database, or explicitly set ALLOW_REMOTE_DATABASE=true for a reviewed maintenance operation.')
  }
}

export function assertTestDatabase(env: Environment = process.env): void {
  if (!isLocalDatabase(env.DATABASE_URL) || !new URL(env.DATABASE_URL!).pathname.endsWith('_test')) {
    throw new Error('Tests require a loopback Postgres database whose name ends in _test. Production and development databases are not allowed.')
  }
  if (env.BLOB_READ_WRITE_TOKEN || env.RESEND_API_KEY || env.DOCX_CONVERTER_URL) {
    throw new Error('Tests must not use external Blob, email, or document conversion services.')
  }
}
