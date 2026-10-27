// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, what the drawings of the marks share
//
// A text set by the layout, drawn line under line · and a movement, as the style
// its animation reads. Used by draw-marks.ts and draw-charts.ts.
// ════════════════════════════════════════════════════════════════

import { svg } from 'lit';
import type { LText } from './layout.js';
import type { Timing } from './motion.js';

/** Where a line's baseline sits, as a share of its size from its top. */
export const BASELINE = 0.8;

/** When something moves, as the style its animation reads. */
export const at = (t: Timing | undefined) =>
  t ? `--t0:${t.start.toFixed(3)}s;--du:${Math.max(0.01, t.duration).toFixed(3)}s` : '';

/** The part of a movement from share `from` to share `to` of it. */
export const part = (t: Timing | undefined, from: number, to: number): Timing | undefined =>
  t
    ? { start: t.start + t.duration * from, duration: t.duration * (to - from), stage: t.stage }
    : undefined;

/** A text, its lines one under the other · `cls` says its role and its colour. */
export function words(t: LText, cls: string, anchor: 'start' | 'middle' = 'start', x = t.x) {
  return t.lines.map(
    (line, n) =>
      svg`<text class=${cls} x=${x} y=${t.y + n * t.line + t.size * BASELINE} text-anchor=${anchor} font-size=${t.size} font-weight=${t.weight}>${line}</text>`,
  );
}
