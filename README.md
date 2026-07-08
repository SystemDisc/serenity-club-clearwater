# Serenity Club of Clearwater

Next.js + Payload CMS replacement for the former Wix Serenity Club site.

## Stack

- Next.js App Router deployed to Vercel
- Payload CMS embedded in the same Next.js app at `/admin`
- Neon Postgres for Payload data through Vercel Marketplace
- Vercel Blob for uploaded media
- npm for package management

Use Node 22 for local development and Vercel builds. The project includes `.node-version`
and `.nvmrc` for runtime managers.

## Editable Content

Payload has club-specific collections grouped under `Serenity Club`:

- Club Settings
- Header Navigation
- Footer Navigation
- Meetings
- Events
- Gallery Items
- Team Members
- Shop Items
- Policies
- Sponsors

The generated Payload `Pages` collection remains available for one-off editor-created pages.
Admins can add a page in Payload, then add a custom URL or page reference under
`Globals > Header Navigation` or `Globals > Footer Navigation`.

## Local Commands

```bash
npm install
npm run dev
npm run generate:types
npm run lint
npm run build
```

Run migrations against a configured database:

```bash
npm run migrate
npm run migrate:status
```

Seed or refresh the Serenity launch content in the configured database:

```bash
npm run seed:serenity
```

## Environment

Copy `.env.example` to `.env.local` for local work. For Vercel, configure:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `CRON_SECRET`
- `PREVIEW_SECRET`
- `NEXT_PUBLIC_SERVER_URL`
- `BLOB_READ_WRITE_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`

Use the Vercel Marketplace Neon integration for Postgres and Vercel Blob for uploads.
Email is wired for the official Payload Resend adapter. It stays inactive until
`RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` are configured.
Use a sender on the verified Resend sending domain, for example
`noreply@serenityclubofclearwater.org`.

## First Vercel Setup

1. Link the project with Vercel.
2. Add Neon from the Vercel Marketplace and expose `DATABASE_URL`.
3. Add Vercel Blob and expose `BLOB_READ_WRITE_TOKEN`.
4. Pull env vars locally:

   ```bash
   vercel env pull .env.local --yes
   ```

5. Run committed Payload migrations:

   ```bash
   npm run migrate
   ```

6. Seed launch content:

   ```bash
   npm run seed:serenity
   ```

7. Deploy:

   ```bash
   vercel --prod
   ```

After deployment, visit `/admin` to create the first admin user and edit content.

For future schema changes, run `npm run migrate:create -- descriptive_name`, commit the
generated files in `src/migrations`, and deploy the code that depends on them.
