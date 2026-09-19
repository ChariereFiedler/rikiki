import { defineConfig, devices } from '@playwright/test';

// Decks are static HTML that load ../../dist or ../../rikiki/dist, so the whole
// repo root is the web root. Serve it from the package dir via `--directory ..`.
const PORT = 7799;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The CI runner is a small single-job VPS: several test browsers plus the
  // Chromium each CLI test launches oversubscribe it, and page loads then
  // overrun the CLI's own deadlines (three different tests flaked that way on
  // 0.7.0). One worker there; the default (half the cores) elsewhere.
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: 0, // flaky tests are bugs to fix, not retry away (test-discipline)
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-report.json' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // retries stay at 0, so a retry-gated trace would never fire · keep the
    // trace of every failure instead (collected as a CI artifact).
    trace: 'retain-on-failure',
  },
  projects: [
    // Chromium runs the whole suite · it is the only engine Playwright can
    // drive `page.pdf()` on, and the only one with the multi-screen APIs the
    // presenter uses.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Firefox and WebKit run the BASE contract: rendering, navigation, scaling,
    // bento, offline bundles, security. What they skip is skipped because the
    // capability is Chromium-only, never because it is inconvenient.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: [/print\.spec\.ts/, /presenter\.spec\.ts/, /emphasis\.spec\.ts/, /ink\.spec\.ts/],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: [/print\.spec\.ts/, /presenter\.spec\.ts/, /emphasis\.spec\.ts/, /ink\.spec\.ts/],
    },
  ],
  webServer: {
    command: `node scripts/static-server.mjs ${PORT} ..`,
    url: `http://localhost:${PORT}/rikiki/dist/index.js`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
