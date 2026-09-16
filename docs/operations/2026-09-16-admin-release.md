# September 16 admin release

The core release is merged and deployed, and the authorized September content is published. The release covers the core of phases 0–5 in the [admin plan](../plans/2026-09-15-admin-ux-improvements.md). Optional AI extraction, temporary notices, a scheduling runner, and current organizer confirmation of meeting details are separate decisions.

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

- Database backup and isolated rehearsal completed before production writes. All ten additive migrations and three reviewed backfills were then applied. At this initial migration step, existing gallery photos remained ungrouped and meeting formats were left unconfirmed. Later authorized content organization and source-backed format restoration are recorded below. Board and Intergroup event announcements now use the corresponding meeting schedules. The old August event is archived, with its original content retained.
- Commit `f10f1c1` was deployed as `dpl_CCjE2E8tnamsWjNnnnog4oE1Prc7` and promoted to `www.serenityclubofclearwater.org` on September 16. Vercel reported Ready and the domain resolved to that deployment. The previous deployment, `dpl_Br2i4JKat9ozToca2Syo6Zx1w9Xu`, remains available; no down migration was run.
- Before promotion, the protected candidate was checked through the authenticated Vercel CLI. Home, Events, Meetings, Gallery, About, and News returned HTTP 200 with the expected titles. Anonymous photo-batch reads returned 403.
- Both the candidate and promoted production API returned working thumbnails for **44 of 44** media records. All seven former local-file fallbacks now resolve to Blob. Gallery Item 20 remains published and its Media 45 thumbnail returns successfully. No original image was rewritten for this correction.
- Live Chrome verified gallery images, opening the enlarged viewer, keyboard next-photo navigation, Escape, and focus returning to the original photo. It caught light text inherited from the system's dark theme on white gallery sections. Commit `c021457` corrects gallery/album/News section foreground colors; the new light/dark contrast regression passed locally. The follow-up production deployment `dpl_4KPEWLAJT5xFjPXTnPMs83Be37bc` (application source at `347ba56`) was verified Ready, checked before promotion, then promoted. Live Chrome confirmed the corrected heading contrast, successfully loaded visible photos, and 320px public-gallery reflow without horizontal overflow. Temporary viewport settings were reset. Later production follow-ups are recorded below.
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

## Authorized content publication and follow-up

