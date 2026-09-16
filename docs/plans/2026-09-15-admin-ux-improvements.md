# Admin improvements — plan for review

Prepared September 15, 2026; expanded after the final public-site/source pass and the user's dues, meeting-format, and DOCX clarifications. **Implementation started locally; not yet released.** This plan follows the [full admin UX audit](../audits/2026-09-15-admin-ux.md). Finding IDs A01–A27 refer to that report. The design below remains the target; the implementation status distinguishes tested work from remaining work.

## Implementation status

- Committed correctness patches: date-aware legacy recurrence (`84d3f43`), gallery publish-time image validation (`3152556`), and explicit rejection of multi-page Word flyers (`81ec440`).
- Committed workspace foundation (`9985cc0`): task dashboard, section directory/help, restricted manager tools, readable forms, larger selected-image previews, and a paginated visual library picker. A production-mode local build passed; browser checks passed for save/reload of a selected image, Escape/focus return, 320px layout, and anonymous access restrictions. The fifth album task and monthly readiness depend on later schemas.
- Structured meetings were committed in `ca30472`: additive sessions/exceptions, weekday checkboxes, date preview, safe legacy backfill, and a shared public occurrence resolver. The local migration and seven date-rule tests plus an integration test passed. See the [11-record migration review](../audits/2026-09-15-meeting-migration-review.md). The planned weekly overview/editor polish and actual format/attendance confirmation remain outstanding.
- The monthly-flyer implementation now retains immutable Word originals and separate rendered images, checks source/image matching at publication, offers retry after conversion failure, selects the current month for public pages, and retains a recent archive. The dashboard flags the missing current month and links directly to its editor. A production-mode browser regression passed for original bytes/hash, retry reuse, replacement, private draft access, failed multi-page conversion, and successful subsequent publication.
- Real Gmail source material has been obtained locally: the September Word flyer plus September 18 movie-night and September 19 bake-sale images. The September Word document completed upload, conversion, draft save, and publication in the isolated local site; a separate browser saw its public result without rebuilding. Original files and email data are ignored local fixtures, not repository content. Nothing from those messages has been uploaded to production yet.
- Dated events now use explicit dates, known/all-day/unannounced time choices, upcoming/past views, and an optional homepage feature. Recurring announcements read the authoritative meeting schedule, including date exceptions. The two real Gmail image updates were published locally through the editor and seen by an independent visitor without rebuilding. Small fixed choice lists now use native labeled dropdowns. All 42 unit tests, lint, type checking, and the production build passed; linked-event cache invalidation is covered by a production-mode browser regression.
- Dues now has a dedicated draft/versioned editor with automatic/chosen/off/legacy modes, this-month/next-month and phone previews, matching-artwork publication checks, and accessible public text. The earlier poster remains retained; migration does not switch it automatically. Unit tests cover Clearwater month/year rollover and hiding expired artwork; integration tests protect draft wording/version access; the production-mode browser test covers draft isolation, publication freshness, and turning the notice off. The five-minute request-driven rollover bound still needs a deployment measurement.
- Remaining release work includes the rest of phases 1–5, production migration/deployment/smoke checks, and volunteer acceptance. The optional AI pilot still needs a provider, data-handling decision, cost limit, and runner; manual monthly publishing must not depend on that decision.

## Recommended direction

Keep Payload, its database, authentication, draft/version support, and the site's fast public rendering. Add a small, purpose-built workspace for the club's frequent tasks.

The editor should be able to answer three questions throughout a task: **What am I changing? What will visitors see? Has it been published?**

Prioritize accurate meetings, this month's events and dues reminder, and adding many photos. Introduce albums as real public content, preserve ungrouped gallery photos, and prepare the existing post editor for a later News & updates launch. Retain original Word documents and the rendered flyer now so optional, reviewed DOCX-to-event extraction can be added later.

The plan does not include replacing the CMS, a general drag-and-drop website builder, payment processing, membership records, or an approval chain for every ordinary edit.

## The proposed admin

### Home

A simple dashboard headed “Manage the Serenity Club website,” with five large, clearly labeled actions:

| Task | Information shown with the action |
| --- | --- |
| **Update this month's flyer** | Month, current flyer preview, whether this month is missing, and “View Events page” |
| **Update dues reminder** | Current month/message and About-page preview; flag artwork for another month |
| **Change a meeting** | Today's/this week's schedule, day-specific formats, and details needing confirmation |
| **Add photos** | Recently added photos, unfinished upload batches, and “View Gallery” |
| **Create an album** | Recent albums, their covers, and publication status |

Below these: “Continue editing” for meaningful drafts, “Recently published,” and short illustrated help. A compact monthly checklist can show flyer and dues readiness plus meeting changes to review, with **Checked and still correct** where appropriate. Do not show empty technical collections, system jobs, raw errors, or unnecessary analytics.

### Navigation

