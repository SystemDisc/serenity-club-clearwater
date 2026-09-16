# Admin improvements — plan for review

Prepared September 15, 2026. **Proposed, not implemented.** This plan follows the [full admin UX audit](../audits/2026-09-15-admin-ux.md). Finding IDs A01–A23 refer to that report.

## Recommended direction

Keep Payload, its database, authentication, draft/version support, and the site's fast public rendering. Add a small, purpose-built workspace for the club's frequent tasks.

The editor should be able to answer three questions throughout a task: **What am I changing? What will visitors see? Has it been published?**

Prioritize accurate meetings, this month's events, and adding many photos. Introduce albums as real public content, preserve ungrouped gallery photos, and prepare the existing post editor for a later News & updates launch.

The plan does not include replacing the CMS, a general drag-and-drop website builder, payment processing, membership records, or an approval chain for every ordinary edit.

## The proposed admin

### Home

A simple dashboard headed “Manage the Serenity Club website,” with four large, clearly labeled actions:

| Task | Information shown with the action |
| --- | --- |
| **Update this month's flyer** | Month, current flyer preview, whether this month is missing, and “View Events page” |
| **Change a meeting** | Today's/this week's schedule and a searchable meeting list |
| **Add photos** | Recently added photos, unfinished upload batches, and “View Gallery” |
| **Create an album** | Recent albums, their covers, and publication status |

Below these: “Continue editing” for meaningful drafts, “Recently published,” and short illustrated help. Do not show empty technical collections, system jobs, raw errors, or unnecessary analytics.

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

