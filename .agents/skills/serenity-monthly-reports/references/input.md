# Report input contract

Run `reports.py init` for an empty input with the exact metric and section IDs for that property. The canonical layout is `assets/<property>.json`; block IDs describe the slots to populate. The inputs contain data and narrative, never Python code or layout instructions. `assets/fixtures/*.json` are fully populated historical examples for schema inspection and testing only.

## Metadata

- `layout_version`: match the layout (currently 1).
- `property`: `website`, `google`, or `facebook`.
- `as_of`: report preparation date, `YYYY-MM-DD`.
- `identity_verified`: true only after checking the requested club account.
- `period`: `kind` (`previous_month` or `rolling_30_days`), ISO `start` and `end`, provider `timezone`, exact `displayed_range`, and any `fallback_reason` / `partial_note`.
- `sources`: objects with `label`, HTTPS `url`, and ISO `captured` date. Keep raw exports beside the report input. Do not put tokens, cookies, or private message content in source files.
- `fixture`: true only for historical test inputs; the renderer refuses these without `--allow-fixture`. That option belongs only in QA.

`dates` derives the prior month correctly across years and leap years. Default fallback dates include today and 29 earlier calendar days. A provider may instead expose an elapsed 30-day range with partial first/last days across 31 labels. Record that actual range and its partial-boundary note.

## Numbers, text, tables, charts

`metrics` contains numeric values or null, with exactly the keys supplied by `init`. Missing values require an entry in `unavailable_metrics`, explaining what the source did not supply. Percentages use 0-100 units. Null is not zero. Net follows may be negative.

Text slots are plain-language strings. Limited `<b>`, `<i>`, `<br/>`, and newlines are supported. Keep most narrative sections to roughly 60-110 words so the pages retain the reference balance. Do not use a source name or technical term where a common description will do. Dates and results in narrative must be refreshed; the renderer cannot verify prose against evidence.

Table slots have `rows` and an optional `note`. Each row must have the exact number of columns declared by the layout. Preserve numeric cells as numbers for validation; use formatted strings for percentages, comparison labels, scopes, and post topics. Missing tables use empty rows and an explicit note. Missing individual numeric cells use null. Optional `total_row` is printed verbatim: verify it against the provider totals, especially monthly viewers. Never calculate a unique monthly audience by summing daily viewers.

`daily` must contain every date in the actual selected window, in order, using ISO dates in its first column. It must contain 28, 29, 30, or 31 date rows as appropriate. Keep zero rows. If exact daily figures are unavailable, use empty rows plus the limitation note, not invented values.

Chart slots contain `labels`, `series` (each with `label` and `values`), and optional `note`. Use short date labels (at most 12 characters). Each series must have one numeric value or null per label. Null makes a gap, not a zero. Daily-chart values must come from the same daily data as the table. Use at most three series. For Google monthly actions, include only fully available months and name their year in the accompanying note when needed.

## Stable content roles

- Website: summary → daily activity → all pages → sources/countries → devices/software/browsers → definitions/coverage/sources. `devices_software` pairs two independent three-column lists; pad the shorter list with empty strings. Do not imply row-by-row relationships between devices and software.
- Google: summary/actions → comparisons/discovery/monthly trend → daily actions → current rating, definitions, search availability, sources. The `actions` table has four rows in this order: website-link clicks, direction requests, call-button taps, bookings. Its counts must match those metrics; null means unavailable. `searches` may contain ranked phrases in plain text when available; retain all available detail with continuation pages if needed.
- Facebook: summary → comparison/trend → content/video → featured posts → audience → daily detail → messaging/definitions/sources. `locations` pairs the city and country lists; pad shorter lists with empty strings. `content_types` columns are format, views, view share, interactions. Explain absent format-specific counts rather than allocating them arbitrarily.

## Arithmetic and scope

The validator reconciles website page views, Google daily totals and action sums, and Facebook daily/content totals and follower arithmetic. It intentionally does not sum unique viewers/visitors or follower demographic percentages as counts.

If the provider's figures disagree, first investigate date filters, dimensions, rounding, and source scope. Only a genuine observed difference belongs in `reconciliation_exceptions`, keyed by the exact check name in the error (for example `daily.pageviews`). Its explanation is printed. Never add an exception merely to get a PDF to render.

Missing data is printed and remains missing. Tables, prose, comparison periods, snapshot dates, and percentage denominators still require an evidence review. A successful command is not that review.

## Maintenance and QA

The renderer reads only files bundled inside this skill; it does not depend on the old `output/pdf/source/build_*.py` files. Keep original references intact. Routine runs modify only new input/output files. Change layouts/version deliberately only when the user requests a design update.

Run:

```sh
python3 .agents/skills/serenity-monthly-reports/scripts/test_reports.py
```

This writes disposable outputs in a temporary directory and checks date boundaries, invalid inputs, preserved rows on overflow, and all three renders. For visual QA, render the fixtures into `tmp/pdfs/skill-qa/` with `--allow-fixture`, then inspect all pages with Poppler. Do not deliver the QA PDFs as current reports.
