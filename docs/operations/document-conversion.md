# DOCX conversion

Vercel Services runs the web app and the separate `docx-converter` container. The web service receives `DOCX_CONVERTER_URL` through its service binding.

Configure `DOCX_CONVERSION_SECRET` for both services and `DOCX_ALLOWED_SOURCE_ORIGINS` as a comma-separated list of exact HTTPS Blob origins. The converter no longer reuses the CMS or cron secret. It rejects redirects and unlisted sources, including private network URLs. Do not use incoming Host headers to choose where credentials are sent.

Limits: 25 MiB input download, 15-second download timeout, 30 seconds per conversion subprocess, exactly one PDF page, maximum 4000-pixel long edge and 16 million decoded pixels. Multi-page documents receive a 422 error before rasterization rather than silently losing all later pages. The caller caps output at 20 MiB and waits at most two minutes. Each service instance converts one document at a time; busy requests receive 429 and `Retry-After: 10` rather than an unbounded queue. Invalid JSON and oversized requests fail clearly.

The service has its own committed lockfile and installs with `npm ci`. The local conversion helper imports the same implementation. The regression checks cover origin validation, streaming byte limits, and an actual disposable DOCX conversion inspected as a rendered image. Batch conversion/retry UX belongs to the later admin workflow work.

Production and preview now have the dedicated secret and source allowlist configured. Local tests intentionally omit remote service credentials. A local conversion smoke test can call `convertDocxBufferToImage` directly with a disposable file when LibreOffice and Poppler are installed.