This uses Payload's documented dashboard/view extension points and preserves its standard admin components where they work well. It should not require Payload's separate enterprise visual-editor product. [Payload custom views](https://payloadcms.com/docs/custom-components/custom-views).

## The three core workflows

### 1. Update this month's events

**Monthly flyer**

1. Choose **Update this month's flyer**. The screen defaults to the current month in Clearwater and shows the current published flyer beside the proposed replacement.
2. Choose an image or supported document from the computer/phone or library. Show a readable full-page preview, including zoom. State supported formats and limits before selection.
3. Check the month and add/update the accessible text details. Preserve a flyer-first workflow; creating a dozen separate event records must not be a prerequisite for replacing a flyer.
4. Preview the Events page and homepage placement. The action says **Publish September flyer**, using the chosen month.
5. Show **Published on the website**, the public link, and how to restore the previous version.

Use a separate monthly-flyer record with month/year and an archive. Next month's draft must not overwrite this month's public flyer. Flag a missing current month; do not silently describe the previous month as current. Decide whether older flyers remain publicly archived. Updating the existing month should replace its current version rather than create duplicate competing entries.

For Word documents, the first release should explicitly support **one-page flyers**, with a helpful error for multi-page files. If multi-page flyers are genuinely needed, add a deliberate all-pages/page-selection design. Preserve the editable original separately from the rendered image when source retention is required. Never silently publish page one of a larger document.

**Individual events**

Offer a second action, **Add an event**, with title, date, start/end time or “All day,” location, short description, optional picture, and optional details link. Provide upcoming/past views and an explicit homepage feature choice. Use structured dates to sort and archive accurately.

Recurring speaker/board events should reference their authoritative meeting schedule where appropriate. Editors should not need to maintain the same day/time in two collections.

### 2. Change a meeting

1. Find the meeting by name, fellowship, day, or time. Display a readable weekly agenda; provide a list alternative.
2. Edit plain fields: **Meeting name**, **AA / NA / Club service**, **Days**, **Time**, **Room**, and **What visitors should know**.
3. For ordinary recurrence, offer **Every day**, **Certain days each week**, or **A particular week of the month**. Monthly choices use words such as “Second Wednesday,” with a preview of the next actual dates.
4. Show the resulting schedule in a sentence and in the public card. Ask “From what date?” when changing future recurrence. Provide a separate **Cancel or change one date** action.
5. Publish and show every affected public location. Preserve the previous version for recovery.

Store local time and recurrence structure with America/New_York as the club timezone. Do not expose cron expressions, RRULE text, weekday numbers, or UTC conversions to editors.

Bring group notes into the CMS alongside the relevant group/meeting. Remove misleading Order and External URL controls until they have a defined public effect. Warn about apparent overlapping meetings in the same room without assuming every overlap is prohibited.

The first correctness patch can fix the current range/ordinal bug before the structured editor is ready. The migration must then verify each of the 11 existing schedules with a human-readable before/after report. Ambiguous text requires review, not a guess.

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

## Common editing standards

| Current label/behavior | Proposed editor-facing behavior |
| --- | --- |
| Collections | Remove from everyday vocabulary; show tasks/content names |
| Gallery Item / Create New | Photo / Add photos |
| Media | Photo & file library |
| Date Label / Time Label | Structured date/time or a dedicated Month control |
| Hero Image | Homepage picture or Cover photo, depending on actual use |
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

## Later News & updates

Build on the existing Posts/Lexical implementation. The standard writing surface should contain title, optional cover, article body, preview, saved status, and publication controls.

Provide a persistent toolbar with paragraph, headings 2/3, bold, italic, bulleted list, numbered list, link, quote, and image/caption. Remove Code from routine authoring, avoid additional H1s in the body, and make image insertion say **Add photo**. Match the site's typography sufficiently for the preview to be trustworthy. Test pasted Word/Google Docs content without retaining arbitrary fonts or losing useful structure. Payload supports these ordinary features. [Rich-text features](https://payloadcms.com/docs/rich-text/official-features).

Automatically supply a stable URL and useful default metadata, with optional advanced overrides. Make authorship an intentional club choice rather than a required technical relationship. Use News & updates as the recommended public label, subject to review.

The launch must also address public navigation, route/canonical choices, post-list outage behavior, indexing/sitemap, accessible rendering, images, pagination, new-post ISR visibility, and any redirects. Offer scheduling only after the runner is operational and verified; a publication-date field alone does not schedule anything.

## Delivery sequence and focused commits

Sizes are relative planning estimates, not calendar commitments: **Small** = localized configuration/UI change; **Medium** = coordinated components and validation; **Large** = new workflow plus schema/migration and end-to-end tests.

| Phase | Deliverable and suggested commit boundaries | Size | Audit findings |
| --- | --- | --- | --- |
| **0. Correctness and immediate clarity** | Meeting-day/ordinal correction with meaningful date tests; separate correction of ineffective/misleading field/help text; explicit multi-page DOCX handling; gallery publish-time image validation | Medium | A03, A04, A12, A14, A15 |
| **1. A useful everyday workspace** | Task dashboard/navigation and empty states; separate readable forms/named controls/responsive fixes; separate visual photo picker and selected-image preview; status columns/public links | Medium | A01, A07–A10, A18, A22 |
| **2. Events and meetings** | Additive structured schedule/monthly-flyer schema and reviewed backfill; separate meeting editor/public schedule integration; separate flyer/event flow and accessible text; preview/autosave/version recovery | Large | A02–A04, A09, A13, A14 |
| **3. Bulk photos and albums** | Additive album/batch schema; separate upload/retry/deduplication service; review/publish UI; minimal public album landing/detail integration; existing-photo migration and acceptance tests | Large | A05–A07, A10–A13, A23 |
| **4. Recovery and less frequent work** | Trash/file-usage safeguards; separate settings/menu improvements; shop/rules/team simplification; permission and onboarding improvements | Medium–Large | A11, A15, A18–A22 |
| **5. Public gallery polish and News launch** | Separate public photo viewer/mobile browsing change; separate curated news editor; separate public news routes/indexing/cache behavior; enable optional scheduling only with a verified runner | Large | A16, A17, A23 |

The core gallery flow in phase 3 needs a usable public album destination; the richer lightbox/swipe/public-gallery redesign remains phase 5. That prevents introducing an admin “Publish album” button whose result visitors cannot access.

Phases 2 and 3 can be reordered after phase 1 if bulk gallery publishing is the more urgent operational need. File-use safeguards required by a new workflow must ship with that workflow, even if the broader recovery improvements are grouped in phase 4.

Each code change should be a focused, reviewable commit. Keep schema migrations separate from major UI changes when practical, regenerate Payload types/import maps as required, and update the help material alongside each released workflow. The audit and this plan are documentation commits, not a release of these proposals.

## Implementation constraints

Preserve the current reliability foundation:

- New custom views must call authenticated Payload operations with appropriate access checks. Server-side Local API calls acting for an editor must respect that user's access; a hidden menu or client validation is insufficient.
- Keep the same request/transaction context through related operations. Do not bypass collection hooks using direct SQL for live editorial writes.
- Retain the existing public-mutation wrappers, post-transaction invalidation, and finite ISR fallback. Add cache tags/routes for albums and monthly flyers. Avoid one whole-site invalidation per uploaded file where a batch can be grouped safely.
- Do not make public pages depend on an authenticated admin session or download all full-resolution photos to display a picker. Fetch bounded pages of thumbnails and keep the public gallery paginated.
- Preserve the repaired storage metadata and pinned Blob-adapter regression safeguards. Display names must not overwrite storage filenames. Test duplicate names, replacement, focal points, and delete/restore behavior.
- Use additive migrations and production backups. Keep current IDs/URLs, alt overrides, publication states, and order until a reviewed migration deliberately changes them.
- Keep local development/tests isolated from production DB, Blob writes, and email. Use copied content only in that isolated environment.
- Never interpret a content-read failure as a successful empty collection. Draft previews remain authenticated and must bypass the published cache safely.
- A new photo workflow needs server-side file/size/type validation and bounded image/conversion work. Establish supported formats with real fixtures before advertising them.

No additional subscription is assumed for phases 0–4. A scheduling runner, private photo storage, or a different conversion/processing service could introduce operational cost and should be selected explicitly if required.

## Acceptance scenarios

Use realistic copied content locally/staging first. Use a small, explicitly scoped production smoke test after each release, and clean up only test content.

| Scenario | Release acceptance |
| --- | --- |
| Replace this month's flyer | Editor finds it from Home, sees old/new previews, publishes the right month, and sees the result on both affected public pages without redeployment; previous version can be restored |
| Upload a two-page Word document | UI explicitly rejects it with instructions or presents the approved multi-page workflow; no silent first-page-only success |
| Add a dated event | Upcoming/past placement, date/time, optional link, and homepage inclusion are predictable; draft is not publicly visible |
| Correct Feelings | Monday–Saturday recurrence appears on all six days and never Sunday, including the “Today” view |
| Monthly board meeting | Second Wednesday appears on the correct date, not every Wednesday; next-date preview and public display agree |
| Change one meeting date | One exception changes without changing the rest of the recurring schedule; old hardcoded notes cannot contradict it |
| Add 30 ungrouped photos | One multi-select flow creates/publishes all intended photos, no album required, no repeated title entry, correct orientation, and a clear public result |
| Create a 50-photo album | Shared title/date entered once; cover/order reviewed; draft isolation and album publication are correct; all expected photos are reachable |
| Upload failure and retry | Mix valid, unsupported, duplicate, large, and failed files; successes remain; failed items have actionable messages; repeated retry/publish creates no duplicate records |
| Refresh/session expiry | Meaningful draft/batch state survives; ready files are recovered; source reselection is clearly explained if necessary; login recovery returns to the task |
| Remove and recover | Removing gallery placement does not delete a reused homepage file; trash/restore works for records and stored images; public caches reflect both operations |
| Edit menus/settings | Built-in pages are selectable by name; payment destination and contact changes show their scope; blank/footer behavior matches help text |
| Concurrent edits | Two editors cannot silently overwrite one another; verify Payload locking/conflict behavior in the custom flows and show a recoverable conflict when needed |
| Future rich post | A volunteer pastes content, formats a list, adds an image/caption, previews on phone/computer, publishes, edits, and restores a version without using technical fields |
| Access boundaries | Routine editor cannot manage accounts/permanently delete protected shared files; direct API attempts enforce the same rules; published/draft reads remain correct |
| Accessibility | Main tasks work with keyboard, visible focus, named controls, 200% zoom, 320px reflow, light/dark contrast checks, and a screen-reader pass; sorting does not require dragging |
| Public speed/freshness | Anonymous pages remain cacheable; independent visitors see new/changed/deleted content without redeploy; a database outage retains previously successful public content |

Photo counts above are proposed acceptance workloads, not claims about tests already passed. Include actual volunteer phone images, filenames with spaces/non-ASCII characters, portrait/landscape photos, transparent graphics, and a single-page real-world flyer.

Measure admin route readiness, thumbnail payload size, processing time, error/retry rates, and the public site's before/after loading behavior under repeatable conditions. Set numerical performance budgets from that baseline before implementation; do not declare the admin “fast” solely from an unloaded local development screen.

## Volunteer validation

Recruit three to five actual editors with their usual devices and preferred text size. Give them outcome-based tasks, without pointing at controls: replace a flyer; change a meeting; add photos without an album; create an album; correct a mistake. Later add a rich news post.

Record completion, time, wrong turns, requests for help, accidental publication/deletion, and whether each person can accurately say what is public. Start with prototype walkthroughs, then repeat against working staging flows. Include at least one phone session if phones will be used.

Proposed release gate: every core task is completed by at least four of five participants without procedural coaching, with no unintended public changes and successful recovery from a mistake. Treat this as a practical acceptance target, not a statistically representative result. If only three editors participate, review each person's difficulties rather than presenting misleading percentages.

Provide a one-page illustrated guide per core task after the interface has stabilized. Training should explain the work, not compensate for obscure labels or hidden actions.

## Decisions for review

These decisions guide implementation; recommended defaults below are not claims of approval.

| Decision | Recommended starting point | Alternative / effect |
| --- | --- | --- |
| Monthly source material | Support a monthly flyer plus optional individual events | If work is almost entirely Word/flyer-based, invest more in conversion/accessible-text assistance; if event-based, prioritize structured event entry |
| Editor devices | Support computer and phone; validate with actual users | Device mix determines which upload/preview interactions receive first testing |
| Main gallery behavior | Ungrouped photos plus album covers | An “All photos” view can also include album photos, but should be a deliberate browsing option |
| One photo in multiple albums | One optional album per gallery photo initially | Multi-album membership adds ordering/visibility complexity and should be chosen before schema work |
| Old monthly flyers | Keep an archive with a clear current month | Hide old flyers publicly if preferred while retaining editorial history |
| Word flyer length | Explicit single-page support first | Add multi-page support only if editors use it; never silently drop pages |
| Publication responsibility | Trusted editors publish ordinary content themselves | Add review only for tasks where the club wants it, such as donation links or policies |
| Photo permission/privacy | Follow an agreed club practice with clear public visibility | Private pre-publication review requires storage/access changes beyond draft gallery records |
| Future section name | News & updates | “Club news” or another club-preferred term; choose before public URLs launch |
| Scheduling | Immediate publish first | Add scheduled publishing only after a supported, monitored runner is in place |
| Next large workflow | Events/meetings before bulk albums | Swap phases 2 and 3 if the photo backlog is the more urgent need |

The recommended first implementation package is phases 0 and 1: correct the meeting logic, make the important tasks easy to find, make pictures large enough to recognize, and clarify what is saved versus public. Then deliver the two larger content workflows in the agreed order.
