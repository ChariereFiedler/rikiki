import { defineConfig } from 'vitest/config';

// Node-side unit tests only: the version-consistency suite and pure-logic unit
// tests for extracted helpers. Browser/render coverage lives in e2e/ (Playwright)
// — excluded here so vitest never tries to load a Playwright spec.
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.mjs', 'src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
  },
});
