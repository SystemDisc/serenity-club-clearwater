# Platform, media, and publishing audit

Audited September 15, 2026 (America/New_York; some evidence timestamps are September 16 UTC).

**Status: production media hotfix deployed and historical filenames repaired; the remaining reliability implementation is in progress.** The repair described below was tested on an isolated local copy of production data. This document is the baseline for the reliability work, followed by admin UX improvements.

Historical follow-up: [upload timeline and available logs](2026-09-15-upload-timeline.md). Thumbnail corruption began before ISR; the bowling batch was followed immediately by a redeployment of the same commit. Historical runtime logs could not be retrieved.

## Principal findings

1. **Broken thumbnails are caused by inconsistent filenames written by the Blob storage integration.** Twenty-one of 44 media records have the wrong original filename and missing random suffixes in derivative filenames. The files still exist in Blob. This also makes some public “original image” links open a resized image.
2. **Gallery creation already has a publishing hook.** An approved new production gallery item appeared without a deployment. However, consecutive public requests returned fresh, stale, then fresh content. This reproduced transient inconsistency, not the earlier prolonged failure reported by the user.
3. **A persistent ISR failure is reproducible.** A database error during regeneration is swallowed, and demo content is returned as a successful page. That page stays cached after the database recovers because public routes have no time-based revalidation. Redeployment or another invalidation replaces it. This is a proven defect, but there is insufficient historical evidence to attribute the user's earlier incident specifically to it.
4. **Empty collections and large galleries have incorrect behavior.** Zero published gallery items renders three fallback images; 109 published items renders only 100. Both were reproduced locally.
5. **Fix several inherited template hazards before expanding the admin.** The authenticated dashboard exposes a destructive seed action. Preview authentication checks the wrong return value. Public archive queries omit Payload access enforcement. Several live pages declare the homepage as their canonical URL.

## Scope and evidence

The audit covered source/configuration, installed dependency code, current official documentation, the live Chrome admin and public site, public HTTP responses, a read-only production database export, Blob inventory, and a local production build against the copied database.

The audited checkout was `main`, HEAD `c6795e30` (“Reduce public request compute”). The pre-existing changes to `AGENTS.md`, the reporting skill, and `output/` were preserved. No application source was changed for these experiments. Deployment inspection independently confirmed Vercel Services with a Next.js web service and a DOCX converter container. The inspected production deployment was `dpl_J39tfvAhZgw1JQrgcDPyii6a75hq`, created July 28; this audit does not assume that a local Git commit alone proves deployed source identity.

Production mutations were limited to:

- Republish Gallery Item 20 with unchanged content, to exercise its hook. Its update timestamp/version history changed.
- With explicit permission, publish new Gallery Item 21, titled “Gallery publishing test,” using existing Media 45. Verify it publicly, then delete only this test gallery item. The shared media was preserved. Cleanup was verified in the API, admin list, and public HTML; the gallery returned to its original 19 items.

No production media repair, schema migration, deployment, destructive seed operation, email test, or DOCX conversion was performed. Runtime-log queries did not recover useful evidence of the historical incident. Absence of retrieved logs is not evidence that no error occurred.

## Current architecture

| Area | Observed implementation | Implication |
| --- | --- | --- |
| Runtime | Node 24; local Node 24.14 | Keep local, CI, converter, and Vercel versions explicit. |
| Web | Next.js 16.2.10 App Router, React 19.2.7 | Public routes are prerendered/ISR; admin and APIs are dynamic. This is not a static export. |
| CMS | Payload 3.85.2 embedded at `/admin` | Collection/global hooks run in the same application as Next cache invalidation. |
| Database | Neon Postgres via `@payloadcms/db-postgres` | Numeric document IDs, transactions, migrations, and environment isolation matter. |
| Media | Public Vercel Blob, client uploads, Sharp 0.34.2 | Originals upload directly; the server generates derivatives and writes media metadata. |
| Conversion | Separate Vercel container running LibreOffice/image conversion | Keeps native document tooling separate, but processing is still synchronous from the upload flow. |
| UI | TypeScript 5.9.3, Tailwind 4, Radix components, Lexical | Club pages are custom components alongside the inherited Payload website template. |
| Email | Resend adapter and inbound webhook route | Configured separately; delivery/forwarding was outside this test scope. |
| Observability | Vercel Analytics and Speed Insights | Installed, but this audit did not establish field Core Web Vitals or performance percentiles. |
| Testing | Vitest and Playwright | Existing tests do not cover the failing storage/cache lifecycle. |

