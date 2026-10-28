// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the strip of the act
//
// `<deck-diagram acts="terminal · code · environnement · exploitation · client"
// act="code">` draws, above the picture, where the act stands: a rail through
// its steps, the steps behind as full dots, the one it is at in the accent and
// in bold, the steps ahead as rings, each named under its station. The talk "Un
// sales qui code" carries one through its second act (`nav.parcours`), slide
// after slide, so the room always knows how far it has come.
//
// The steps are written once per diagram, separated by `·`, as a cover writes its
// brand · `rikiki check` says when two diagrams of one act write it two ways
// (ILL_ACT_DRIFT). The strip has a height of its own, taken off the room of the
// drawing, and is never framed by a camera. Pure: words in, places out.
// ════════════════════════════════════════════════════════════════

import { type Measure, TYPE } from '../scene-layout.js';

/** How many steps an act holds · one is no progression, past seven a label each
 *  no longer reads across the slide. */
export const ACT_STEPS = Object.freeze({ min: 2, max: 7 });

/** The strip's measures, in drawing units. */
export const ACT_STRIP = Object.freeze({
  /** The station the act is at, and the others. */
  current: 13,
  station: 8,
  /** Between a station and its label. */
  gap: 10,
  /** Under the strip, before the picture. */
  below: 28,
  /** Room kept on either side of a label, and the least a step is given. */
  pad: 24,
  slot: 180,
  rail: 3,
});

/** The words of the labels · the step the act is at is set bold. */
export const ACT_TYPE = Object.freeze({
  size: TYPE.tag.size,
  line: TYPE.tag.line,
  weight: 600,
  current: 750,
});

/** The height the strip takes off the drawing's room, its margin under it included. */
export const ACT_HEIGHT = 2 * ACT_STRIP.current + ACT_STRIP.gap + ACT_TYPE.line + ACT_STRIP.below;

/** `terminal · code · client` → its steps, trimmed, none empty. */
export function readActs(text: string | undefined): string[] {
  return (text ?? '')
    .split('·')
    .map((step) => step.trim())
    .filter(Boolean);
}

/** Where `act` stands among the steps, case aside · -1 when it is none of them. */
export function actIndex(steps: readonly string[], act: string | undefined): number {
  const wanted = (act ?? '').trim().toLowerCase();
  return steps.findIndex((step) => step.toLowerCase() === wanted);
}

export type StationState = 'done' | 'current' | 'todo';

export interface ActStation {
  label: string;
  x: number;
  state: StationState;
}

export interface ActLayout {
  stations: ActStation[];
  /** The rail, at the height of the stations, and how far it is travelled. */
  rail: { x0: number; x1: number; y: number; reached: number };
  /** The baseline's top of the labels. */
  labelY: number;
  height: number;
  /** The labels hold apart on the width given · else they are drawn anyway, and said. */
  fits: boolean;
}

/** The strip laid across `width` · the steps evenly apart, as far as the widest
 *  label needs and no farther, centred. */
export function layoutAct(
  steps: readonly string[],
  at: number,
  width: number,
  measure: { regular: Measure; bold: Measure },
): ActLayout {
  const widths = steps.map((step, i) => (i === at ? measure.bold : measure.regular)(step));
  const needed = Math.max(ACT_STRIP.slot, Math.max(...widths) + 2 * ACT_STRIP.pad);
  const slot = Math.min(needed, width / steps.length);
  const x0 = width / 2 - (slot * (steps.length - 1)) / 2;
  const stations = steps.map((label, i) => ({
    label,
    x: x0 + i * slot,
    state: (i < at ? 'done' : i === at ? 'current' : 'todo') as StationState,
  }));
  const y = ACT_STRIP.current;
  // A label wider than its slot runs into the next one, and the first and the last
  // must stay on the canvas.
  const fits =
    widths.every((w) => w <= slot) &&
    stations[0]!.x - widths[0]! / 2 >= 0 &&
    stations.at(-1)!.x + widths.at(-1)! / 2 <= width;
  return {
    stations,
    rail: { x0, x1: stations.at(-1)!.x, y, reached: stations[Math.max(0, at)]!.x },
    labelY: 2 * ACT_STRIP.current + ACT_STRIP.gap,
    height: ACT_HEIGHT,
    fits,
  };
}
