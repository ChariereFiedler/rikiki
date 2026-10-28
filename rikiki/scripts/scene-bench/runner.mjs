// ════════════════════════════════════════════════════════════════
// RIKIKI · scene bench, opening the harness
//
// Starts the package's static server, opens the harness page in Chromium and
// hands back `page` and `close`. Shared by the bench command and the capacity
// sweep, so both draw on the same page the same way.
// ════════════════════════════════════════════════════════════════

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG = join(HERE, '..', '..');

/** Wait for the server to answer · a fixed sleep is a guess that fails on a loaded machine. */
async function waitFor(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`scene bench · the server did not answer at ${url}`);
}

export async function openBench(port = 7811) {
  const { chromium } = await import('playwright');
  const server = spawn(
    process.execPath,
    [join(PKG, 'scripts', 'static-server.mjs'), String(port), '..'],
    {
      cwd: PKG,
      stdio: 'ignore',
    },
  );
  const url = `http://localhost:${port}/rikiki/scripts/scene-bench/harness.html`;
  await waitFor(url);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  await page.goto(url);
  await page.waitForFunction(() => window.benchReady === true);
  await page.evaluate(() => document.fonts.ready);
  return {
    page,
    async close() {
      await browser.close();
      server.kill();
    },
  };
}
