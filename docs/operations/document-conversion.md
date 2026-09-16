# DOCX conversion

Vercel Services runs the web app and the separate `docx-converter` container. The web service receives `DOCX_CONVERTER_URL` through its service binding.

Configure `DOCX_CONVERSION_SECRET` for both services and `DOCX_ALLOWED_SOURCE_ORIGINS` as a comma-separated list of exact HTTPS Blob origins. The converter no longer reuses the CMS or cron secret. It rejects redirects and unlisted sources, including private network URLs. Do not use incoming Host headers to choose where credentials are sent.

Limits: 25 MiB input download, 15-second download timeout, 30 seconds per conversion subprocess, exactly one PDF page, maximum 4000-pixel long edge and 16 million decoded pixels. Multi-page documents receive a 422 error before rasterization rather than silently losing all later pages. The caller caps output at 20 MiB and waits at most two minutes. Each service instance converts one document at a time; busy requests receive 429 and `Retry-After: 10` rather than an unbounded queue. Invalid JSON and oversized requests fail clearly.

The service has its own committed lockfile and installs with `npm ci`. The local conversion helper imports the same implementation. The regression checks cover origin validation, streaming byte limits, and actual DOCX conversion.

Production and preview have the dedicated secret and source allowlist configured. Local tests intentionally omit remote service credentials. Set `DOCX_CONVERTER_MODE=local` only with a loopback database, local storage, LibreOffice, and Poppler. The endpoint rejects this mode on Vercel or with a Blob token. It uses the same conversion implementation as the deployed service; it is an explicit local configuration, not a fallback after a remote failure. CI installs the required conversion binaries.

## Monthly flyer workflow

Use **Monthly flyers → Upload Word flyer** for one-page DOCX files up to 4 MB (the app upload limit leaves room within Vercel's request limit). An image can also be selected directly. Uploading an original creates an immutable `sourceDocuments` record and SHA-256 hash. A separate authenticated conversion request creates a Media image linked to that original. Conversion retries reuse the existing image; a unique source relationship prevents duplicate image records. The original remains available if conversion fails. Replacing a flyer creates a new original and image, leaving earlier versions intact.

Saving a draft retains the month, original, image, and text details. Publication checks image readiness and that its original matches. A future month does not displace the current flyer; the public pages select the current Clearwater month, with older flyers in a bounded recent archive. Month rollover follows the five-minute request-driven ISR behavior documented in publishing operations.

The old Media hook that overwrote Word files with images is no longer registered. Direct Word uploads to Media return a message directing the editor to this workflow. Local originals are served through authenticated Payload file access; production originals use the existing public Blob store and have public URLs. Only upload documents intended for public release. This is source retention, not private document storage.

The September 2026 original supplied by the club was rehearsed locally through upload, conversion, draft save, publication, and an independent public view. Email files and original attachments remain ignored local test material; only synthetic one/two-page regression fixtures are committed.
