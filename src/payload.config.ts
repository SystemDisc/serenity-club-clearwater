import { isAdmin } from './access/users'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Albums } from './collections/Albums'
import { Categories } from './collections/Categories'
import { Events } from './collections/Events'
import { GalleryItems } from './collections/GalleryItems'
import { Media } from './collections/Media'
import { SourceDocuments } from './collections/SourceDocuments'
import { MonthlyFlyers } from './collections/MonthlyFlyers'
import { Meetings } from './collections/Meetings'
import { Pages } from './collections/Pages'
import { Policies } from './collections/Policies'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { Sponsors } from './collections/Sponsors'
import { TeamMembers } from './collections/TeamMembers'
import { Users } from './collections/Users'
import { DuesReminder } from './DuesReminder/config'
import { ClubSettings } from './ClubSettings/config'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { generatePublicMediaURL } from './utilities/generatePublicMediaURL'
import { getServerSideURL } from './utilities/getURL'
import { assertDatabaseSafety, isLocalDatabase } from './utilities/databaseSafety'
import { clubAdminPlugin } from './admin/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const getDatabaseURL = () => {
  assertDatabaseSafety()
  const databaseURL = process.env.DATABASE_URL || ''

  if (!databaseURL) return ''

  try {
    const parsedURL = new URL(databaseURL)
    const sslMode = parsedURL.searchParams.get('sslmode')

    if (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca') {
      parsedURL.searchParams.set('sslmode', 'verify-full')
    }

    return parsedURL.toString()
  } catch {
    return databaseURL
  }
}

const getEmailAdapter = () => {
  const apiKey = process.env.RESEND_API_KEY
  const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS

  if (!apiKey || !defaultFromAddress) return undefined

  return resendAdapter({
    apiKey,
    defaultFromAddress,
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Serenity Club of Clearwater',
  })
}

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      Nav: '@/admin/Navigation',
      beforeNavLinks: ['@/admin/NavLinks'],
      views: {
        dashboard: { Component: '@/admin/Dashboard' },
        meetings: { Component: '@/admin/MeetingsWeek', path: '/meetings' },
        help: { Component: '@/admin/Help', path: '/help' },
        tools: { Component: '@/admin/Help#Tools', path: '/tools' },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  email: getEmailAdapter(),
  db: postgresAdapter({
    push: process.env.PAYLOAD_DB_PUSH === 'true' && isLocalDatabase(process.env.DATABASE_URL),
    pool: {
      connectionString: getDatabaseURL(),
    },
  }),
  collections: [
    Pages,
    Meetings,
    Events,
    GalleryItems,
    Albums,
    TeamMembers,
    Products,
    Policies,
    Sponsors,
    Posts,
    Media,
    SourceDocuments,
    MonthlyFlyers,
    Categories,
    Users,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [ClubSettings, DuesReminder, Header, Footer],
  folders: { browseByFolder: false },
  plugins: [
    ...plugins,
    vercelBlobStorage({
      alwaysInsertFields: true,
      addRandomSuffix: true,
      collections: {
        media: {
          generateFileURL: generatePublicMediaURL,
        },
      },
      clientUploads: true,
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
    vercelBlobStorage({
      alwaysInsertFields: true,
      addRandomSuffix: true,
      clientUploads: false,
      collections: {
        sourceDocuments: {
          generateFileURL: (args) =>
            process.env.BLOB_READ_WRITE_TOKEN
              ? generatePublicMediaURL(args)
              : `/api/sourceDocuments/file/${encodeURIComponent(args.filename)}`,
        },
      },
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
    clubAdminPlugin,
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    // The optional scheduled-publishing task must be included consistently.
    // Generate explicitly with npm run generate:types, regardless of the runtime flag.
    autoGenerate: false,
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Administrators and the authenticated scheduled runner can execute jobs.
        if (isAdmin(req.user)) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
