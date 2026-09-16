# Database migrations and releases

Automatic schema push is disabled. Local opt-in is limited to loopback databases. Never use schema push against production.

Use a fresh local database to run the complete migration history, and a disposable restored production copy to validate upgrades. The September 2026 comparison found that the existing public schema matches the baseline, apart from physical column order. The separate `neon_auth` schema belongs to Neon and is not managed by Payload. The new media-prefix column makes the schema consistent when Blob storage is disabled locally.

The historical `payload_migrations` row named `dev` with batch `-1` records past schema pushes. Payload warns before migrating such a database. Do not bypass that warning without comparing its schema with the committed baseline and preserving a backup. Once reconciled, remove only that bookkeeping row, then use normal committed migrations. Do not drop tables or mark unapplied migrations as complete.

Release sequence:

1. Run `npm ci`, unit/integration tests, type checking, lint, and a production build against the migrated local test database.
2. Back up production. Inspect pending migration SQL. Use a restricted maintenance environment with `ALLOW_REMOTE_DATABASE=true` and `PAYLOAD_DB_PUSH=false`.
3. Run `node scripts/with-env.mjs /restricted/maintenance.env npm run migrate` before deploying code that reads new columns. Keep changes additive so the preceding deployment remains compatible.
4. Deploy the tested commit. Check admin, public reads, image URLs, publishing, and scheduled jobs. Roll back the application if needed; do not automatically run destructive down migrations against user data.

A fresh schema is verified in CI. Data backups, repair manifests, credentials, and generated reports remain outside Git; reusable migration source and its schema snapshots are committed.
