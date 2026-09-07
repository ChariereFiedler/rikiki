// ════════════════════════════════════════════════════════════════
// A transition never shows the slide it is leaving
//
// The shipped transitions are transform-only, and two of them used to bring the
// incoming slide in from BELOW full size · fade from scale(0.94), zoom from
// scale(0.86). For half a second the incoming slide was therefore smaller than
// the canvas while the outgoing slide, still painted underneath, framed it.
// When the two slides carry different surfaces the room sees a hard border in
// the wrong colour around every transition · paper around a dark slide, which
// is what gets noticed.
//
// The animation is DRIVEN here rather than waited on: every keyframe is paused
// and seeked to a fixed progress, so the measurement lands on the same frame
// every run. Sampling after a timeout would make this a coin flip on machine
// speed, and this suite keeps retries at zero.
//
// Chromium only, in line with emphasis and ink · reading colour is not an
// engine-variance question.
// ════════════════════════════════════════════════════════════════

import { expect, test } from '@playwright/test';
import { deltaE, parseColor } from '../src/shared/contrast.js';
import { createDeckPage } from './pages/deck.page';

const DECK = '/rikiki/decks/tests/balance.html';

/** Slide 3 is paper, slide 4 is the dark section · the pair whose transition
 *  exposes the defect. These are the deep-link hashes the deck accepts. */
const FROM = '#3';

/** The transitions that scale or rotate the incoming slide · each one promises
 *  to COVER, because a slide smaller than the canvas frames itself in whatever
 *  is painted behind it, and the room reads that as a border rather than as
 *  motion.
 *
 *  The translating transitions are deliberately out of scope. They promise to
 *  TILE instead, and both slides being on the canvas is the point of them ·
 *  asserting that from four edge pixels measures whichever glyph happens to sit
 *  at the seam, not the seam. They were never the defect, and a fragile test
 *  guarding nothing is worse than no test. */
const COVERING = ['fade', 'zoom', 'flip'] as const;

/** Where in the animation to look. Early is where the gap is widest; late
 *  proves it has closed rather than merely moved. */
const PROGRESS = [0.1, 0.3, 0.6];

/** Two colours this far apart are different colours to the eye · the CIE76
 *  threshold the theme surfaces are already held to. */
const SAME_COLOUR = 10;

/**
 * Read the four inner edges of the canvas in one shot.
 *
 * Only the edges · the centre of a slide is the incoming slide by construction,
 * and it carries type as often as surface, so sampling it would measure
 * whichever glyph happens to sit there.
 */
async function readEdges(page: import('@playwright/test').Page) {
  const shot = await page.screenshot();
  return page.evaluate(async (data) => {
    const root = document.querySelector('deck-root');
    const stage = root?.shadowRoot?.querySelector('#stage');
    if (!stage) throw new Error('no #stage to sample');
    const box = stage.getBoundingClientRect();

    const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no 2d context to decode the screenshot into');
    context.drawImage(bitmap, 0, 0);
    const scale = bitmap.width / window.innerWidth;
    const at = (x: number, y: number): string => {
      const px = context.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data;
      return `rgb(${px[0]}, ${px[1]}, ${px[2]})`;
    };

    const midX = box.left + box.width / 2;
    const midY = box.top + box.height / 2;

    /* The progress bar is deck-root chrome pinned to the bottom of the host, so
       at a pillarboxed aspect it overlaps the bottom edge of the canvas. It is
       painted in the accent on purpose · stepping over it keeps this measuring
       the slide rather than the chrome. */
    const chrome = root?.shadowRoot?.querySelector('#progress')?.getBoundingClientRect();
    const bottomInset = chrome ? Math.max(3, box.bottom - chrome.top + 2) : 3;

    // Two pixels in from the edge · far enough to clear antialiasing, close
    // enough that only a real frame of foreign colour lands there.
    return {
      left: at(box.left + 2, midY),
      right: at(box.right - 3, midY),
      top: at(midX, box.top + 2),
      bottom: at(midX, box.bottom - bottomInset),
    };
  }, shot.toString('base64'));
}

/** Pause every running animation at a fixed fraction of its own duration. */
async function seekTransition(page: import('@playwright/test').Page, progress: number) {
  await page.evaluate((fraction) => {
    const running = document.getAnimations().filter((a) => a.playState === 'running');
    if (running.length === 0) throw new Error('no transition is running to seek');
    for (const animation of running) {
      const timing = animation.effect?.getComputedTiming();
      const duration = typeof timing?.duration === 'number' ? timing.duration : 0;
      animation.pause();
      animation.currentTime = duration * fraction;
    }
  }, progress);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}

for (const transition of COVERING) {
  for (const progress of PROGRESS) {
    test(`${transition} shows only the incoming slide at ${progress * 100}%`, async ({ page }) => {
      test.skip(
        test.info().project.name !== 'chromium',
        'reads pixels · chromium carries the colour contract',
      );
      const deck = createDeckPage(page);
      await deck.goto(`${DECK}${FROM}`);
      await page.evaluate(
        (name) => document.querySelector('deck-root')?.setAttribute('transition', name),
        transition,
      );

      // Warm the lazy transition plugin · it installs on the first navigation,
      // so a measurement taken on that navigation would measure no transition.
      await deck.advance();
      await deck.back();
      // Wait for the plugin's own bookkeeping, not merely for the animations:
      // it strips its classes on a timer that outlives them, and a leftover
      // timer from the warm-up lands on the slide the measured run animates.
      await page.waitForFunction(
        () =>
          document.getAnimations().length === 0 &&
          [...document.querySelectorAll('deck-root > *')].every(
            (el) => !/\brk-(enter|exit|leaving)/.test(el.className),
          ),
      );

      const surfaceOf = (selector: string) =>
        page.evaluate(
          (sel) => getComputedStyle(document.querySelector(sel)!).backgroundColor,
          selector,
        );
      const incoming = await surfaceOf('#dark-section');
      const outgoing = await surfaceOf('#ragged');
      const wanted = parseColor(incoming);
      const unwanted = parseColor(outgoing);
      expect(wanted, 'could not read the incoming surface').not.toBeNull();
      expect(unwanted, 'could not read the outgoing surface').not.toBeNull();
      expect(
        deltaE(wanted!, unwanted!),
        'the two slides share a surface · this pair would prove nothing',
      ).toBeGreaterThan(SAME_COLOUR);

      await deck.advance();
      await seekTransition(page, progress);

      const edges = await readEdges(page);
      for (const [side, colour] of Object.entries(edges)) {
        const seen = parseColor(colour);
        expect(seen, `could not read the ${side} sample`).not.toBeNull();

        expect(
          deltaE(seen!, wanted!),
          `the ${side} of the canvas shows ${colour} instead of the incoming ${incoming}`,
        ).toBeLessThan(SAME_COLOUR);
      }
    });
  }
}
