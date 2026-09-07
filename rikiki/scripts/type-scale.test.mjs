// ════════════════════════════════════════════════════════════════
// The type scale runs one way
//
// A slide has one loud thing on it. That only holds if the sizes are ordered:
// the moment a punchline resolves larger than the title of the slide it sits
// on, the slide has two statements and the eye picks the wrong one. It has
// already happened here once — the theme still carries the note about mega
// having been smaller than big — and it was fixed by hand, without a test, so
// nothing stopped it happening again in the next size change.
//
// Reading the ORDER rather than the numbers is the point. The values are a
// theme's business and are meant to differ; which role outranks which is the
// design system's, and it must not.
// ════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { themeFiles } from './css-source.mjs';

/** The reading-to-statement ladder, quietest first. Equal ranks are allowed ·
 *  a punchline may match the slide title, it may never beat it. */
const LADDER = ['xs', 'sm', 'body', 'lead', 'h1', 'display', 'section'];

/** Resolve --rik-font-size-* through the raw scale it aliases. */
function resolveScale(css) {
  const declared = new Map();
  for (const [, name, value] of css.matchAll(/(--rik-(?:text|font-size)-[\w-]+)\s*:\s*([^;]+);/g)) {
    declared.set(name, value.trim());
  }
  const resolve = (raw, seen = new Set()) => {
    const alias = raw.match(/^var\((--rik-[\w-]+)\)$/);
    if (!alias) return Number.parseFloat(raw);
    const next = alias[1];
    if (seen.has(next)) throw new Error(`--rik-* size alias loops at ${next}`);
    seen.add(next);
    const target = declared.get(next);
    return target === undefined ? Number.NaN : resolve(target, seen);
  };
  const sizes = new Map();
  for (const role of LADDER) {
    const raw = declared.get(`--rik-font-size-${role}`);
    if (raw === undefined) continue;
    sizes.set(role, resolve(raw));
  }
  return sizes;
}

describe.each(themeFiles())('$name', ({ file, name }) => {
  const sizes = resolveScale(readFileSync(file, 'utf8'));

  it('declares every role on the ladder', () => {
    const missing = LADDER.filter((role) => !sizes.has(role));
    expect(missing, `${name} declares no size for: ${missing.join(', ')}`).toEqual([]);
  });

  it('never lets a quieter role outgrow a louder one', () => {
    const inversions = [];
    for (let i = 1; i < LADDER.length; i += 1) {
      const quieter = LADDER[i - 1];
      const louder = LADDER[i];
      const a = sizes.get(quieter);
      const b = sizes.get(louder);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (a > b) inversions.push(`${quieter} (${a}rem) is larger than ${louder} (${b}rem)`);
    }
    expect(
      inversions,
      `${name} inverts the ladder · a slide with both on it has two statements`,
    ).toEqual([]);
  });

  /* The 8H rule · the furthest seat in a room is about eight screen heights
   * back, and text stays legible from there at 1/50 of the screen height. It
   * is the one number in presentation practice that is a floor rather than a
   * preference, so it is the one worth encoding: below it the text is not
   * quiet, it is absent.
   *
   * The canvas is 1080 logical pixels tall and deck-root sets the rem baseline
   * to 2.35% of it, which is what makes a rem convertible to a share of the
   * screen here. See https://presentationguild.org/how-big-big-enough-the-8h-rule-reveals-all/
   */
  const CANVAS_H = 1080;
  const REM = CANVAS_H * 0.0235;
  const FLOOR = CANVAS_H / 50;

  it('keeps every text role above the legibility floor', () => {
    const tooSmall = [];
    for (const [role, rem] of sizes) {
      if (!Number.isFinite(rem)) continue;
      const px = rem * REM;
      if (px < FLOOR) {
        tooSmall.push(
          `${role} is ${px.toFixed(1)}px · 1/${Math.round(CANVAS_H / px)} of the height`,
        );
      }
    }
    expect(
      tooSmall,
      `${name} sets text below 1/50 of the screen height, which the back row cannot read`,
    ).toEqual([]);
  });

  it('makes a statement a different size, not the same size in bold', () => {
    const body = sizes.get('body');
    const title = sizes.get('h1');
    expect(Number.isFinite(body) && Number.isFinite(title), 'both roles resolve').toBe(true);
    // Below about two, a title reads as body text that happens to be bold ·
    // which is what the decks were rejected for. See ADR-002 on the two sizes.
    expect(
      title / body,
      `${name} sets its slide title at ${(title / body).toFixed(2)}x the body`,
    ).toBeGreaterThanOrEqual(2);
  });
});
