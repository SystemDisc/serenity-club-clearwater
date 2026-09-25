# Clubhouse fundraising display

Open `/fundraiser-display` in a full-screen browser on the clubhouse display. Scanning the QR code with a visitor's phone leads directly to the published Zeffy capital campaign. The QR panel is not a link: tapping, holding or dragging it does not navigate the display. The optional on-screen checkout opens Zeffy's own page in a separate frame; card details are never handled by this application.

The display has no outgoing links or public fullscreen-exit control. The checkout frame permits scripts, forms and Zeffy's own origin while sandboxing popups, top-level navigation, external app launches and downloads. Its URL is fixed to this campaign, independent of progress responses. The persistent "Finish / start over" control stays outside the frame. Payment methods that require another window or app must be completed on the visitor's phone using the QR code; verify the intended on-screen payment flow on the actual kiosk before public use.

Use iPad Guided Access or a managed kiosk browser to hide browser controls and block OS gestures. Keep touch and software keyboards enabled for donations. The page suppresses its own long-press menus, image dragging, pinch/double-tap zoom and overscroll/pull-to-refresh, while retaining one-finger vertical scrolling. It cannot control OS UI or gestures inside Zeffy's cross-origin document. For app-wide zoom control on iPad, Kiosk Pro Basic offers **Interaction / Pinch-to-Zoom Gestures → Zoom on Standard Web Pages → Disable Zoom**. Test both the display and checkout on the mounted device. Browser full screen alone is not device lockdown.

Set `ZEFFY_API_KEY` as a server-only environment variable on Vercel. Never use a `NEXT_PUBLIC_` prefix. The fixed campaign ID is verified against the account's actual API response. `/api/fundraiser-progress` exposes only the public campaign title/link, goal, amount raised, currency and last successful check time. It does not expose payment or contact records.

The display checks every 60 seconds. Successful aggregate responses may be shared at Vercel's edge for up to 30 seconds. Failed checks retain the browser's last verified total with an interruption message; without a previous total, an unavailable message replaces the amount. No sample or captured amounts are used on the hosted display.

An active checkout is not reloaded or closed by progress refreshes. Visitors return with “Finish / start over,” followed by a confirmation. Unloading the frame removes that form instance, but does not claim to erase Zeffy cookies or browser autofill. Before allowing unattended on-screen payments, configure a managed kiosk browser to clear browsing data between sessions and test it on the purchased hardware. A QR-only screen does not collect donor input on the shared device.

API polling is sufficient for this version. No webhook URL has been registered, and the site does not receive donor/payment webhook payloads. A webhook can be added later if faster refresh is required.

The display is excluded from search indexing. It uses a standalone HTML route so ordinary website navigation, CMS controls and admin sessions are not exposed on the display. The existing website routes are unchanged.

Official references:

- https://www.zeffy.com/api/docs
- https://support.zeffy.com/get-started-with-the-zeffy-api-yourg
- https://support.zeffy.com/app-setting-up-zeffy-tap-to-pay-ac2zt
