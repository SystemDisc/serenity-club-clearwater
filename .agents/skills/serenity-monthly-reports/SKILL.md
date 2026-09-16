---
name: serenity-monthly-reports
description: Generate the Serenity Club of Clearwater's separate website, Google Business Profile, and Facebook analytics PDFs using the project's consistent, print-friendly board-report layouts. Use for monthly club analytics reports or a requested subset of these reports.
---

# Serenity monthly reports

Produce three separate PDFs by default: website, Google listing, and Facebook. The audience is the nonprofit's board and member-owners, including readers unfamiliar with analytics. Use plain language, full detail, color accents, and white paper backgrounds.

## Preserve the report design

Use `scripts/reports.py` and the three versioned JSON layouts in `assets/`. They fix the page order, typography, colors, card labels, column widths, and print margins. Update report inputs, not renderer code or layouts, during routine reporting. Do not use dashboard screenshots or browser printouts as the report.

The original reports are retained in `assets/reference/{website,google,facebook}.pdf` as visual references. The renderer preserves their design system and section structure. Content and row count can change; extra rows continue onto matching pages with repeated table headings. Never discard rows or reduce body type to force the original page count. Base layouts have 6, 4, and 7 pages respectively.

## Choose the period separately for each service

1. Determine today's date in `America/New_York`. Run `reports.py dates` to calculate the previous full calendar month and fallback window. Honor an explicitly requested historical report date.
2. Attempt the previous full calendar month on each live service. Record the exact selected range, reporting timezone, and any partial endpoints. Do not assume a limitation observed in an earlier month still applies.
3. Only if that service cannot provide the previous month, use its last 30 days through today. Record the observed limitation in `period.fallback_reason`. Some rolling windows include parts of 31 date labels; preserve their real timestamps and explain them.
4. Authentication or permission failures are not evidence that the month is unavailable. Request the necessary sign-in or export for that service and continue independent work on the others. Do not silently substitute 28 days, a partial month, or old data.

## Collect and write

Read [references/collection.md](references/collection.md) for the actual accounts, live collection routes, and counting traps. Use available read-only connectors or the authenticated browser. Confirm the club identity and date filter on every analytics surface. Collect aggregate analytics; no messages, comments, posts, ads, or account settings need changing.

Read [references/input.md](references/input.md), then initialize **fresh** inputs:

```sh
python3 .agents/skills/serenity-monthly-reports/scripts/reports.py dates
python3 .agents/skills/serenity-monthly-reports/scripts/reports.py init --property website --as-of YYYY-MM-DD --output output/pdf/source/YYYY-MM-DD/website.json
```

Repeat for `google` and `facebook`. Replace `YYYY-MM-DD` with the actual report date. Use the Python executable supplied by `load_workspace_dependencies` if system Python lacks the libraries. Required packages are in `scripts/requirements.txt`.

Populate the inputs from current evidence. Keep source snapshots/exports beside the new inputs. `assets/fixtures/` contains historical QA examples only; never copy their conclusions or turn off their fixture flag to deliver a current report. Recalculate all dates, percentages, comparisons, rankings, and observations.

Lead with what the activity means for the club. Explain a term at its first use. Distinguish observation from a possible explanation. Never equate views, clicks, follows, or direction requests with attendance, membership, donations, or answered calls. Do not sum overlapping audiences across services. Label period results, post snapshots, lifetime demographics, and current ratings distinctly.

## Render and verify

Use the PDF skill when available and follow its current artifact-operation requirements. Load the workspace dependencies; then validate and render each requested report:

```sh
python3 .agents/skills/serenity-monthly-reports/scripts/reports.py validate output/pdf/source/YYYY-MM-DD/website.json
python3 .agents/skills/serenity-monthly-reports/scripts/reports.py render output/pdf/source/YYYY-MM-DD/website.json --output output/pdf/serenity-club-website-board-report-YYYY-MM.pdf
```

Use `serenity-club-google-business-profile-board-report-YYYY-MM.pdf` and `serenity-club-facebook-board-report-YYYY-MM.pdf` for the other reports. For a fallback period, use `...-30-days-through-YYYY-MM-DD.pdf` so it cannot be mistaken for a calendar-month report. Keep historical reports; use a revision suffix when correcting an existing issued report.

The validator checks complete reporting dates and core arithmetic, not whether the evidence or conclusions are true. Resolve discrepancies against the source. A genuine provider discrepancy can be documented in `reconciliation_exceptions`; it is then printed in the report, not silently suppressed.

Render **every final page** to PNG with `pdftoppm` under `tmp/pdfs/` and visually inspect it at a readable size. Check headers, footers, type, row wrapping, chart axes, page breaks, and totals against the live evidence. Keep the established fonts and widths; shorten repetitive narrative or use continuation pages for overflow. Confirm no old month, caption, or comparison survived in the prose. Deliver separate PDFs with their actual periods and a brief note about any fallback. Clean only the intermediates created for this run.

For maintenance of the skill itself, run `scripts/test_reports.py`. Ordinary report generation does not require changing or re-testing the application.
