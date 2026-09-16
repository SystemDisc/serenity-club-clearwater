import { config } from 'dotenv'
import { assertTestDatabase } from '../../src/utilities/databaseSafety'

config({ path: '.env.test.local' })
// Explicitly override Next's .env.local discovery for the child server.
process.env.BLOB_READ_WRITE_TOKEN = ''
process.env.RESEND_API_KEY = ''
process.env.DOCX_CONVERTER_URL = ''
process.env.PAYLOAD_DB_PUSH = 'false'
process.env.NEXT_PUBLIC_SERVER_URL = process.env.TEST_SERVER_URL || 'http://127.0.0.1:3100'
assertTestDatabase()

export const testServerURL = process.env.NEXT_PUBLIC_SERVER_URL
