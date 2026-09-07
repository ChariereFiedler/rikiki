// ════════════════════════════════════════════════════════════════
// Waiting for a slide to be finished, not merely current
//
// A deck cross-fades between slides, so the moment the active attribute moves
// there are briefly TWO slides painted, one sliding out. A screenshot taken
// then shows both, and any colour read from it belongs to neither.
//
// This waits on the engine's own animation state · a condition, never a delay.
// ════════════════════════════════════════════════════════════════

import type { Page } from '@playwright/test';

/** Resolve once nothing on the page is still animating and a frame has passed. */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