Production snapshot counts: 44 media, 19 gallery items, 11 meetings, 3 events, 8 team members, 4 products, 4 policies, and no sponsors, Pages, Posts, Forms, or queued jobs. Blob inventory contained 240 objects totaling approximately 59 MB.

The README accurately describes the broad stack and club collections. Its environment workflow needs safeguards: the current `.env.local` contains production service connections. The Docker Compose file still describes MongoDB/yarn, which does not match the active Postgres/npm application.

### Content ownership

The public club pages use `src/serenity/data.ts` and custom components. Their records come from club-specific collections; much surrounding page copy remains in code. Payload Pages is for additional editor-created pages, not an editor for every existing core route. Make that distinction explicit in the admin. Add reserved-slug validation so an editor cannot create an apparently published Page whose URL is occupied by a hardcoded route.

## 1. Media and thumbnail defect

### What is broken

Gallery Item 20 references Media 45. Its thumbnail metadata constructs a Blob URL ending in:

```text
Bowling July 2026-3LBYzjEL3IIjjKKlkmIQJGduUp0hLm-300x225.jpg
```

That direct Blob URL returns 404. The actual stored thumbnail is:

```text
Bowling July 2026-3LBYzjEL3IIjjKKlkmIQJGduUp0hLm-300x225-zEmxXsFGkJUuVVU41atHDcHsYAWJ8v.jpg
```

The main media filename instead points at a `1920x1440` derivative with another suffix. It returns 200, hiding part of the corruption: public images can still display while admin thumbnails fail and “original” links are wrong. Chrome confirmed missing previews in the Gallery Item field, Media list, and existing-image picker.

### Why it happens

Relevant files:

- `src/payload.config.ts`: `addRandomSuffix: true`, `clientUploads: true`, and custom `generateFileURL`.
- `src/collections/Media.ts`: seven generated sizes; `adminThumbnail: 'thumbnail'`.
- `src/utilities/generatePublicMediaURL.ts`: constructs direct URLs from stored filenames.
- Installed `@payloadcms/plugin-cloud-storage/dist/hooks/afterChange.js`: uploads incoming derivative files concurrently, passing the same `doc` object as `data` to each upload.
- Installed `@payloadcms/storage-vercel-blob/dist/adapter.js`: each successful upload assigns its resulting filename to `data.filename`.

With random suffixes enabled, derivative uploads receive new storage names. They overwrite the shared top-level original filename, while their size-specific metadata retains the unsuffixed name. Whichever upload wins the shared mutation can determine the recorded “original.” The direct URL helper reveals the bad metadata; it is not the cause of the missing files.

The inventory identified this pattern in Media IDs 27–47: **21 original-filename corrections and 131 derivative-filename corrections**. Matching original/derivative stems, extensions, and exact byte sizes resolved every proposed change to an existing Blob object. This includes the large image produced from an uploaded DOCX. No re-upload or regeneration is necessary merely to restore these references.

