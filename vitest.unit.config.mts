import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    server: { deps: { inline: [/@payloadcms\/storage-vercel-blob/] } },
  },
})
