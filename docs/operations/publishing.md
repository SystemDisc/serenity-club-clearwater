# Public content freshness

Public routes and their data caches have a five-minute revalidation interval. Normal saves invalidate affected data and routes immediately after Payload finishes the request, including its database transaction. REST, GraphQL, admin server functions, and the jobs runner must retain the `withPublicRevalidation` / `withPublicMutation` wrappers if Payload scaffolding is regenerated.

The request scope groups nested and bulk mutations. Published changes expire cached data with `revalidateTag(tag, { expire: 0 })` and invalidate the affected routes, including both sides of a slug rename. Shared media/navigation changes invalidate the public layout. Draft-only edits do not invalidate published content.

Never return demo content or a fake empty result after a database failure. Errors must reach Next so regeneration can retain the last successful page. A real empty query result stays empty. Demo content requires `DEMO_MODE=true` explicitly.

Look for `public-revalidation-complete`, `public-revalidation-failed`, and `public-revalidation-unscoped` in runtime logs. A failed invalidation does not pretend that the already committed save failed; the finite interval provides recovery on a later visit. The interval is request-driven, not a five-minute wall-clock delivery guarantee. An already open browser page does not receive a push update.

Maintenance scripts must set `context.disableRevalidate`, finish their database commits, and POST to `/next/revalidate` with `Authorization: Bearer <CRON_SECRET>` and a JSON body such as `{"collections":["media"]}`. Never expose the secret in URLs. New mutation entry points need the same request scope.

Vercel had no log drain at audit time, and retained runtime logs could not establish the July incident's exact cause. Structured logs are now available for future incidents. Long-term retention needs a deliberately selected log destination; do not infer a historical cause from missing logs.
