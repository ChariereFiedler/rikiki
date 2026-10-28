import { describe, expect, it } from 'vitest';
import {
  type Box,
  type IllCode,
  type InkModel,
  type InkShape,
  lintIllustration,
} from './ill-rules.js';

// ════════════════════════════════════════════════════════════════
// Does the linter catch what it says it catches, and leave alone what is fine?
//
// Random clean drawings (a centred row of cards, even gaps, one accent, a few
// sizes) must produce nothing. Then a known defect is injected into each, and the
// rule that names that defect must fire · at least 95% of the time, over many
// mutants, on seeded draws so a failure is reproduced. A rule that misses a defect
// it was written for is a rule that cannot be trusted, and this is how that shows.
// ════════════════════════════════════════════════════════════════

const FRAME: Box = { left: 0, top: 0, right: 1000, bottom: 600 };
const RUNS = 120;
const RECALL = 0.95;

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random: () => number, low: number, high: number) => low + random() * (high - low);
const whole = (random: () => number, low: number, high: number) =>
  Math.floor(between(random, low, high + 1));

const box = (left: number, top: number, w: number, h: number): Box => ({
  left,
  top,
  right: left + w,
  bottom: top + h,
});

/** A drawing that is clean on every count, varied in count, size and gap. */
function cleanDrawing(random: () => number): InkModel {
  const count = whole(random, 3, 5);
  const gap = whole(random, 24, 50);
  const cardW = Math.floor((880 - gap * (count - 1)) / count);
  const cardH = whole(random, 280, 380);
  const top = Math.floor((600 - cardH) / 2);
  const left = Math.floor((1000 - (count * cardW + (count - 1) * gap)) / 2);
  const focal = whole(random, 0, count - 1);
  const shapes: InkShape[] = [];
  const texts: InkModel['texts'] = [];
  for (let i = 0; i < count; i += 1) {
    const x = left + i * (cardW + gap);
    shapes.push({
      kind: 'rect',
      box: box(x, top, cardW, cardH),
      fill: i === focal ? [240, 112, 32] : [240, 236, 232],
      accent: i === focal,
      stroke: 0,
    });
    texts.push({
      text: `Card ${i + 1}`,
      box: box(x + 16, top + 16, cardW - 32, 30),
      size: 31,
      weight: 650,
    });
    texts.push({
      text: 'one short note here',
      box: box(x + 16, top + 60, cardW - 32, 40),
      size: 25,
      weight: 400,
    });
  }
  return { frame: FRAME, allocated: FRAME, shapes, texts, motion: { endMs: 1500, endless: false } };
}

const codes = (model: InkModel): IllCode[] => lintIllustration(model).issues.map((i) => i.code);

const moved = (b: Box, dx: number, dy = 0): Box => ({
  left: b.left + dx,
  right: b.right + dx,
  top: b.top + dy,
  bottom: b.bottom + dy,
});

