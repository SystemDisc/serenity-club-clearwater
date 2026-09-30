# Clubhouse fundraising display

Open `/fundraiser-display` in a full-screen browser on the clubhouse display. Scanning the QR code with a visitor's phone leads directly to the published Zeffy capital campaign. The QR panel is not a link: tapping, holding or dragging it does not navigate the display. The optional on-screen checkout opens Zeffy's own page in a separate frame; card details are never handled by this application.

The display has no outgoing links or public fullscreen-exit control. The checkout frame permits scripts, forms and Zeffy's own origin while sandboxing popups, top-level navigation, external app launches and downloads. Its URL is fixed to this campaign, independent of progress responses. The persistent "Finish / start over" control stays outside the frame. Payment methods that require another window or app must be completed on the visitor's phone using the QR code; verify the intended on-screen payment flow on the actual kiosk before public use.

Use iPad Guided Access or a managed kiosk browser to hide browser controls and block OS gestures. Keep touch and software keyboards enabled for donations. The page suppresses its own long-press menus, image dragging, pinch/double-tap zoom and overscroll/pull-to-refresh, while retaining one-finger vertical scrolling. It cannot control OS UI or gestures inside Zeffy's cross-origin document. For app-wide zoom control on iPad, Kiosk Pro Basic offers **Interaction / Pinch-to-Zoom Gestures → Zoom on Standard Web Pages → Disable Zoom**. Test both the display and checkout on the mounted device. Browser full screen alone is not device lockdown.

Set `ZEFFY_API_KEY` as a server-only environment variable on Vercel. Never use a `NEXT_PUBLIC_` prefix. The fixed campaign ID is verified against the account's actual API response. `/api/fundraiser-progress` exposes only the public campaign title/link, goal, amount raised, currency and last successful check time. It does not expose payment or contact records.

The display checks every five minutes while visible; hidden tabs do not poll. Returning from on-screen checkout triggers an immediate check and two bounded follow-up checks after 15 and 45 seconds. Successful aggregate responses may be shared at Vercel's edge for up to 30 seconds. Failed checks retain the browser's last verified total with an interruption message; without a previous total, an unavailable message replaces the amount. No sample or captured amounts are used on the hosted display.

An active checkout is not reloaded or closed by progress refreshes. Visitors return with “Finish / start over,” followed by a confirmation. Unloading the frame removes that form instance, but does not claim to erase Zeffy cookies or browser autofill. Before allowing unattended on-screen payments, configure a managed kiosk browser to clear browsing data between sessions and test it on the purchased hardware. A QR-only screen does not collect donor input on the shared device.

The server caches only validated aggregate campaign progress for five minutes. Zeffy `payment.completed` deliveries for this campaign expire that cache, so the next request fetches fresh totals. The QR donor uses a separate phone: their webhook expires the cache but does not push to the kiosk; the kiosk sees it on its next five-minute poll. On-screen donors use “Finish / start over” after completing checkout to trigger the short refresh burst. The cross-origin frame does not provide a verified completion event to this application.

## Webhook activation

Deploy the receiver before enabling delivery. Set `ZEFFY_WEBHOOK_SECRET` privately to the signing secret provided by the organization owner in Settings → Integrations → Webhook. Do not expose it in a public environment variable, URL, committed file, or log. Configure Zeffy to POST `payment.completed` only to `https://www.serenityclubofclearwater.org/api/zeffy-webhook`, then verify a signed delivery in production. No live webhook has been enabled by this local change.

The receiver verifies the raw-byte HMAC SHA-256 `Zeffy-Signature`, uses constant-time comparison, rejects timestamps more than five minutes away and bodies above 64 KiB, and filters campaign/status. It neither logs nor stores donor payloads, nor computes totals from payment amounts. Duplicate deliveries safely repeat cache expiration. Unsupported events acknowledge without side effects; failed signature/configuration returns a non-2xx response so Zeffy retries. Successful public response CDN caching can delay visibility by up to 30 seconds even after data-cache invalidation. The 45-second follow-up covers that normal edge-cache interval; slower webhook/API propagation will be reflected by a later regular poll.

Routine polls fall from 1,440 to 288 per continuously visible display-day (80% fewer), plus a maximum three checks per completed checkout return. Actual CPU savings depend on visible hours, checkout traffic, caching and cold starts.

The display is excluded from search indexing. It uses a standalone HTML route so ordinary website navigation, CMS controls and admin sessions are not exposed on the display. The existing website routes are unchanged.

Official references:

- https://www.zeffy.com/api/docs
- https://support.zeffy.com/get-started-with-the-zeffy-api-yourg
- https://support.zeffy.com/app-setting-up-zeffy-tap-to-pay-ac2zt

## Remote kiosk refresh
After deployment, refresh the physical kiosk once to install the new client. An administrator can then sign in to /admin and select Refresh kiosk. Editors cannot trigger it. The authenticated same-origin endpoint writes only a random revision/time to existing public Vercel Blob storage; the kiosk checks that CDN signal every five minutes. It waits until checkout is closed and there has been no interaction for 30 seconds, then persists the revision before reload. Offline, malformed, stale or repeated commands never force a reload. The Blob token must be present at build/runtime; no additional secret is needed.

The Zeffy webhook is saved disabled with payment.completed selected. ZEFFY_WEBHOOK_SECRET is now saved as a Vercel Production secret. Deploy the receiver and verify signature/cache invalidation before enabling delivery.
