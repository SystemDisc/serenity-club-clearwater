# September 16 admin release

The core release is deployed; authenticated production workflow acceptance is pending. The release covers the core of phases 0–5 in the [admin plan](../plans/2026-09-15-admin-ux-improvements.md). Optional AI extraction, temporary notices, a scheduling runner, and confirmed real meeting formats are separate decisions.

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

## Production rollout and results

- Database backup and isolated rehearsal completed before production writes. All ten additive migrations and three reviewed backfills were then applied. Existing gallery photos remain ungrouped; the 11 meeting records retain unknown formats. Board and Intergroup event announcements now use the corresponding meeting schedules. The old August event is archived, with its original content retained.
- Commit `f10f1c1` was deployed as `dpl_CCjE2E8tnamsWjNnnnog4oE1Prc7` and promoted to `www.serenityclubofclearwater.org` on September 16. Vercel reported Ready and the domain resolved to that deployment. The previous deployment, `dpl_Br2i4JKat9ozToca2Syo6Zx1w9Xu`, remains available; no down migration was run.
- Before promotion, the protected candidate was checked through the authenticated Vercel CLI. Home, Events, Meetings, Gallery, About, and News returned HTTP 200 with the expected titles. Anonymous photo-batch reads returned 403.
- Both the candidate and promoted production API returned working thumbnails for **44 of 44** media records. All seven former local-file fallbacks now resolve to Blob. Gallery Item 20 remains published and its Media 45 thumbnail returns successfully. No original image was rewritten for this correction.
- Live Chrome verified gallery images, opening the enlarged viewer, keyboard next-photo navigation, Escape, and focus returning to the original photo. It caught light text inherited from the system's dark theme on white gallery sections. Commit `c021457` corrects gallery/album/News section foreground colors; the new light/dark contrast regression passed locally. The follow-up production deployment `dpl_4KPEWLAJT5xFjPXTnPMs83Be37bc` (application source at `347ba56`) was verified Ready, checked before promotion, then promoted. Live Chrome confirmed the corrected heading contrast, successfully loaded visible photos, and 320px public-gallery reflow without horizontal overflow. Temporary viewport settings were reset. Subsequent commits change only tests and documentation.
- Clean GitHub runners exposed test fixtures accidentally becoming the first administrator instead of an editor. The test seed now retains a bootstrap administrator, and editor fixtures assert their actual role. All 15 integration tests passed against a newly created empty local database after migrations and the corrected seed. The public viewer also now receives two synthetic seed images on an empty database. The News regression explicitly leaves a list before inserting a standalone photo, with the correct caret shortcut on each operating system. The complete 30-scenario suite passed against a fresh local database, and the corrected News scenario passed again. These changes affect test setup, not production permissions.
- A deployment-scoped Vercel runtime query after the final smoke checks returned no error-level entries in its 15-minute window. This is a short observation window, not proof that every authenticated workflow has been exercised.
- GitHub [Verify run 35132756157](https://github.com/SystemDisc/serenity-club-clearwater/actions/runs/35132756157) passed for `bc6aa2b`: migrations, seed, zero-warning lint, types, 48 unit tests, 15 integration tests, production build, and all 30 browser scenarios on the clean Linux runner.
- Branch `codex/platform-reliability` is pushed. Source/test changes use focused commits. Private backups, email originals, credentials, local storage, and runtime outputs remain ignored and excluded from deployment inputs. The pre-release upload inventory contained no forbidden private paths.

### Public cache and response observations

Three ordinary anonymous requests per route were measured from this workstation immediately before and after the core release. The last two after-release requests were CDN **HITs** for every route below. These small samples demonstrate cache use and record response size; they are not a device-performance or load-test guarantee. First-request after-release times ranged from 65 to 319 ms. The build manifest declares five-minute request-driven revalidation; calendar rollover was not observed across a real month boundary.

| Route | Before HTML bytes | After HTML bytes | After warmed TTFB samples |
| --- | ---: | ---: | --- |
| Home | 95,528 | 91,214 | 82 / 46 ms |
| Events | 45,585 | 46,917 | 50 / 127 ms |
| Meeting schedule | 103,769 | 89,481 | 54 / 58 ms |
| Gallery | 114,645 | 94,986 | 52 / 62 ms |
| About | 70,845 | 70,720 | 112 / 61 ms |

## Remaining acceptance

The Chrome production session expired; the user has been asked to sign in again. **The September Word flyer, September 18 movie announcement, and September 19 bake-sale announcement are still local rehearsals, not production updates.** No production test content was created during this release.

After sign-in, verify the actual admin thumbnail/picker, native Blob batch upload, Word conversion and retained original, save/reload, and publication from a separate anonymous visitor without redeploying. Use the already-authorized September content once and check for existing records first. The user also authorized a temporary gallery placement using an existing image, followed by removal of only that test placement; that live test has not been performed in this release.

Actual group-specific study/discussion days must still be supplied by the club. A volunteer acceptance session, human screen-reader check, 200% browser-zoom acceptance, and real phone/slow-network testing remain outstanding. Local 320px and synthetic 30/50-photo browser workloads do not replace those checks. AI extraction is not enabled and has no selected provider or spending limit. Optional scheduled publishing remains disabled without an agreed runner.