const MUTATIONS: { code: IllCode; mutate: (m: InkModel, random: () => number) => InkModel }[] = [
  {
    code: 'ILL_ESCAPE',
    mutate: (m, r) => ({
      ...m,
      shapes: m.shapes.map((s, i) =>
        i === 0 ? { ...s, box: moved(s.box, -(s.box.left + whole(r, 4, 80))) } : s,
      ),
    }),
  },
  {
    code: 'ILL_OFF_CENTRE',
    mutate: (m, r) => {
      const dx = -whole(r, 160, 260);
      return {
        ...m,
        shapes: m.shapes.map((s) => ({ ...s, box: moved(s.box, dx) })),
        texts: m.texts.map((t) => ({ ...t, box: moved(t.box, dx) })),
      };
    },
  },
  {
    code: 'ILL_NEAR_ALIGN',
    mutate: (m, r) => ({
      ...m,
      shapes: m.shapes.map((s, i) =>
        i === 1 ? { ...s, box: moved(s.box, 0, whole(r, 2, 5)) } : s,
      ),
    }),
  },
  {
    code: 'ILL_SHAPE_OVERLAP',
    mutate: (m, r) => {
      // Slide the second card left past the gap and into the first by 10 to 60px.
      const gap = m.shapes[1]!.box.left - m.shapes[0]!.box.right;
      const dx = -(gap + whole(r, 10, 60));
      return {
        ...m,
        shapes: m.shapes.map((s, i) =>
          i === 1 ? { ...s, box: moved(s.box, dx, whole(r, 20, 80)) } : s,
        ),
      };
    },
  },
  {
    code: 'ILL_FOCAL_MANY',
    mutate: (m) => {
      const other = m.shapes.find((s) => !s.accent)!;
      const second = { ...other, accent: true, fill: [240, 112, 32] as const };
      return { ...m, shapes: m.shapes.map((s) => (s === other ? second : s)) };
    },
  },
  {
    code: 'ILL_WORDY',
    mutate: (m) => ({
      ...m,
      texts: [
        ...m.texts,
        {
          text: Array.from({ length: 100 }, () => 'word').join(' '),
          box: box(100, 20, 800, 40),
          size: 25,
          weight: 400,
        },
      ],
    }),
  },
  {
    code: 'ILL_MOTION_ENDLESS',
    mutate: (m) => ({ ...m, motion: { endMs: 800, endless: true } }),
  },
  {
    code: 'ILL_MOTION_LONG',
    mutate: (m, r) => ({ ...m, motion: { endMs: whole(r, 3200, 9000), endless: false } }),
  },
  {
    code: 'ILL_TYPE_SCALE',
    mutate: (m) => ({
      ...m,
      texts: [
        ...m.texts,
        ...[14, 19, 44, 60].map((size, i) => ({
          text: 'x',
          box: box(20, 20 + i * 4, 40, 10),
          size,
          weight: 400,
        })),
      ],
    }),
  },
  {
    code: 'ILL_SPARSE',
    mutate: (m) => {
      const shrink = (b: Box): Box => {
        const cx = (b.left + b.right) / 2;
        const cy = (b.top + b.bottom) / 2;
        return {
          left: cx - (cx - b.left) * 0.2 + (500 - cx) * 0.9,
          right: cx + (b.right - cx) * 0.2 + (500 - cx) * 0.9,
          top: cy - (cy - b.top) * 0.2 + (300 - cy) * 0.9,
          bottom: cy + (b.bottom - cy) * 0.2 + (300 - cy) * 0.9,
        };
      };
      return {
        ...m,
        shapes: m.shapes.map((s) => ({ ...s, box: shrink(s.box) })),
        texts: m.texts.map((t) => ({ ...t, box: shrink(t.box) })),
      };
    },
  },
];

describe('the linter against drawings that are fine', () => {
  it('says nothing about any of 300 random clean drawings', () => {
    const random = mulberry32(1);
    const noisy: string[] = [];
    for (let i = 0; i < 300; i += 1) {
      const found = codes(cleanDrawing(random));
      if (found.length) noisy.push(`#${i}: ${found.join(', ')}`);
    }
    expect(noisy, noisy.slice(0, 5).join('\n')).toEqual([]);
  });
});

describe('the linter against drawings with a known defect', () => {
  for (const { code, mutate } of MUTATIONS) {
    it(`${code} fires on at least ${RECALL * 100}% of ${RUNS} mutants`, () => {
      const random = mulberry32(code.length * 9973);
      let caught = 0;
      for (let i = 0; i < RUNS; i += 1) {
        const mutant = mutate(cleanDrawing(random), random);
        if (codes(mutant).includes(code)) caught += 1;
      }
      expect(caught / RUNS, `${code}: ${caught} of ${RUNS}`).toBeGreaterThanOrEqual(RECALL);
    });
  }

  it('fails the verdict for every defect, whatever the score', () => {
    const random = mulberry32(7);
    for (const code of ['ILL_ESCAPE', 'ILL_SHAPE_OVERLAP', 'ILL_MOTION_ENDLESS'] as const) {
      const { mutate } = MUTATIONS.find((m) => m.code === code)!;
      for (let i = 0; i < 40; i += 1) {
        const verdict = lintIllustration(mutate(cleanDrawing(random), random));
        if (verdict.issues.some((issue) => issue.code === code))
          expect(verdict.verdict, code).toBe('fail');
      }
    }
  });
});
