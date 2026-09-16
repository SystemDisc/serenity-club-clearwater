# September 16 admin release

Release verification is in progress. The intended release is the core of phases 0–5 in the [admin plan](../plans/2026-09-15-admin-ux-improvements.md). Optional AI extraction, temporary notices, a scheduling runner, and confirmed real meeting formats are separate decisions.

## Verified before release

- 48 unit tests, 15 integration tests, and all 29 browser scenarios passed against the isolated production-mode local application. Browser tests include 30 ungrouped photos, a 50-photo album, interrupted upload/reselection, moves/order, trash/restore, rich News content, private autosave, Word original retention, and repeated publication without rebuilding.
- Type checking and lint with zero warnings passed. Public routes remain prerendered with five-minute request-driven revalidation; anonymous visitors do not acquire a new admin-session lookup.
- A fresh production dump was restored to a separate loopback test database. All ten new migrations and the meeting, event-link, and website-details backfills completed there. Original columns other than modification timestamps were compared for 11 meetings, 3 events, 19 gallery placements, 44 media files, 4 products, 8 team members, and 4 rules: no lost records or changed original values. Formats remain unconfirmed.
- Real Blob testing used disposable local database records and uniquely named remote files. It verified 26 image reads, concurrent repeated names, a client-uploaded original over 4.5 MB, replacement, focal points, small images, and legacy local-URL fallback. Only the test's own records/objects were cleaned up.
- A new live scan found seven legacy `thumbnailURL` values still pointing to `/api/media/file/...`, despite valid Blob originals. Payload computed this field from the original document before cloud-storage field hooks resolved its URL. The collection after-read hook now recomputes it from the completed document. This requires a code deployment, not alteration of those seven originals.
- Desktop Chrome inspection covered the task dashboard, current flyer, selected image, saved/publication state, and task guides. Phone inspection at 320px caught and corrected breadcrumb overflow and the toolbar backdrop's containing block. Automated public accessibility checks passed; this does not substitute for a volunteer or screen-reader acceptance session.

## Data and release procedure

Backups, credentials, private email attachments, runtime evidence, and local rehearsals are under ignored `tmp/` paths. `.vercelignore` explicitly excludes these and local storage. Migration source and schema snapshots, synthetic fixtures, reusable tests, and application code are committed.

1. Preserve a production database backup and the preceding ready deployment URL.
2. Use a restricted maintenance environment with remote maintenance explicitly enabled and schema push disabled. Vercel's sensitive environment values download as placeholders; do not treat those as secrets or upload them back. Use the existing matching production configuration for trusted maintenance.
3. Apply additive migrations, then the reviewed `backfill-meeting-schedules.ts`, `backfill-event-links.ts`, and `backfill-website-details.ts`. Backfills are dry-run by default. Preserve unknown formats, existing gallery membership, original file bytes, and stable URLs. Do not run the launch seed.
4. Deploy the committed source with the production Vercel environment. Keep the previous ready deployment available for application rollback; do not run destructive down migrations against editorial data.
5. Verify all existing thumbnail URLs, gallery item 20, image selection, native Blob batch uploads, Word conversion/source retention, public page visibility after saves, and core routes. Publish the authorized September email updates once, retaining originals. Verify from a separate anonymous visitor.
6. Record the actual deployment, real-content IDs, cache/latency observations, and any remaining acceptance gates below. A successful local build or queued deploy is not release completion.

## Remaining acceptance

Production deployment and live workflow verification are pending at this document's creation. The Chrome production session expired; the user has been asked to sign in again. Actual group-specific study/discussion days must still be supplied by the club. A volunteer acceptance session and human screen-reader check remain outstanding. AI extraction is not enabled and has no selected provider or spending limit.
