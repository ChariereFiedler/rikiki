// ════════════════════════════════════════════════════════════════
// Reading the pixels a slide actually paints
//
// getComputedStyle answers what a declaration SAYS. These helpers answer what
// the audience SEES, which is a different question once alpha, gradients, an
// inherited opacity, an SVG fill or a box-shadow ring are involved · and every
// visual defect this repo has shipped lived in that gap.
//
// The PNG is decoded inside the browser (createImageBitmap plus a canvas) so
// this costs no dependency. Chromium only, which is enough: colour is not an
// engine-variance question.
// ════════════════════════════════════════════════════════════════

import type { Page } from '@playwright/test';
import type { Rgb } from '../../src/shared/contrast.js';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The colour of a region and of the strip just outside it. */
export interface Sample {
  inside: Rgb;
  ring: Rgb;
}

/**
 * Decode a PNG in the page and return the median colour inside and outside.
 *
 * Median rather than mean, and it matters: a mean over a filled row is dragged
 * by the glyphs sitting on it and reports a colour nothing on screen has. The
 * median reports the colour that covers most of the area, which is the surface.
 */
async function decode(page: Page, base64: string, inner: Box, clipWidth: number): Promise<Sample> {
  return page.evaluate(
    async ({ data, inner, clipWidth }) => {
      const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('no 2d context to decode the screenshot into');
      context.drawImage(bitmap, 0, 0);
      const { data: px } = context.getImageData(0, 0, bitmap.width, bitmap.height);

      // The shot is taken at the device pixel ratio, so CSS pixels scale.
      const scale = bitmap.width / clipWidth;
      const box = {
        x: inner.x * scale,
        y: inner.y * scale,
        right: (inner.x + inner.width) * scale,
        bottom: (inner.y + inner.height) * scale,
      };
      const channels = { inside: [[], [], []], ring: [[], [], []] } as Record<string, number[][]>;
      for (let y = 0; y < bitmap.height; y += 1) {
        for (let x = 0; x < bitmap.width; x += 1) {
          const where =
            x >= box.x && x < box.right && y >= box.y && y < box.bottom ? 'inside' : 'ring';
          const i = (y * bitmap.width + x) * 4;
          channels[where]![0]!.push(px[i]!);
          channels[where]![1]!.push(px[i + 1]!);
          channels[where]![2]!.push(px[i + 2]!);
        }
      }
      const median = (list: number[]): number => {
        const sorted = [...list].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)] ?? 0;
      };
      const asRgb = (c: number[][]) => ({ r: median(c[0]!), g: median(c[1]!), b: median(c[2]!) });
      return { inside: asRgb(channels.inside!), ring: asRgb(channels.ring!) };
    },
    { data: base64, inner, clipWidth },
  );
}

/**
 * Sample an element and the band around it in ONE screenshot.
 *
 * The band is the element's own backdrop, measured rather than assumed: which
 * ancestor paints it is not knowable from the element, and guessing is how a
 * check ends up comparing a surface against the wrong thing.
 */
export async function sampleAround(page: Page, box: Box, pad = 12): Promise<Sample> {
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + 2 * pad,
    height: box.height + 2 * pad,
  };
  const shot = await page.screenshot({ clip });
  return decode(
    page,
    shot.toString('base64'),
    { x: box.x - clip.x, y: box.y - clip.y, width: box.width, height: box.height },
    clip.width,
  );
}
