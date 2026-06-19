# Serenity Club of Clearwater

Next.js + Payload CMS replacement for the former Wix Serenity Club site.

## Stack

- Next.js App Router deployed to Vercel
- Payload CMS embedded in the same Next.js app at `/admin`
- Neon Postgres for Payload data through Vercel Marketplace
- Vercel Blob for uploaded media
- npm for package management

## Editable Content

Payload has club-specific collections grouped under `Serenity Club`:

- Club Settings
- Meetings
- Events
- Team Members
- Shop Items
- Policies
- Sponsors

The generated Payload `Pages` collection remains available for one-off editor-created pages.

## Local Commands

```bash
npm install
npm run dev
npm run generate:types
npm run lint
npm run build
```

Seed the Serenity launch content into the configured database:

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

Use the Vercel Marketplace Neon integration for Postgres and Vercel Blob for uploads.

## First Vercel Setup

1. Link the project with Vercel.
2. Add Neon from the Vercel Marketplace and expose `DATABASE_URL`.
3. Add Vercel Blob and expose `BLOB_READ_WRITE_TOKEN`.
4. Pull env vars locally:

   ```bash
   vercel env pull .env.local --yes
   ```

5. Seed launch content. On a new database, this also lets Payload initialize the schema from the local development process before the production deployment runs:

   ```bash
   npm run seed:serenity
   ```

6. Deploy:

   ```bash
   vercel --prod
   ```

After deployment, visit `/admin` to create the first admin user and edit content.

For future schema changes, generate and commit Payload migrations before deploying the code that depends on them.
