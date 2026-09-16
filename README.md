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
npm install
npm run dev
npm run generate:types
npm run lint
npm run build
```

For a local production build, explicitly load the local environment:

```bash
node --env-file=.env.development.local node_modules/next/dist/bin/next build
node --env-file=.env.development.local node_modules/next/dist/bin/next start
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
node --env-file=.env.test.local node_modules/next/dist/bin/next build
npm run test:int
npm run test:e2e
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
