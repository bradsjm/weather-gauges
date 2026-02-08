import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './packages/test-assets/visual',
  snapshotPathTemplate: 'packages/test-assets/visual/{testFilePath}-snapshots/{arg}{ext}',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 420, height: 420 },
    deviceScaleFactor: 1,
    colorScheme: 'light'
  },
  webServer: {
    command: 'pnpm --filter @bradsjm/steelseries-v3-docs dev --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
})
