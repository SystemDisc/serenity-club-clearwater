# Upload incident timeline

Follow-up investigation, September 15, 2026. Times below are Eastern Daylight Time.

## Findings

The thumbnail corruption predates ISR. Git commit `54cf3a2` (“Avoid Blob upload filename collisions”) added `addRandomSuffix: true` on July 9 at 11:51 p.m. Existing media uploaded before that change has ordinary matching filenames. The first surviving corrupted record, Media 27, was created July 10 at 1:03 a.m.; Media 28 followed that afternoon. The change to static public pages with ISR was July 15, five days later.

This setting exposed the installed Payload 3.85.2 Blob adapter defect: concurrent size uploads share a document object, each writes its own randomly suffixed result into the top-level original filename, and size metadata does not receive the corresponding suffix. Blob upload timestamps agree with the Media creation timestamps. The corruption occurred during upload; it was not caused by an ISR render or subsequent image-cache expiration.

The July 28 bowling batch comprised 17 photos, Media 29–45, uploaded from 3:17:10 p.m. through 3:27:50 p.m. Gallery Items 4–20 were created from 3:17:38 p.m. through 3:27:53 p.m. All 17 have the same filename defect. Two additional images uploaded August 2 also have it.

At 3:28:32 p.m. July 28, just 39 seconds after the last gallery item was created, a new production deployment began. Both the previous July 15 deployment and this redeployment identify the exact same commit, `c6795e30dbf6ec2e67b7ef22e007cfeb907a9080`, and Next.js 16.2.10. Their retained build logs both show `/gallery` generated statically. The July 28 build regenerated the static pages at 3:30:07 p.m. This independently corroborates the user's account of redeploying immediately after adding the batch; it was not a newly committed gallery-hook fix.

## Historical logs and limitations

I queried July 28 from 3:10–3:40 p.m., then retried the narrower 3:15–3:30 p.m. window scoped to the deployment that served the uploads (`dpl_Cwmc8aS74864zXDwby69HmvNfdyE`). Both runtime-log queries failed with HTTP 400 `ExceedsBillingLimitError`. This is a retrieval failure, not an empty log result or proof there were no errors.

The incident is about 49 days old. Vercel documents up to 30 days of runtime-log retention with Observability Plus, and shorter retention without it. The current team drain inventory is empty, so no configured external archive was found. Retained build logs were accessible, but do not contain the runtime publish/invalidation events needed to explain that earlier stale page. A previously removed drain or separately saved log export cannot be ruled out. [Vercel runtime log retention](https://vercel.com/docs/logs/runtime#limits).

## Relationship between the two symptoms

There is no demonstrated direct cause linking broken thumbnails to missing Gallery Items. Gallery publication is a separate operation after Media upload. Its hook exists in the deployed commit. Rendering the gallery reads stored image URLs; it does not fetch admin thumbnails, so a thumbnail 404 does not itself make the gallery query fail or omit that record. The same corrupted Media 45 was used successfully in the approved September publishing test.

The confirmed fallback-on-database-error defect remains a possible failure mechanism for stale public pages, but historical logs do not establish that it occurred during this batch. Transaction/cache timing and deployment-specific cache behavior also remain unproven alternatives. The correct repair is to fix the independently verified media defect and make publication observable and recoverable, rather than attributing the historical publishing incident to thumbnail corruption without evidence.

Evidence sources: local Git history and lockfile; public Media/Gallery timestamps; Blob object upload timestamps; Vercel deployment metadata; retained July 15 and July 28 build logs; runtime-log query errors; current team drain inventory. No new production content was changed in this follow-up.
