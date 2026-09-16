import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Payload pins its own SDK copy. Route both copies to the same unit-test
    // module so the adapter's network boundary is reliably mocked.
    alias: [
      { find: /^@vercel\/blob$/, replacement: fileURLToPath(import.meta.resolve('@vercel/blob')) },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    server: { deps: { inline: [/@payloadcms\/storage-vercel-blob/] } },
  },
})
