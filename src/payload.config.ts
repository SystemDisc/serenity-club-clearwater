import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Events } from './collections/Events'
import { GalleryItems } from './collections/GalleryItems'
import { Media } from './collections/Media'
import { Meetings } from './collections/Meetings'
import { Pages } from './collections/Pages'
import { Policies } from './collections/Policies'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { Sponsors } from './collections/Sponsors'
import { TeamMembers } from './collections/TeamMembers'
import { Users } from './collections/Users'
import { ClubSettings } from './ClubSettings/config'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { docxToImagePlugin } from './plugins/docxToImage'
import { defaultLexical } from '@/fields/defaultLexical'
import { generatePublicMediaURL } from './utilities/generatePublicMediaURL'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const getDatabaseURL = () => {
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
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
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
    pool: {
      connectionString: getDatabaseURL(),
    },
  }),
  collections: [
    Pages,
    Meetings,
    Events,
    GalleryItems,
    TeamMembers,
    Products,
    Policies,
    Sponsors,
    Posts,
    Media,
    Categories,
    Users,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [ClubSettings, Header, Footer],
  plugins: [
    ...plugins,
    vercelBlobStorage({
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
    docxToImagePlugin(),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

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