~~~text
Home
Events & flyers
Meetings
Photos & albums
News & updates                 [when ready to launch]

Website details
  Contact & hours
  Homepage wording & pictures
  About & membership dues
  Giving & sponsorship information
  Group & facility information
  Board & team
  Memberships & shop
  Club rules

Manager settings
  Top menu / Bottom menu
  Donation & social links
  People with access
  Advanced tools

View website   ·   Help   ·   My account
~~~

The Photo & file library is available inside photo/flyer selection and as a secondary management view. Files, internal folders, upload batches, public photos, and albums remain distinct concepts in the data, but editors should not have to visit all of them to complete one task.

Offer a secondary **Edit a section of the website** directory: choose a public page, recognize a section from its title/preview, and follow its edit link. Start from the audit's ownership map. This is an authenticated admin aid; anonymous public pages must retain their cacheable rendering without a new session lookup.

This uses Payload's documented dashboard/view extension points and preserves its standard admin components where they work well. It should not require Payload's separate enterprise visual-editor product. [Payload custom views](https://payloadcms.com/docs/custom-components/custom-views).

## The four core workflows

### 1. Update this month's events

**Monthly flyer**

1. Choose **Update this month's flyer**. The screen defaults to the current month in Clearwater and shows the current published flyer beside the proposed replacement.
2. Choose an image or supported document from the computer/phone or library. Show a readable full-page preview, including zoom. State supported formats and limits before selection.
3. Check the month and add/update the accessible text details. Preserve a flyer-first workflow; creating a dozen separate event records must not be a prerequisite for replacing a flyer.
4. Preview the Events page and homepage placement. The action says **Publish September flyer**, using the chosen month.
5. Show **Published on the website**, the public link, and how to restore the previous version.

Use a separate monthly-flyer record with month/year and an archive. Next month's draft must not overwrite this month's public flyer. Flag a missing current month; do not silently describe the previous month as current. Decide whether older flyers remain publicly archived. Updating the existing month should replace its current version rather than create duplicate competing entries.

For Word documents, the first release should explicitly support **one-page flyers**, with a helpful error for multi-page files. If representative club documents need more pages, add a deliberate all-pages/page-selection design before accepting them. Preserve the original DOCX separately from the rendered image, with a source version linked to that month's flyer. Source retention is required for the requested future extraction and reuse, not an optional afterthought. Retain older source versions on replacement, and make source downloading an intentional access choice. Never silently publish page one of a larger document.

Later, **Find events in this document** can propose individual events for review while **Publish flyer only** remains available. Publishing the flyer never depends on completing or paying for AI extraction. The dedicated future workflow below defines those boundaries.

**Individual events**

Offer a second action, **Add an event**, with title, date, start/end time or “All day,” location, short description, optional picture, and optional details link. Provide upcoming/past views and an explicit homepage feature choice. Use structured dates to sort and archive accurately.

Recurring speaker/board events should reference their authoritative meeting schedule where appropriate. Editors should not need to maintain the same day/time in two collections.

### 2. Change a meeting

1. Find the meeting/group by name, fellowship, day, or time. Display a readable weekly agenda; provide a list alternative.
2. Edit **Meeting name**, **AA / NA / Club service**, and shared details. Under **Weekly schedule**, show Monday–Sunday rows on a computer and stacked day cards on a phone. Each day shows whether it meets, time, format, optional book/topic, room, and whether these details have been confirmed.
3. Offer **Same on selected days** for common values, followed by clear per-day changes. Editing a book study on one day must not change the other days. Allow another session on a day without making the editor understand a new database collection.
4. Keep **Who may attend** distinct from **Meeting format**; offer **Not yet confirmed** instead of forcing an unsupported choice. Do not infer open/closed attendance from “open discussion.” Confirm field wording with the club; use fellowship-appropriate choices rather than imposing AA labels on every group.
5. For recurrence, offer **Every day**, **Certain days each week**, or **A particular week of the month**. Monthly choices use words such as “Second Wednesday,” with a preview of the next actual dates. Put group business meetings here as explicit sessions instead of burying them in prose.
6. Preview **What visitors see on [chosen date]**, including that occurrence's format. Ask “From what date?” when changing future recurrence. Provide a separate **Cancel or change one date** action.
7. Publish and show every affected public location. Preserve the previous version for recovery.

Store local time and recurrence structure with America/New_York as the club timezone. Do not expose cron expressions, RRULE text, weekday numbers, or UTC conversions to editors.

The “Open discussion and book study” issue requires day-specific values, not merely replacing free-text Days with checkboxes. TGIF's existing description and hardcoded notes claim particular Tuesday/Thursday studies, but the user has not confirmed those assignments. Carry those strings into a migration review report as legacy evidence, not into verified schedule fields. Ask the group's designated person to confirm the schedule; record **Last checked** and who checked it without exposing private contact details publicly.

Unknown format details should remain **Needs confirmation** in admin and should not produce an inaccurate public format badge. Independently confirmed times and days can remain available. Do not replace an unknown day with an invented “discussion” default or claim both formats every day.

Model a group/series with explicit recurring sessions and dated exceptions behind this simple interface. Resolve a specific-date change before a monthly variation, and a monthly variation before a weekly default; block ambiguous overlapping rules rather than silently choosing one. Additional monthly sessions must be distinguished from changes to an existing session. Use one resolver for Today, the full schedule, homepage summaries, and future print/calendar output. Test last/fifth-week patterns, month boundaries, multiple sessions, and canceled or moved occurrences.

Bring group notes into the CMS alongside the relevant group/meeting. Remove misleading Order and External URL controls until they have a defined public effect. Warn about apparent overlapping meetings in the same room without assuming every overlap is prohibited. Define whether public counts mean groups, recurring sessions, or occurrences per week so splitting a schedule into day-specific rules cannot inflate a misleading “meetings” count.

The first correctness patch can fix the current range/ordinal bug before the structured editor is ready. The migration must then verify each of the 11 existing schedules with a human-readable before/after report, including time, recurrence, format, and duplicated notes. Ambiguous text requires review, not a guess. The public-site correction still needs that factual verification even though the interface can be designed now.

### 3. Add photos, with or without an album

~~~mermaid
flowchart LR
  A[Add photos] --> B[Choose many files or library photos]
  B --> C{Where should they go?}
  C --> D[Main gallery - no album]
  C --> E[Existing album]
  C --> F[New album]
  D --> G[Review large thumbnails]
  E --> G
  F --> G
  G --> H[Publish selected ready photos]
  H --> I[View gallery or album]
~~~

**Selection and uploading**

- Use **Choose photos** as the primary control; drag/drop is optional. Permit multiple selection from phones as well as computers.
- Offer three explicit destinations: **Main gallery — no album**, **Existing album**, and **New album**. Creating an album is never mandatory.
- Show a thumbnail for every selected photo as soon as practical, with progress and an understandable filename/display name.
- Upload and process a bounded number at once. Report individual failures, retain successes, and let the editor retry only failed files. A retry must not create duplicate photos.
- Keep an upload-batch record so the editor can return to ready/failed items after navigation or session expiry. Browser refresh recovery may require reselecting local source files; do not promise automatic recovery of bytes the browser no longer has.

**Review**

- Use large image cards and an enlarged preview. Display orientation correctly.
- Let editors set a shared event/album name and optional date once. Do not require the same title 30 times. Optional per-photo captions and accessibility descriptions remain editable.
- Exclude unsuitable files and flag exact duplicate content where feasible; filenames alone are not reliable duplicate detection.
- Let editors remove a photo from this batch without deleting a previously shared library asset.
- Offer **Make album cover**, with preview of the cover crop, and reordering through both drag and move buttons.
- If some files failed, say “28 photos ready; 2 need attention.” Default to fixing the failures, with an explicit **Publish the 28 ready photos** option if partial publication is wanted. Never silently discard failed photos.

**Publication**

Create draft gallery records automatically from ready assets. Publishing shows a count and destination, verifies complete images, and preserves the ability to resume after a partial failure. Use a server-side publication boundary for an album so visitors do not see a half-created album as though it were complete.

Keep separate messages for **Uploaded**, **Ready to review**, and **Published**. Offer “View on website” and return to the same review position after inspecting a photo.

**Album rules proposed for the first version**

| Concept | Proposed rule |
| --- | --- |
| Photo | One gallery record references one library asset; optional album membership |
| Ungrouped photo | Visible in the main gallery when published |
| Album | Title, optional date/description, cover, ordered photos, draft/published status |
| Membership | One optional album per gallery photo initially; the underlying asset can still be reused elsewhere on the site |
| Album visibility | Album page and cover require a published album; its displayed photos also require published photo records |
| Main gallery | Ungrouped photos plus album covers; do not dump every album's contents into the landing page by default |
| Removing from album | Offer explicit choices: move to the ungrouped gallery, move to another album, or remove from public display |
| Unpublishing an album | Hide the album and its member photos from public gallery views; do not automatically move them into the ungrouped gallery |
| Deleting a library file | Separate manager action, with usage checks and recoverable handling; never a side effect of removing a photo from an album |

These are defaults for review. If a photo must belong to multiple public albums, use an album-membership model with per-album ordering instead; settle that before migration. No database content should be automatically grouped solely because titles or filenames happen to match.

The existing 17 bowling photos are a good candidate for an initial album after the club confirms that grouping and its cover. The other two photos can remain ungrouped.

Public Blob URLs are currently readable independently of gallery publication. These publication rules control website inclusion; they do not create private file storage. Add private review storage only if the club requires it.

### 4. Update the membership dues reminder

1. Choose **Update dues reminder** from Home. Show its actual placement on About, including a readable preview of the current graphic/message.
2. Choose **Use the current month automatically** or **Choose a month**. The automatic option is a recommended default for review, not an assumption about the club's policy. Display the resolved month/year and allow a deliberate override.
3. Edit the short reminder text and optional membership-information link. Offer optional artwork, with its associated month when applicable. Ordinary month changes should not require making a new picture.
4. Preview the result on About, with **This month / Next month** and phone/computer views. Publish with a clear result and previous-version recovery.

Use accessible real text styled as a branded reminder, retaining decorative artwork if wanted. Keep a legacy uploaded-poster option during migration with an accurate description and equivalent reminder text. Do not render a logo description for a dues notice. W3C recommends text where the same presentation can be achieved without an image of text. [Images of text](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html).

Store month-specific artwork separately from reusable decoration. Flag a mismatch and require an explicit correction or removal before publishing; automatic rollover must not combine a new month with last month's lettering. Let editors turn the notice off. Preserve the existing image during migration and keep real header branding separate. A payment link, if offered, must point to a confirmed existing destination; this feature does not track who has paid or alter checkout prices.

**Calendar behavior is part of correctness.** Derive the current month in America/New_York and verify September/October and December/January transitions without an admin save or redeployment. The current ISR interval is request-driven: an idle site does not regenerate itself at midnight, and the first later request can receive stale content while regeneration starts. Set and measure a freshness target for automatic mode under regular traffic, initially the existing five-minute interval plus regeneration time, and test the first visit after an idle period separately. If the club requires exact midnight changes, select and verify a suitable timed or client-side boundary mechanism before promising it. Do not imply that disabled scheduled publishing already provides this behavior.

A later **Temporary notice** action can share the preview pattern for closures or unusual hours, with a start/end, affected pages, and a clear removal action. A closure notice must explicitly identify any affected meeting occurrences; it must not silently cancel a whole schedule. Time-limited notices require tested expiry/cache behavior and should take visual priority over a routine dues reminder.

## Common editing standards

| Current label/behavior | Proposed editor-facing behavior |
| --- | --- |
| Collections | Remove from everyday vocabulary; show tasks/content names |
| Gallery Item / Create New | Photo / Add photos |
| Media | Photo & file library |
| Date Label / Time Label | Structured date/time or a dedicated Month control |
| Hero Image | Homepage picture or Cover photo, depending on actual use |
| Logo Image on About | Membership dues reminder artwork; show its actual location |
| Format applied to all meeting days | Meeting format for this day/session; separate attendance and confirmation fields |
| Alt / Image Alt Text | Description for people who cannot see the photo, with an example |
| Caption vs Description | Caption shown below this photo; one authoritative visible value |
| Optional URL | Link for more event details |
| Order = 100 | Visible position; Move up / Move down |
| Slug | Automatic website address; advanced editing only when needed |
| Fulfillment Note | How to buy or collect this item |
| Header / Footer Navigation | Top menu / Bottom menu |
| API / Search Results | Advanced/internal tooling |
| Save on a global/shared file | State what changes immediately and where it appears |
| Submit on password recovery | Send password reset email; club identity and a help route |

Use draft autosave for meaningful work plus an explicit publication action. Preserve clear distinctions among a new draft, a published item, and unpublished changes to a published item. Avoid repeatedly creating empty records just by opening a screen. Show when work was last saved and do not replace an original shared file as a hidden side effect of saving a private draft.

Expose version history as **Previous versions**, with date, editor, and a preview of the version being restored. Use **Move to trash** for recoverable deletion and distinguish it from removing a gallery placement. Payload provides drafts/autosave and Trash; Blob retention, relationships, and restoration need application verification. [Drafts](https://payloadcms.com/docs/versions/drafts), [Trash](https://payloadcms.com/docs/trash/overview).

Use approximately 44px main controls and 16–18px ordinary form text as initial design targets. Keep visible labels, keyboard operation, focus return, 200% zoom, 320px reflow, and tested contrast. Preserve the user's theme choice. These targets supplement WCAG criteria; they are not a claim that every current control violates a size requirement. [W3C target sizes](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Give errors next to the field and in a linked summary, retain entered content, and explain a next step. Upload progress and publication results should be available to assistive technology as well as visible on screen. [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/), [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

Use the audit's public-section ownership map as an implementation checklist. Contact hours must update repeated introductions as well as contact cards; address and map changes need a combined preview. Give maintainable sponsorship terms, group/facility details, and shared access rules a named home. An empty Sponsors list must not hide active sponsorship information. Remove or explain settings with no public consumer, such as the current Instagram URL, and make the scope of metadata/share-image controls explicit. Keep stable page layout in code rather than exposing an unrestricted builder.

For occasional maintenance, show **Last checked**, a named responsible role where useful, and a short **Needs attention** list. Prioritize stale monthly information, unresolved meeting details, and interrupted batches; avoid a noisy score or mandatory review for every ordinary edit. Email reminders or external notifications would be a separate opt-in decision, not part of this audit.

## Later News & updates

Build on the existing Posts/Lexical implementation. The standard writing surface should contain title, optional cover, article body, preview, saved status, and publication controls.

Provide a persistent toolbar with paragraph, headings 2/3, bold, italic, bulleted list, numbered list, link, quote, and image/caption. Remove Code from routine authoring, avoid additional H1s in the body, and make image insertion say **Add photo**. Match the site's typography sufficiently for the preview to be trustworthy. Test pasted Word/Google Docs content without retaining arbitrary fonts or losing useful structure. Payload supports these ordinary features. [Rich-text features](https://payloadcms.com/docs/rich-text/official-features).

Automatically supply a stable URL and useful default metadata, with optional advanced overrides. Make authorship an intentional club choice rather than a required technical relationship. Use News & updates as the recommended public label, subject to review.

The launch must also address public navigation, route/canonical choices, post-list outage behavior, indexing/sitemap, accessible rendering, images, pagination, new-post ISR visibility, and any redirects. Offer scheduling only after the runner is operational and verified; a publication-date field alone does not schedule anything.

## Future DOCX assistant: keep the flyer and create real events

This is an optional later feature. Its purpose is to reduce transcription while leaving a volunteer in control of what the website says. The existing converter does not implement it.

~~~mermaid
flowchart LR
  A[Upload Word document] --> B[Keep original and render flyer]
  B --> C[Review and publish flyer]
  B --> D[Optional: find possible events]
  D --> E[Compare suggestions with source]
  E --> F[Create selected event drafts]
  F --> G[Preview and publish reviewed events]
~~~

**What an editor sees**

- After uploading, the ordinary flyer preview remains available. **Find events in this document** starts optional background work and explains what will be suggested. **Publish flyer only** remains available even when extraction fails.
- Show a result such as “8 possible events; 2 need details,” with the source page/excerpt beside editable event cards. At phone width, provide a simple **Source / Event details** switch without losing the current card.
- Each proposal has title, date, start/end time or all-day, location, description, and a visible source reference. Missing year, conflicting weekday/date, absent time, unclear recurrence, and possible duplicates get specific explanations. Do not invent values or present an uncalibrated model confidence percentage as assurance.
- Editors may correct, exclude, or add events the assistant missed, then **Create selected drafts** and preview the results. A separate explicit publication step can publish the reviewed set with a count and public destination. Suggestions alone never publish or modify recurring meetings.
- Replacing the document shows **New / Changed / Unchanged / No longer found** suggestions. Preserve manual edits and let the editor choose which changes to apply. An event absent from a newer flyer is not automatically canceled or deleted.

Make mistakes easy to inspect, correct, and dismiss rather than asking an editor to trust an opaque result. The source comparison is a proposed club-specific design applying Microsoft Research's human–AI interaction guidance. [Guidelines and research](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/).

**Processing and data requirements**

Preserve the original file, its version/hash, conversion output, extracted text, and a link from each created event to its source/version. Keep document paragraphs and tables when extracting; use rendered-page OCR/vision where text exists only in images or visual layout supplies essential date relationships. Headers, text boxes, calendar grids, and multi-page layouts need representative fixtures before being advertised as supported. Native Word structure is available, but parsing plain text alone does not guarantee a correct calendar interpretation. [WordprocessingML structure](https://learn.microsoft.com/en-us/office/open-xml/word/how-to-open-and-add-text-to-a-word-processing-document).

Validate suggestions against the Events schema, local timezone, and date rules. Store ambiguous fields as incomplete and require resolution before publication. Treat uploaded document instructions as document content, not authority for the model to follow links, run tools, or change permissions. Select the model/provider and retention policy explicitly, send only necessary document content, and establish document-size and cost limits before enabling the service.

Use resumable background work with bounded concurrency, timeouts, cancellation, limited retries, and stable import identifiers so retries cannot duplicate events. Payload's Jobs Queue offers task/retry infrastructure, but a functioning execution runner is still required; the current disabled scheduling arrangement is not that runner. Choose deployment-compatible processing explicitly and keep expensive parsing outside ordinary admin requests. [Payload Jobs Queue](https://payloadcms.com/docs/jobs-queue/overview).

Keep flyer publication independent from event extraction and make partial outcomes visible. A job failure must leave the original, rendered flyer, and accepted drafts usable. Re-import needs an event/source mapping and a comparison against subsequent human changes, not simply another set of inserts. Undo should identify which records this import created and protect unrelated or later edits.

**Pilot gate**

First collect representative club DOCX files and a manually verified expected event list. Include tables, ambiguous/missing dates, multiple pages, image-only content, a corrected re-upload, and no-event documents. Measure field accuracy and missed/extra events separately; every published proposal must have a source or an explicit human correction. Verify retries, dismissal, manual-edit preservation, and flyer-only use during extraction failure. Pilot with actual volunteers before choosing any automation beyond reviewed draft creation. No automatic publishing is proposed.

## Further opportunities and boundaries

| Opportunity | When it becomes useful | Proposed scope |
| --- | --- | --- |
| Monthly readiness checklist and section directory | With the first task dashboard | Show the relevant monthly work and lead directly from a familiar public section to its editor |
| Temporary closure/change notice | After shared settings and reliable time boundaries | A small reusable notice with dates, scope, preview, and explicit meeting-exception links |
| Printable schedule / calendar subscription | After verified structured meetings | Generate from the same resolved schedule; stable calendar IDs, exceptions, and timezone handling; no second manually maintained schedule |
| Reusable event/monthly templates | After drafts and source retention | Copy useful structure into a new draft; highlight copied dates, amounts, and month-specific pictures for review |
| Narrow writing/photo assistance | After the DOCX pilot proves useful | Optional description or wording proposals; never infer people's identities or recovery status; retain direct editing |
| Room/volunteer inquiry forms | Only if the club wants to replace email requests | Named recipient, tested delivery, spam handling, and retention; no implied automatic booking or membership CRM |

These ideas do not all belong in the next release. Prioritize by observed volunteer difficulty and maintenance burden after the four core workflows are tested. A generic chatbot, public member database, and fully autonomous content publication are not proposed shortcuts.

## Delivery sequence and focused commits

Sizes are relative planning estimates, not calendar commitments: **Small** = localized configuration/UI change; **Medium** = coordinated components and validation; **Large** = new workflow plus schema/migration and end-to-end tests.

| Phase | Deliverable and suggested commit boundaries | Size | Audit findings |
| --- | --- | --- | --- |
| **0. Correctness and immediate clarity** | Meeting-day/ordinal correction with meaningful date tests; inventory and obtain human confirmation of misleading format claims; separate correction of ineffective labels/help, including the dues graphic; explicit multi-page DOCX handling; gallery publish-time image validation | Medium | A03, A04, A12, A14, A15, A24, A25 |
| **1. A useful everyday workspace** | Five task shortcuts, monthly readiness and section directory; separate readable forms/named controls/responsive fixes; separate visual photo picker and selected-image preview; status columns/public links | Medium | A01, A07–A10, A18, A22, A24, A26 |
| **2. Meetings and monthly updates** | Additive per-day format/recurrence and monthly-flyer schema with reviewed backfill; separate weekly editor/shared public resolver; separate source-preserving flyer/event flow; separate dues template/month controls; preview/autosave/version recovery | Large | A02–A04, A09, A13, A14, A24, A25, A27 prerequisite |
| **3. Bulk photos and albums** | Additive album/batch schema; separate upload/retry/deduplication service; review/publish UI; minimal public album landing/detail integration; existing-photo migration and acceptance tests | Large | A05–A07, A10–A13, A23 |
| **4. Recovery and less frequent work** | Trash/file-usage safeguards; separate settings/menu and shared public-copy improvements; shop/rules/team simplification; permission and onboarding improvements; optional temporary notices with tested expiry | Medium–Large | A11, A15, A18–A22, A26 |
| **5. Public gallery polish and News launch** | Separate public photo viewer/mobile browsing change; separate curated news editor; separate public news routes/indexing/cache behavior; enable optional scheduling only with a verified runner | Large | A16, A17, A23 |
| **6. Optional DOCX-to-events pilot** | Source extraction/provenance and bounded background jobs; separate editable source-comparison review; separate draft creation/re-import protection; fixture evaluation and volunteer pilot | Large | A14, A27 |

The core gallery flow in phase 3 needs a usable public album destination; the richer lightbox/swipe/public-gallery redesign remains phase 5. That prevents introducing an admin “Publish album” button whose result visitors cannot access.

Phases 2 and 3 can be reordered after phase 1 if bulk gallery publishing is the more urgent operational need. File-use safeguards required by a new workflow must ship with that workflow, even if the broader recovery improvements are grouped in phase 4.

Phase 6 depends on phase 2's structured events, preserved source documents, and reliable publishing; it need not wait for News or a public gallery redesign if the club later prioritizes it. It must not delay manual monthly updates. Factual meeting verification is a separate club input, not something AI or a migration may supply by inference.

Each code change should be a focused, reviewable commit. Keep schema migrations separate from major UI changes when practical, regenerate Payload types/import maps as required, and update the help material alongside each released workflow. The audit and this plan are documentation commits, not a release of these proposals.

## Implementation constraints

Preserve the current reliability foundation:

- New custom views must call authenticated Payload operations with appropriate access checks. Server-side Local API calls acting for an editor must respect that user's access; a hidden menu or client validation is insufficient.
- Keep the same request/transaction context through related operations. Do not bypass collection hooks using direct SQL for live editorial writes.
- Retain the existing public-mutation wrappers, post-transaction invalidation, and finite ISR fallback. Add cache tags/routes for albums, monthly flyers, dues, notices, and changed meeting dependencies. Test time-driven changes without a save as well as publish-driven changes. Avoid one whole-site invalidation per uploaded file where a batch can be grouped safely.
- Do not make public pages depend on an authenticated admin session or download all full-resolution photos to display a picker. Fetch bounded pages of thumbnails and keep the public gallery paginated.
- Preserve the repaired storage metadata and pinned Blob-adapter regression safeguards. Display names must not overwrite storage filenames. Test duplicate names, replacement, focal points, and delete/restore behavior.
- Use additive migrations and production backups. Keep current IDs/URLs, alt overrides, publication states, and order until a reviewed migration deliberately changes them. Do not treat seeded meeting prose as verified or discard the current dues image when separating it from branding. Existing converted images may require the club to supply their original DOCX; do not promise to reconstruct an original document from a picture.
- Keep local development/tests isolated from production DB, Blob writes, and email. Use copied content only in that isolated environment.
- Never interpret a content-read failure as a successful empty collection. Draft previews remain authenticated and must bypass the published cache safely.
- A new photo workflow needs server-side file/size/type validation and bounded image/conversion work. Establish supported formats with real fixtures before advertising them.

No additional subscription is assumed for phases 0–4. A scheduling runner, private photo storage, a different conversion/processing service, or AI extraction could introduce operational cost and should be selected explicitly if required. Provider choice and spending limits belong to the optional AI pilot; ordinary editing must remain usable without it.

## Acceptance scenarios

Use realistic copied content locally/staging first. Use a small, explicitly scoped production smoke test after each release, and clean up only test content.

| Scenario | Release acceptance |
| --- | --- |
| Replace this month's flyer | Editor finds it from Home, sees old/new previews, publishes the right month, and sees the result on both affected public pages without redeployment; previous version can be restored |
| Preserve and replace a Word flyer | Original DOCX and rendered preview remain separate and linked to the correct version; replacing the flyer preserves the old source; extraction is not required |
| Upload a two-page Word document | UI explicitly rejects it with instructions or presents the approved multi-page workflow; no silent first-page-only success, including future extraction |
| Update dues reminder | Editor finds it by its actual name, edits month/text/artwork, sees the About preview, publishes without redeployment, and can restore the previous version; real header branding is unaffected |
| Dues month rollover | Automatic/manual/off modes behave as labeled across local month/year boundaries without a save; no stale month-specific artwork under new text; verify and document measured cache freshness |
| Add a dated event | Upcoming/past placement, date/time, optional link, and homepage inclusion are predictable; draft is not publicly visible |
| Correct Feelings | Monday–Saturday recurrence appears on all six days and never Sunday, including the “Today” view |
| Monthly board meeting | Second Wednesday appears on the correct date, not every Wednesday; next-date preview and public display agree |
| Change one meeting date | One exception changes without changing the rest of the recurring schedule; old hardcoded notes cannot contradict it |
| Different formats on different days | A synthetic fixture has discussion on one selected day and study on another; changing one leaves the other intact; Today, full schedule, and date preview agree; fixture assignments are not claims about the club |
| Unknown meeting information | Unconfirmed formats remain visibly unresolved in admin and are not invented publicly; confirmed time/day remains usable; the club can record verification without changing other sessions |
| Complex recurrence | Multiple sessions, monthly variations versus additional sessions, last/fifth-week rules, effective dates, DST, and cancellations resolve consistently; ambiguous overlap is surfaced |
| Add 30 ungrouped photos | One multi-select flow creates/publishes all intended photos, no album required, no repeated title entry, correct orientation, and a clear public result |
| Create a 50-photo album | Shared title/date entered once; cover/order reviewed; draft isolation and album publication are correct; all expected photos are reachable |
| Upload failure and retry | Mix valid, unsupported, duplicate, large, and failed files; successes remain; failed items have actionable messages; repeated retry/publish creates no duplicate records |
| Refresh/session expiry | Meaningful draft/batch state survives; ready files are recovered; source reselection is clearly explained if necessary; login recovery returns to the task |
| Remove and recover | Removing gallery placement does not delete a reused homepage file; trash/restore works for records and stored images; public caches reflect both operations |
| Edit menus/settings | Built-in pages are selectable by name; payment destination and contact changes show their scope; hours agree across repeated text; address/map are checked together; blank/footer behavior matches help text |
| Temporary notice, if included | Correct affected pages and dates; expiration works without redeploy; unrelated meetings are not canceled; normal hours remain intact |
| Concurrent edits | Two editors cannot silently overwrite one another; verify Payload locking/conflict behavior in the custom flows and show a recoverable conflict when needed |
| Future rich post | A volunteer pastes content, formats a list, adds an image/caption, previews on phone/computer, publishes, edits, and restores a version without using technical fields |
| Future DOCX extraction | Real fixtures produce reviewable source-linked drafts; missing/ambiguous fields need correction; editor can add missed events or dismiss suggestions; no self-publication or silent meeting edits |
| Future re-import/failure | Repeated requests create no duplicate events; document changes show a reviewable diff, preserve manual edits, and never cancel absent events automatically; extraction failure leaves flyer-only publishing available |
| Access boundaries | Routine editor cannot manage accounts/permanently delete protected shared files; direct API attempts enforce the same rules; published/draft reads remain correct |
| Accessibility | Main tasks work with keyboard, visible focus, named controls, 200% zoom, 320px reflow, light/dark contrast checks, and a screen-reader pass; sorting does not require dragging |
| Public speed/freshness | Anonymous pages remain cacheable; independent visitors see new/changed/deleted content without redeploy; a database outage retains previously successful public content |

Photo counts above are proposed acceptance workloads, not claims about tests already passed. Include actual volunteer phone images, filenames with spaces/non-ASCII characters, portrait/landscape photos, transparent graphics, and a single-page real-world flyer.

Measure admin route readiness, thumbnail payload size, processing time, error/retry rates, and the public site's before/after loading behavior under repeatable conditions. Set numerical performance budgets from that baseline before implementation; do not declare the admin “fast” solely from an unloaded local development screen.

## Volunteer validation

Recruit three to five actual editors with their usual devices and preferred text size. Give them outcome-based tasks, without pointing at controls: replace a flyer; update the dues month; correct the format on one meeting day; add photos without an album; create an album; correct a mistake. Later add a rich news post and review a deliberately imperfect set of extracted events.

Record completion, time, wrong turns, requests for help, accidental publication/deletion, and whether each person can accurately say what is public. Start with prototype walkthroughs, then repeat against working staging flows. Include at least one phone session if phones will be used.

Proposed release gate: every core task is completed by at least four of five participants without procedural coaching, with no unintended public changes and successful recovery from a mistake. Treat this as a practical acceptance target, not a statistically representative result. If only three editors participate, review each person's difficulties rather than presenting misleading percentages.

Provide a one-page illustrated guide per core task after the interface has stabilized. Training should explain the work, not compensate for obscure labels or hidden actions.

## Decisions for review

These decisions guide implementation; recommended defaults below are not claims of approval.

| Decision | Recommended starting point | Alternative / effect |
| --- | --- | --- |
| Monthly source material | Retain the requested DOCX-to-image flyer pathway and original sources, plus optional individual events | Representative actual documents determine conversion/extraction support; the future assistant supplements both manual paths |
| Dues month behavior | Accessible current-month text automatically, with a visible manual override and artwork checks | Manual month selection if the club prefers deliberate monthly updates; confirm the required rollover freshness |
| Authoritative meeting details | Group/club-designated person verifies each day, format, and existing monthly rule | Existing prose and guessed AI output are not substitutes; keep unknown details explicitly unconfirmed |
| What public meeting counts mean | Agree on groups or recurring sessions and label the count accordingly | Weekly occurrence counts require the same recurrence resolver, not a raw record count |
| Editor devices | Support computer and phone; validate with actual users | Device mix determines which upload/preview interactions receive first testing |
| Main gallery behavior | Ungrouped photos plus album covers | An “All photos” view can also include album photos, but should be a deliberate browsing option |
| One photo in multiple albums | One optional album per gallery photo initially | Multi-album membership adds ordering/visibility complexity and should be chosen before schema work |
| Old monthly flyers | Keep an archive with a clear current month | Hide old flyers publicly if preferred while retaining editorial history |
| Word flyer length | Explicit single-page support first | Add multi-page support only if editors use it; never silently drop pages |
| Publication responsibility | Trusted editors publish ordinary content themselves | Add review only for tasks where the club wants it, such as donation links or policies |
| Photo permission/privacy | Follow an agreed club practice with clear public visibility | Private pre-publication review requires storage/access changes beyond draft gallery records |
| Future section name | News & updates | “Club news” or another club-preferred term; choose before public URLs launch |
| Scheduling | Immediate publish first | Add scheduled publishing only after a supported, monitored runner is in place |
| AI assistance | Optional reviewed draft creation after structured events/source retention are working | Keep fully manual event entry and flyer-only publishing; choose provider, data handling, and cost cap for the pilot |
| Additional opportunities | Monthly checklist and section directory first; evaluate notices and printable schedules next | Forms, calendar feeds, and further AI assistance need demonstrated demand and an owner |
| Next large workflow | Events/meetings before bulk albums | Swap phases 2 and 3 if the photo backlog is the more urgent need |

The recommended first implementation package is phases 0 and 1: correct the meeting logic, identify unverified format claims, expose the dues reminder under its real purpose, make the important tasks easy to find, make pictures large enough to recognize, and clarify what is saved versus public. Then deliver structured meetings/monthly updates and bulk photos/albums in the agreed order. This document remains a plan for review; it does not authorize guessed schedule corrections or claim the proposed interface is already live.
