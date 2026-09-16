# Serenity Club of Clearwater

Next.js + Payload CMS replacement for the former Wix Serenity Club site.

## Stack

- Next.js App Router deployed to Vercel
- Payload CMS embedded in the same Next.js app at `/admin`
- Neon Postgres for Payload data through Vercel Marketplace
- Vercel Blob for uploaded media
- npm for package management

Use Node 24 for local development and Vercel builds. The project includes `.node-version`
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

Start the local Postgres service with `docker compose up -d postgres`. Copy
`.env.example` to `.env.development.local` and set local secrets. This file takes
precedence over `.env.local` during development; do not use a pulled production
environment for routine development. Automatic schema push is disabled by default.
Run committed migrations against the local database before starting the app.

```bash
npm ci
node scripts/with-env.mjs .env.development.local npm run migrate
npm run dev
npm run generate:types
npm run lint
npm run build
```

For a local production build, explicitly load the local environment:

```bash
node scripts/with-env.mjs .env.development.local npm run build
node scripts/with-env.mjs .env.development.local npm run start
```

Remote database connections outside Vercel fail closed. Reviewed maintenance
commands may explicitly set `ALLOW_REMOTE_DATABASE=true`; this never enables
remote schema push. `PAYLOAD_DB_PUSH=true` is honored only for loopback databases.

### Tests

Copy `.env.test.example` to `.env.test.local`. Tests require a loopback database
whose name ends in `_test`, and disable external Blob, email, and conversion.
Migrate/seed that disposable database and build with its environment before E2E
tests. Playwright starts its own production server on port 3100 and refuses to
reuse another application's server. Override `TEST_SERVER_URL` for another port.

```bash
npm run test:unit
node scripts/with-env.mjs .env.test.local npm run migrate
npx tsx scripts/seed-test.ts
node scripts/with-env.mjs .env.test.local npm run build
npm run test:int
npm run test:e2e
```

Run migrations against a configured database:

```bash
node scripts/with-env.mjs .env.development.local npm run migrate
node scripts/with-env.mjs .env.development.local npm run migrate:status
```

Seed launch content only in an intentionally empty local database. This command
is not part of a routine release and can replace editorial content:

```bash
node scripts/with-env.mjs .env.development.local npm run seed:serenity
```

## Environment

Use `.env.development.local` for local work. For Vercel, configure:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `CRON_SECRET`
- `PREVIEW_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `RESEND_INBOUND_FORWARD_TO`
- `RESEND_INBOUND_PRIVATE_COPY_TO`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `DOCX_CONVERSION_SECRET` (dedicated converter authentication secret)
- `DOCX_ALLOWED_SOURCE_ORIGINS` (the exact HTTPS origin of this project's Blob store)

The Vercel service binding supplies `DOCX_CONVERTER_URL`. See
[document conversion](docs/operations/document-conversion.md) for limits and configuration.

Use the Vercel Marketplace Neon integration for Postgres and Vercel Blob for uploads.
Email is wired for the official Payload Resend adapter. It stays inactive until
`RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` are configured.
Use a sender on the verified Resend sending domain, for example
`noreply@serenityclubofclearwater.org`.
Inbound email forwarding is handled at `/resend/inbound`. Configure a Resend
webhook for the `email.received` event, then set `RESEND_WEBHOOK_SECRET`.
Resend webhooks are event-scoped, so the route only forwards messages addressed
to `@serenityclubofclearwater.org`.
By default, inbound messages forward to `serenityclubclearwater@hotmail.com`
and send a separate private copy to `zorn.timothy@gmail.com`.

## First Vercel Setup

1. Link the project with Vercel.
2. Add Neon from the Vercel Marketplace and expose `DATABASE_URL`.
3. Add Vercel Blob and expose `BLOB_READ_WRITE_TOKEN`.
4. Pull env vars locally:

   ```bash
   vercel env pull .env.production.local --environment=production --yes
   ```

5. Back up the database and review the pending migrations. Explicitly opt in to
   remote maintenance, with schema push disabled:

   ```bash
   node scripts/with-env.mjs .env.production.local env ALLOW_REMOTE_DATABASE=true PAYLOAD_DB_PUSH=false npm run migrate
   ```

6. Deploy the tested commit:

   ```bash
   vercel --prod
   ```

After deployment, visit `/admin` to create the first admin user and edit content.

For future schema changes, run `npm run migrate:create -- descriptive_name`, commit the
generated files in `src/migrations`, apply the migrations, then deploy the code that
depends on them. Follow the [release procedure](docs/operations/migrations.md),
[publishing behavior](docs/operations/publishing.md), and
[dependency constraints](docs/operations/dependencies.md).

When switching local databases, remove `.next/cache` before rebuilding so cached
content from the previous database cannot contaminate local verification. CI starts
with an empty database, runs the complete migration history, and seeds only its
isolated test environment.

## Media integrity

The pinned Payload 3.89.0 Blob adapter is patched by `scripts/patch-blob-adapter.mjs`
after installation. Its upstream random-suffix handling overwrites original filenames
with derivative names. The small patch assigns each uploaded filename to its own
size metadata, retaining collision protection for direct client uploads. Installation
fails if the adapter version/source changes unexpectedly; review/remove the patch
when upgrading to an upstream fix. `tests/unit/blobAdapter.test.ts` exercises the
installed implementation with concurrent uploads.

Historical records can be repaired with a reviewed manifest, without uploading or
deleting Blob files:

```bash
node scripts/with-env.mjs .env.development.local npx tsx scripts/repair-media.ts --manifest path/to/manifest.json
node scripts/with-env.mjs .env.development.local npx tsx scripts/repair-media.ts --manifest path/to/manifest.json --apply --backup path/to/new-backup.json
```

The default is a dry run. Apply requires a new backup path, rechecks every record
and target file, and refuses stale or ambiguous changes. Remote maintenance also
requires the explicit database opt-in described above. Production apply requires
`REVALIDATE_URL` pointing to the site's `/next/revalidate` endpoint and `CRON_SECRET`;
never put credentials in a manifest, command argument, or committed file. The
September incident findings and repair sequence are in `docs/audits/`.
