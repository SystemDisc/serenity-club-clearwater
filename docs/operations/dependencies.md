# Dependency maintenance

Reviewed September 15, 2026. Node 24 is the project runtime. Use `npm ci`; peer-dependency checking is enabled. The web app and converter have independent lockfiles.

The Payload packages are aligned at 3.89.0, Next at 16.3.5, React at 19.3.0, Sharp at 0.35.4, and Vitest at 5.0.1. All other direct dependencies were checked with `npm outdated` and updated to the latest compatible release.

Intentional compatibility limits:

- GraphQL 16.14.2: Payload requires GraphQL 16; GraphQL 17 is outside its peer range.
- TypeScript 6.0.3: typescript-eslint 8.70 supports TypeScript below 6.1; TypeScript 7 is outside that range.
- ESLint 9.39.5: Next's React and accessibility plugins do not yet declare ESLint 10 compatibility.
- Node types 24.13.5 match Node 24; do not follow a dist-tag pointing to Node 22 types.

Recheck these limits when upgrading their parent integrations. Do not use `--force` or `--legacy-peer-deps` to conceal conflicts. Run unit/integration tests, type checking, lint, a production build, and browser tests against the isolated test database.

The pinned Blob adapter patch in `scripts/patch-blob-adapter.mjs` prevents concurrent size uploads from corrupting filenames. Its installation deliberately fails on a changed Payload version until the patch is reviewed. The installed adapter is tested, including concurrent original and size uploads. Remove the patch only after verifying an upstream fix with these regressions.