Upstream has reports of the same resize/suffix interaction. The inspected 3.89.0 Blob adapter package still contains the shared top-level filename assignment, so an upgrade alone is not a demonstrated fix. [Payload issue #9589](https://github.com/payloadcms/payload/issues/9589).

### Safe repair approach

1. Prevent new corruption before or alongside data repair. Use unique original keys before client upload, stable derivative keys, and metadata handling that updates the correct size rather than sharing top-level filename mutations. Evaluate a small pinned adapter patch versus a project-owned adapter; verify both client and server uploads.
2. Preserve collision resistance. Simply switching off random suffixes can allow two direct uploads with the same name to overwrite one another. Duplicate names are common in phone-photo batches. [Payload issue #17823](https://github.com/payloadcms/payload/issues/17823).
3. Keep direct client uploads for large photos. Payload documents these as the way to bypass Vercel's server request-body limit. Sending every original through a Next function would reintroduce a different upload failure. [Payload storage adapter documentation](https://payloadcms.com/docs/upload/storage-adapters).
4. Back up the production database and retain a per-record before/after manifest. Recheck candidate Blob objects and current record values immediately before applying repairs. Abort on changed or ambiguous records. Update only metadata, preserving document IDs, relationships, captions, and original files. Make the operation idempotent.
5. Verify all repaired variants, not only thumbnails; invalidate affected public content after the repair commits. Keep rollback metadata until validation completes. Do not delete apparent orphan objects as part of this repair.
6. Resolve admin thumbnails to verified direct Blob URLs, falling back to the original when a small image has no generated thumbnail. The existing `thumbnailURL` may use `/api/media/file/...`, adding an application request to display a public image.

The local copied database was repaired and originals/thumbnails downloaded into ignored local media storage. **All 42 original/thumbnail GETs succeeded.** All 131 derivative names were matched in Blob inventory, but this was not a browser test of every derivative. Local Payload file routes returned 404 to HEAD while serving GET successfully; GET is the appropriate end-to-end check for those routes.

Required regression cases: repeated filenames, concurrent uploads, small images, portrait/landscape, PNG/JPEG/WebP, a file above the function body limit, replacing an existing upload, regenerating sizes, focal-point edits, deleting media, and DOCX output. Verify original dimensions and every recorded size URL. Test replacement/deletion on dedicated disposable storage, because wrong existing names can also affect cleanup behavior.

## 2. ISR and public content freshness

### What exists today

`src/app/(frontend)/layout.tsx` sets `revalidate = false`. This retains generated pages until explicit invalidation. `getSerenityData()` uses React `cache()` to deduplicate work during rendering; it does not create a persistent tagged data cache. The normal public speed comes primarily from the full-route/CDN cache.

`src/hooks/revalidatePublicSite.ts` calls `revalidatePath('/', 'layout')`. It runs after changes affecting published content and after deletion. A brand-new published gallery item satisfies its condition. The root path matches actual public route cache tags, including the route group layout; a route-group mismatch was not demonstrated.

The broad invalidation is effective, but every affected public page must regenerate as visitors request it. On each regeneration, the shared data helper loads settings and all seven club collections; navigation adds two global reads. A gallery change therefore causes unnecessary work across unrelated routes. Uploading many Media and Gallery records can repeatedly invalidate the whole site.

### Live creation experiment

Immediately after publishing the approved new item, three consecutive public HTTP requests produced:

| Request | HTTP/cache | Gallery figures | Test item present | Elapsed |
| --- | --- | ---: | --- | ---: |
| 1 | 200 / `REVALIDATED`, age 0 | 20 | Yes | 902 ms |
| 2 | 200 / `STALE`, age 116 | 19 | No | 57 ms |
| 3 | 200 / `HIT`, age 0 | 20 | Yes | 62 ms |

Chrome showed the test item after navigating away and back. An already-open public tab did not update itself; ISR is not a live-push feature. After deletion, fresh public responses consistently returned the original 19 items.

**Interpretation:** publishing currently reaches the cache invalidation mechanism, but immediate reads were inconsistent. One successful test does not explain or disprove the user's earlier failure. The experiment did not reproduce content remaining stale until redeployment, and it does not identify whether the transient stale response arose from regional/CDN propagation, concurrent regeneration, or another cache layer.

Before mutation, some public cache ages were approximately 44 days. Long age is permitted by `revalidate = false`; it is not by itself evidence of a broken hook when no subsequent content change is established.

### Persistent failure reproduced locally

Using `next build`/`next start`, with a copied database on an isolated port:

1. Warm `/gallery` with the 19 real items.
2. Update a gallery item to invalidate the route.
3. Stop only the isolated local Postgres instance.
4. Request `/gallery`: 200 cache miss, three fallback/demo figures.
5. Restart local Postgres.
6. Request `/gallery`: 200 cache hit, still three fallback figures.

The failure is in `getPayloadClient()` and `findCollection()`: they swallow initialization/query errors and return fallback data. ISR sees a successful render, so it has no failed regeneration to retry. With no TTL, the fallback can persist indefinitely. Page/Post loaders similarly turn some failures into missing-page behavior; the sitemap catches failures and caches an empty CMS contribution.

On failed regeneration, Next can retain the last successful result when the error is allowed to propagate. The current application removes that protection by converting failure into success. Keep demo data behind an explicit demo configuration; in production, propagate unavailable-database errors and log them. A successful query returning no documents must remain an empty result. [Next.js ISR guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration).

### Content-action coverage

“Source” means hook wiring was inspected; it does not mean every UI action was exercised live.

| Content/action | Current invalidation | Verification or gap |
| --- | --- | --- |
| Gallery: create/publish, edit, unpublish, republish, delete | Root layout, with published-state check | Full lifecycle passed locally; new publish and delete also tested live. |
| Meetings, Events, Team Members, Policies, Sponsors | Same root hooks | Source covered; individual live mutations not performed. |
| Products | Root, product path, sitemap tag | Local create, slug rename, delete, route status, and sitemap checked. |
| Pages | Root, page path, sitemap tag | Source covered; old published slug is not explicitly invalidated on rename. Broad root currently masks that gap. |
| Posts | Root and post path | Source covered; same old-slug issue. No production Posts currently. |
| Media create/update/delete | Root layout | Source covered. Upload timing and nested storage updates need dedicated tests; no destructive live replacement/deletion performed. |
| Categories | Root layout | Source covered; affects archive/filter relationships. |
| Club Settings | Root layout | Local hours edit changed homepage; original value restored. |
| Header/Footer | Root plus `global_header`/`global_footer` tags | Root is effective; current navigation helper does not consume those legacy global tags. |
| Redirects create/update/delete | `redirects` tag using `max` | Source covered. Admin help text still says a rebuild is required; align it with intended behavior after testing. |
| Forms embedded in published Pages | No added public-content hooks | A form definition change can leave a cached page stale. No Forms currently. |
| Users used as post authors | No public-content hooks | Author-display changes can leave cached content stale. Evaluate dependencies before enabling Posts. |
| Scheduled publishing | Pages/Posts expose scheduling | No runner/cron configuration found in repo; no end-to-end execution verified. Generated Payload tasks may exist even though custom `tasks` is empty. |
| SQL, `payload.db.*`, or imports with `disableRevalidate` | Bypasses normal invalidation | Require a documented post-commit invalidation step; batching should invalidate once after success. |
| New/renamed/deleted CMS URLs in sitemap | Tagged cached page/product queries | Product lifecycle passed locally; `max` permits stale data, and errors currently become cached empty results. |

### Recommended cache design

- Keep cached public HTML and dynamic authenticated admin/API routes. Do not turn every public request into a database render to solve freshness.
- First remove production fallback-on-error behavior and distinguish empty content from unavailable content. This is required regardless of which invalidation API is chosen.
- Add a finite safety interval, initially around five minutes for editable public content and corresponding cached queries. This limits dependence on a single hook. It causes regeneration when a subsequent request arrives; it is not a guarantee that all pages change at an exact wall-clock deadline.
- Split the all-content helper into collection-specific queries. Introduce explicit shared data tags if useful, using the current supported caching API without requiring a wholesale Cache Components migration.
- Map published mutations to affected routes/data. Include both previous and current slugs, listings, related records, and sitemap entries. Reserve broad root invalidation for genuinely shared settings/navigation or media with broad dependencies.
- For data that must be fresh following publication, use deliberate hard expiration, such as `revalidateTag(tag, { expire: 0 })` where supported. `revalidateTag(tag, 'max')` intentionally serves stale data during refresh. Tags must first be assigned to actual cached queries. Validate this on Vercel Services as well as locally. [Next.js revalidateTag documentation](https://nextjs.org/docs/app/api-reference/functions/revalidateTag).
- Verify transaction timing: public regeneration must observe the committed change. Do not add unawaited delayed promises or timers to serverless hooks. If a post-commit retry is required, use an explicit awaited request lifecycle or durable job/outbox and test failures.
- Log collection/global, document ID, operation, old/new publication status, affected paths/tags, and outcome. Add a public freshness check tied to a content revision so “saved in database” and “visible publicly” can be distinguished.

Acceptance criteria should include two independent public clients seeing a newly published item, unpublish/delete removing it, no redeployment, retained real content during a DB outage, recovery after the outage, and a visible/admin-diagnosable failure if invalidation fails.

## 3. Data behavior and scale

| Finding | Evidence | Required behavior |
| --- | --- | --- |
| Empty collections show seeded/demo data | Locally unpublished all real gallery rows; API returned zero, HTML rendered three figures | Empty published content stays empty; demo mode is explicit. |
| Gallery capped at 100 | Locally created 90 temporary rows alongside 19 originals; HTML rendered exactly 100 | Add intentional pagination/load-more and total counts before batch imports. |
| Numeric IDs become empty strings | `getText(doc.id)` accepts strings only; Postgres uses numbers | Normalize IDs explicitly, e.g. `String(doc.id)`, and test stable rendering keys. |
| Order ties are common | Collection default `order: 100`; sort only by order | Use a stable secondary order and an editor-friendly reorder workflow. |
| Optional settings/navigation cannot reliably be cleared | Empty strings/arrays trigger fallback values | Separate “not configured” defaults from an intentional empty value. |
| Public rendering overfetches | Every `getSerenityData()` call loads all club collections | Fetch/select only each route's dependencies; preserve within-request deduplication. |
| Media alt text missing | All 44 Media records had blank alt values | Provide a practical alt/caption review workflow; distinguish decorative images from meaningful photos. Some public components already fall back to titles. |

The temporary capacity-test records were deleted and original publication states restored in the local database. Production capacity/content was not changed.

## 4. Template, access, and operational findings

### Address before broadening admin use

**Destructive seed action remains exposed.** `src/components/BeforeDashboard/SeedButton` calls `/next/seed`. That route requires authentication but has no production-environment guard. The seed implementation resets navigation and directly deletes Media, Categories, Pages, Posts, Forms, Form Submissions, and Search records. It is not a harmless starter-content button. Remove it from the production dashboard and disable the endpoint in production; hiding the button alone is insufficient. The operation was not executed.

**Preview checks the auth result object, not its user.** `src/app/(frontend)/next/preview/route.ts` assigns the result of `payload.auth()` to `user`; `{ user: null }` is truthy. A local request with the valid preview secret but no login received a redirect and draft-mode cookie. The secret is still required; this is not a claim that any anonymous visitor can preview without it. Destructure and require the authenticated user, require a configured nonempty secret, and validate a same-origin internal path. The current slash-prefix test also accepts protocol-relative `//host` paths.

**Some public Local API queries bypass access control.** `src/blocks/ArchiveBlock/Component.tsx` and `src/utilities/getDocument.ts` omit `overrideAccess: false`. Enforce published-only access on public reads, explicitly separate preview queries, and test draft-only and previously-published documents. This is a source-confirmed access-policy gap; no private production post was fetched during the audit. The fallback document helper also queries by slug while some callers treat its argument as an ID; handle numeric IDs consistently.

**Local/test environment isolation is unsafe by default.** `.env.local` currently connects to production Neon/Blob. Unmodified local startup and test helpers can therefore act on production services. The test helper creates/deletes a fixed user; Playwright reuses port 3000, which was occupied by a different project during this audit. Add explicit test/local DB validation, a disposable database setup, configurable ports, and disabled external mail/storage for routine tests. Do not rely on file naming alone for isolation.

### Reliability and maintenance

- **Scheduled publishing:** configure and test an authenticated job runner on Vercel if scheduling remains visible. Include scheduled unpublish and failed-job recovery. Pages/Posts autosave is configured at 100 ms; review that unusually short interval before increasing editorial usage.
- **Migrations:** the repository contains one baseline migration, while the production migration table includes a `dev` entry. Compare schema to the migration history before relying on a fresh restore/deploy. Establish an explicit migration/release step and prevent accidental development schema pushes to production.
- **Permissions:** all authenticated users have broad management rights, including users. Introduce editor/admin roles when the management workflow expands; verify relationships and upload permissions too.
- **DOCX converter:** keep the service separation, but add a dedicated secret, allowed source origins, download/convert timeouts, byte/pixel/page limits, and bounded concurrency. Current JSON body limits do not bound the remote download, and unlimited image pixels can consume excessive memory. This service is authenticated; unauthenticated public SSRF was not established. Test converted media through the same filename/thumbnail path as photos.
- **Dependency maintenance:** `npm audit` reported 21 affected package entries: 1 critical, 11 high, 9 moderate. These are not 21 independently proven production exploits. Some advisories have platform/build-time qualifications. Review applicability and coordinate updates; do not use forced audit fixes without compatibility checks.
- **Upgrade candidates checked on audit date:** Next 16.3.5, Payload 3.89.0, and a patched Sharp release (latest observed 0.35.4). Keep the entire Payload package family aligned; the newer Payload Next integration advertises a compatible Next 16 range. Upgrade and validate the converter's Sharp dependency separately. The Blob defect still needs its own verification/fix.
- **Dependency hygiene:** `.npmrc` enables `legacy-peer-deps`, masking incompatibilities; another npm setting produced an unsupported-setting warning. Pin and validate the package manager/toolchain in CI. No tracked GitHub Actions workflow was found.
- **Documentation:** replace stale MongoDB/yarn instructions; document local database creation, production environment handling, migrations, publishing/cache behavior, storage repair, and backup/restore checks.

## 5. Public performance and metadata

Warm live HTML probes commonly completed in roughly 55–128 ms from this single machine, and responses were CDN cache hits. The live new-item regeneration took about 902 ms. These are individual observations, not percentiles, load tests, or mobile page-load scores. Preserve the existing cache benefits while reducing regeneration work.

The image pipeline already combines generated sizes with Next image optimization. Check which variants actually save transfer/CPU; avoid generating unused large variants for every upload. Public quality settings of 90/100 merit visual comparison at smaller sizes/qualities. Keep responsive sizing and lazy loading, reserve image dimensions, and treat the first visible image separately from the rest of a gallery. Admin previews should load small direct-storage images.

Vercel image configuration is duplicated in `next.config.ts` and manually expanded `vercel.json` patterns. Verify parity after upgrades and Services changes. Do not remove Services-specific configuration solely because it looks redundant without testing the deployed image endpoint.

**Canonical URLs are wrong on multiple live pages.** `/gallery`, `/events`, `/about`, and `/shop/monthly-membership` all declared the site root as canonical. The root layout defines `alternates.canonical: '/'`, and these pages inherit it. Give each indexable page its own canonical path. Template post metadata also needs the `/posts/` route prefix; Posts/Search are currently deliberately excluded from indexing, so their sitemap absence is not automatically a defect.

Measure the following before and after reliability changes: public cache-hit ratio, regeneration time and error rate, database queries per regeneration, browser image bytes, failed image requests, mobile LCP/INP/CLS, and admin upload/picker responsiveness. Choose performance budgets after taking representative baselines; the current spot checks do not justify invented targets.

## 6. Admin UX work after reliability

The current workflow separates Media uploads from Gallery Item creation. Payload's media upload capabilities do not automatically create gallery records. Folders are enabled but unused in the snapshot. Repeated bowling titles and default order values make a large set harder to manage.

Recommended first complete workflow:

1. Choose photos in a batch, optionally assign an album/event, date, category, and shared caption defaults.
2. Show thumbnails immediately, upload with bounded concurrency, and report progress/errors per file. Support retry/cancel without losing successful uploads.
3. Use collision-safe storage keys; warn about likely duplicates without silently discarding intentional reuse.
4. Create draft Gallery Items explicitly associated with the batch, with editable titles, alt text, captions, and drag ordering.
5. Provide one review/publish action with clear success and public freshness feedback. Batch invalidation after commit rather than invalidating the whole site for every file.
6. Support paging/filtering and batch edits in admin and intentional pagination on the public gallery. Preserve relationships when photos are reused elsewhere.

Do not automatically publish every Media upload into Gallery: the same collection also stores event flyers, logos, team photos, and document conversions. Start with this gallery-specific flow, then simplify navigation and remove irrelevant template collections/features according to actual club needs.

## 7. Recommended delivery order

| Order | Deliverable | Completion evidence |
| --- | --- | --- |
| 1 | Safe local/test environments; disable production seed; correct preview/public access checks | Tests cannot reach production accidentally; unauthorized preview/draft reads fail; production seed endpoint disabled. |
| 2 | Correct storage key/metadata handling and repair existing Media references | Concurrent/duplicate-name upload tests; all originals/variants valid; admin picker and Gallery Item 20 show previews; no overwritten originals. |
| 3 | Reliable ISR error handling, finite fallback interval, scoped invalidation, and observability | Production-mode lifecycle/outage tests; no cached demo content; repeated independent deployed-client publish checks without a redeploy. |
| 4 | Empty-state, ID, ordering, pagination, canonical, migration, and compatible dependency fixes | More than 100 items remain accessible; intentional empty states; correct URLs; repeatable migrations/build. |
| 5 | Batch gallery workflow and broader editorial simplification | A representative 20–100-photo batch can be uploaded, reviewed, reordered, published, and partially retried without duplicate items or lost work. |

Keep storage prevention and historical-data repair as separate, reviewable steps with a shared verification gate. A successful database update alone is not sufficient proof of public freshness or working media.

## 8. Validation completed and remaining limits

Completed:

- Live admin Gallery Item 20, Media listing, gallery creation picker, public gallery, and deployed cache responses inspected.
- Production database exported read-only and restored into isolated local Postgres on port 55439. Local build/server used explicit local DB settings, with production Blob writes and outgoing email disabled.
- `npm run build`: passed, including TypeScript checks and generation of 28 static pages/routes.
- `npm run lint`: passed with zero errors and seven existing warnings.
- Eight existing frontend Playwright tests: passed against the isolated production server on port 3100.
- Local Gallery create/edit/unpublish/republish/delete; Product create/rename/delete and sitemap; Club Settings update/restore: passed current normal-path behavior.
- Local outage, empty gallery, and 109-item gallery tests: reproduced defects described above.
- Proposed media metadata repairs applied locally; 42 original/thumbnail GETs returned 200.
- Approved production test item published, observed, deleted, and cleanup verified.

Remaining verification for implementation: full upload/replace/delete/focal-point/conversion matrix, every repaired derivative via GET, scheduled jobs, full admin test suite under safe isolation, multi-region/concurrent publishing, failed/rolled-back transactions, browser back/prefetch behavior after edits, and real mobile performance measurements. The audit did not perform a comprehensive security penetration test or email/payment processing test.

### Local evidence and handling

Sensitive local artifacts are under `/tmp/serenity-audit-20260915` in a restricted directory, including the database backup and local environment/test credentials. These are intentionally outside Git and must not be attached to a PR. The copied database includes production records; keep it local and use it only for this investigation/repair work.

Non-secret repair and HTTP evidence is preserved in `output/site-audit-2026-09-15/`. The repair manifest is a proposal tied to this snapshot, not permission to apply stale changes blindly. Original/thumbnail files downloaded for the local test are in ignored `public/media`; the inventory of files created by this audit is retained with the local evidence. No remote storage objects were deleted.

The isolated web server and Postgres instance were stopped after testing. The copied database and restricted backup remain available for the repair work. The temporary local API token was removed. The unrelated application on port 3000 was left running.

## Production media repair completed

On September 15 at approximately 8:50 PM EDT, deployment `dpl_EV3vS2VngEFy2XNNC5u6AFA2bMC8` (hotfix commit `e82c891`) became production. Its pinned adapter patch prevents new filename corruption. A fresh dry run validated all 21 affected records and their candidate storage objects, and a restricted per-record backup was written before updates. The repair corrected 21 original filenames and 131 size filenames without replacing or deleting stored files. Public caches were invalidated after completion.

Verification: all 238 original/size URLs referenced by the 44 production Media records returned HTTP 200 (one transient download failure passed on retry). Chrome visibly showed the repaired thumbnail on Gallery Item 20 and thumbnails throughout the existing-media picker. The public gallery used the restored original filename. The production gallery remains at its original 19 published records.

Raw verification results and rollback metadata remain local and ignored. The baseline observations elsewhere in this audit describe the pre-fix state; see the focused implementation commits and `docs/operations/` for current behavior.
