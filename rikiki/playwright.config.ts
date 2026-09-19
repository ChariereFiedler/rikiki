import { defineConfig, devices } from '@playwright/test';

// Decks are static HTML that load ../../dist or ../../rikiki/dist, so the whole
// repo root is the web root. Serve it from the package dir via `--directory ..`.
const PORT = 7799;

// Specs that take no `page`. They shell out to `rikiki render` / `rikiki check`,
// which drive a Chromium of their own, so the engine project they run under
// changes nothing about what they exercise · running them once per engine ran
// them three times for one result. `render-check` alone cost 5.5 minutes a
// project, 16 of the suite's 35 minutes, and the contention between those
// extra browsers is what made its slowest case miss a 60 s page load.
// `scripts/e2e-projects.test.mjs` keeps this list honest.
const CLI_ONLY = [/render-check\.spec\.ts/, /workflow-recipes\.spec\.ts/];

// Chromium-only capabilities · skipped on the other engines because the engine
// cannot do it, never because it is inconvenient.
const CHROMIUM_ONLY = [
  /print\.spec\.ts/,
  /presenter\.spec\.ts/,
  /emphasis\.spec\.ts/,
  /ink\.spec\.ts/,
];

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
  // A deadline measures the machine, not the code. The same suite runs in 5.7
  // minutes here and 16 on the CI runner · a test that converges in a second
  // locally has under two seconds of real work inside a 30 s budget there.
  // Two Firefox tests have already timed out on CI while passing in the exact
  // CI image locally, which is a budget too tight for the box, not a defect
  // the assertion caught. Raised on CI only, and only the deadline: `retries`
  // stays at 0, so a genuinely flaky test still fails the run.
  timeout: process.env.CI ? 90_000 : 30_000,
  // On GitHub, also emit `::error file=…::` annotations. They are the only
  // part of a run that a reader without a token can see · the logs answer 403
  // on a public repository, and a failure nobody outside can read is a failure
  // nobody outside can fix.
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/e2e-report.json' }],
    ...(process.env.GITHUB_ACTIONS ? [['github'] as const] : []),
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // retries stay at 0, so a retry-gated trace would never fire · keep the
    // trace of every failure instead (collected as a CI artifact).
    trace: 'retain-on-failure',
  },
  projects: [
    // The CLI contract, once. Named apart so the report says which it is.
    { name: 'cli', testMatch: CLI_ONLY },
    // Chromium runs every browser spec · it is the only engine Playwright can
    // drive `page.pdf()` on, and the only one with the multi-screen APIs the
    // presenter uses.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: CLI_ONLY },
    // Firefox and WebKit run the BASE contract: rendering, navigation, scaling,
    // bento, offline bundles, security.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: [...CLI_ONLY, ...CHROMIUM_ONLY],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: [...CLI_ONLY, ...CHROMIUM_ONLY],
    },
  ],
  webServer: {
    command: `node scripts/static-server.mjs ${PORT} ..`,
    url: `http://localhost:${PORT}/rikiki/dist/index.js`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