PR [#2](https://github.com/SystemDisc/serenity-club-clearwater/pull/2) was merged into `main` as `8d464bf`. Focused follow-ups fix original-document Blob metadata persistence, retain useful unconfirmed meeting descriptions, restore source-backed weekday formats, detect deployment changes in open admin sessions, and sort same-day events by their announced start times.

A fresh pre-content production backup was saved at ignored `tmp/content-before-1789582959097.dump` (556,580 bytes). No launch seed or destructive migration was used. Original files, email headers, credentials, maintenance receipts, and backups remain ignored.

| Published content | CMS records and verification |
| --- | --- |
| September monthly flyer | Monthly Flyer 1, Source Document 2, rendered Media 52. Original uploaded through the supported maintenance API; production Chrome selected it, called the real conversion service, previewed the generated image, published it, and verified saved state. Anonymous Home and Events show September. |
| Free movie: Normal Life | Event 4 / Media 48, September 18, 4:30 p.m., coffee bar, free snacks. |
| September bake sale | Event 5 / Media 49, September 19; time remains unannounced. |
| Paint like Bob Ross with Sandra D | Event 6 / Media 50, September 19, 10 a.m.–2 p.m.; public flyer price and registration contact retained. |
| Labor Day BBQ | Event 7 / Media 51, September 7, 1–3 p.m.; retained in past events, not promoted as upcoming. Food-until-gone wording retained. |
| September bowling | Event 8, September 20; missing time and venue are not invented. Visitors are directed to the coffee-bar flyer. |
| July bowling album | Album 1 at `/gallery/albums/bowling-event-july-2026`. All 17 original placements (IDs 4–20) were moved using the live organizer, with a cover selected and the album published in Chrome. The 19 total photos and their library files remain intact; two clubhouse photos remain ungrouped. |
| Membership dues | Published automatic-current-month mode through Chrome after comparing September and October previews. The earlier poster remains retained. |
| Meeting formats | Six groups received the weekday/monthly details explicitly recorded on the user-supplied old club site. See the meeting migration review and guarded backfill. No claim of fresh organizer confirmation was added. Earlier descriptions remain useful fallbacks with a confirmation reminder. |

The retained Word original was downloaded and its SHA-256 matched the supplied file byte for byte. All **49 current media thumbnails** returned HTTP 200 after publication. Separate anonymous requests verified all seven public routes, the September flyer and events, one bowling album with 17 photos, and 19 preserved photo placements. Chrome visually verified the converted flyer, public event details, album photos, and publication controls. Source documents remain immutable through the editor API.

The real source upload exposed a cloud-only interaction: the immutability hook rejected Payload storage's internal filename-metadata update after Blob upload. The fix admits only its server-context metadata update without a replacement file and with unchanged hash, size, and MIME type. Regression checks still reject ordinary updates, new bytes, and changed identity. The successful real upload and matching original hash verify the storage path.

An admin tab open across deployment promotion briefly called an obsolete server-action ID. Refreshing the saved editor recovered it. The Next.js documented deployment identifier is now explicitly configured for Services builds so clients can detect version changes. This does not guarantee preservation of edits before the first explicit draft save.

## Remaining acceptance

Chrome extension file-chooser automation requires its “Allow access to file URLs” permission; the extension rejected the initial file selection. This is separate from site upload behavior. Production source ingestion used the supported Payload maintenance API, and conversion, saved original selection, publishing, photo organization/cover selection, and dues editing were exercised in the real admin. The full 30/50-photo workloads and interruption/retry paths have automated local coverage; a real volunteer/device batch session remains useful.

Current group confirmation, volunteer usability testing, a human screen-reader check, 200% browser zoom, and real phone/slow-network checks remain outstanding. Historical schedule evidence is retained with unconfirmed status. AI extraction is not enabled and has no selected provider or spending limit. Optional scheduled publishing remains disabled without an agreed runner.

## Final verification

[GitHub Verify 35135399382](https://github.com/SystemDisc/serenity-club-clearwater/actions/runs/35135399382) passed for application commit `094f93a`: **54 unit tests, 15 integration tests, all 30 browser scenarios**, zero-warning lint, TypeScript, migrations/seed, and production build. The earlier integration expectation that hid an unconfirmed format was updated to match the user's explicit request: retain the known description and flag it as unconfirmed.

Live Chrome additionally verified Gallery Item 20's 300px thumbnail and 900px selected preview, the populated existing-image grid, the published September Word flyer, the 17-photo bowling album, and September dues wording. The public meeting schedule shows Tuesday Big Book and Thursday 12 Steps & 12 Traditions for TGIF. Production build `dpl_CcNTec9GUPcEQLJcjfUiF9o3z9qg` verified versioned asset URLs and an emitted deployment identifier; later code also adds chronological same-day event ordering.

## Album covers follow-up

Feature commit `f84a345` deployed successfully as `dpl_3x24W6WdKtLRZS33EfbaDQLh9gDp`. The [complete CI run](https://github.com/SystemDisc/serenity-club-clearwater/actions/runs/35142108777) passed. Local checks included 54 unit tests, eight related integration tests, four album/bulk-upload browser scenarios (including 30- and 50-photo batches), lint, type checks, and a production build.

Before deployment, Chrome confirmed the public bowling album had a title-only card despite saved cover Media 29. The missing filename/prefix projection was corrected. The release adds automatic collages, published photo counts, an editor preview, a return-to-collage button, pagination for selecting any album member, validation against private/nonmember covers, and safe fallback when a chosen photo is hidden or moved. New bulk albums default to collage, while existing deliberate cover selections remain intact. No schema migration or new generated media is required.

The previous Album 1 value was retained in ignored `tmp/album-before-collage.json`. In production Chrome, the editor selected **Use automatic collage** and **Publish changes**. The public Gallery immediately showed four bowling images and **17 photos · View album**, without redeployment. Reloading the editor retained the published collage selection. A final presentation follow-up shows complete photos inside collage cells, avoiding cropped faces in portrait photos, and distinguishes loading from an empty album in the editor. All original photos and files remain unchanged.

## Homepage flyer spacing

The homepage's compact flyer presentation now contains the image and a small full-size link, without the large bordered two-column panel, repeated month heading, or filler paragraph. The full Events page retains the text alternative. The image uses its actual dimensions and responsive sizing. Chrome verification with the real September flyer confirmed the desktop layout and 390-pixel phone presentation; 320- and 390-pixel widths had no horizontal overflow. Targeted lint, TypeScript checking, and the production build passed. This is a presentation-only change; no CMS records or original files were changed.
