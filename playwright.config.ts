import { defineConfig, devices } from '@playwright/test';

/**
 * End to end smoke test: the editor has to survive a real browser, a real
 * canvas and a real download. Run it with `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    acceptDownloads: true,
    // The editor follows the system preference on a first visit, so the suite
    // pins it to keep the axe runs and the screenshots deterministic.
    colorScheme: 'dark',
    // Transitions would make axe measure colours mid animation.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      // The atlas and the export paths use OffscreenCanvas, which the three
      // engines implement differently: this is where the browser differences
      // surface. The axe audit stays on Chromium, its results are not
      // comparable across engines (backdrop blur blends differently).
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /mobile\.spec\.ts|accessibility\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /mobile\.spec\.ts|accessibility\.spec\.ts/,
    },
    {
      // A phone viewport: the sidebar has to stay usable and taps have to
      // reach the controls.
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
