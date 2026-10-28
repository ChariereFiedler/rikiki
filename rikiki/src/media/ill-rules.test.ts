import { describe, expect, it } from 'vitest';
import {
  type Box,
  type IllCode,
  ILL_LIMITS,
  type InkModel,
  type InkShape,
  type InkText,
  lintIllustration,
} from './ill-rules.js';

const FRAME: Box = { left: 0, top: 0, right: 1000, bottom: 600 };

const box = (left: number, top: number, w: number, h: number): Box => ({
  left,
  top,
  right: left + w,
  bottom: top + h,
});

const shape = (b: Box, over: Partial<InkShape> = {}): InkShape => ({
  kind: 'rect',
  box: b,
  fill: [240, 236, 232],
  accent: false,
  stroke: 0,
  ...over,
});

const text = (b: Box, words = 'two words', size = 28, over: Partial<InkText> = {}): InkText => ({
  text: words,
  box: b,
  size,
  weight: 400,
  ...over,
});

/** A drawing that is fine on every count · three cards, centred, one accent. */
function clean(over: Partial<InkModel> = {}): InkModel {
  const cards = [100, 400, 700].map((x) => shape(box(x, 150, 200, 300)));
  cards[1] = shape(box(400, 150, 200, 300), { accent: true, fill: [240, 112, 32] });
  return {
    frame: FRAME,
    allocated: FRAME,
    shapes: cards,
    texts: [
      text(box(120, 170, 160, 30), 'First', 31),
      text(box(420, 170, 160, 30), 'Second', 31),
      text(box(720, 170, 160, 30), 'Third', 31),
      text(box(120, 220, 160, 60), 'a short note', 25),
    ],
    motion: { endMs: 1200, endless: false },
    ...over,
  };
}

const codes = (model: InkModel): IllCode[] => lintIllustration(model).issues.map((i) => i.code);

describe('a clean drawing', () => {
  it('ships with a top score and no finding', () => {
    const verdict = lintIllustration(clean());
    expect(verdict.issues).toEqual([]);
    expect(verdict.score).toBe(100);
    expect(verdict.verdict).toBe('ship');
  });
});

describe('ILL_ESCAPE', () => {
  it('is a defect when a shape leaves the frame, stroke included', () => {
    const model = clean({ shapes: [...clean().shapes, shape(box(950, 100, 80, 80))] });
    const verdict = lintIllustration(model);
    expect(codes(model)).toContain('ILL_ESCAPE');
    expect(verdict.verdict).toBe('fail');
    expect(verdict.issues.find((i) => i.code === 'ILL_ESCAPE')?.severity).toBe('error');
  });

  it('counts half the stroke as ink', () => {
    const flush = shape(box(0, 0, 1000, 600), { stroke: 8 });
    expect(codes(clean({ shapes: [flush] }))).toContain('ILL_ESCAPE');
    const inside = shape(box(4, 4, 992, 592), { stroke: 8 });
    expect(codes(clean({ shapes: [inside] }))).not.toContain('ILL_ESCAPE');
  });

  it('forgives the antialiasing of an edge', () => {
    const edge = shape(box(0, 0, 1000 + ILL_LIMITS.escapePx, 600));
    expect(codes(clean({ shapes: [edge] }))).not.toContain('ILL_ESCAPE');
  });
});

describe('ILL_OFF_CENTRE and ILL_MARGIN_UNEVEN', () => {
  const leaning = () =>
    clean({
      shapes: [shape(box(40, 150, 300, 300)), shape(box(380, 150, 300, 300))],
      texts: [text(box(60, 170, 200, 30), 'Left', 31)],
    });

  it('warns when the weight sits to one side of the room', () => {
    const verdict = lintIllustration(leaning());
    const found = verdict.issues.find((i) => i.code === 'ILL_OFF_CENTRE');
    expect(found?.severity).toBe('warning');
    expect(found?.fix).toMatchObject({ action: 'centre', toward: 'right' });
    expect(found?.measurement.dxPct).toBeLessThan(-8);
  });

  it('warns when the margins differ by more than 6% of the width', () => {
    expect(codes(leaning())).toContain('ILL_MARGIN_UNEVEN');
  });

  it('lets a drawing lean when it says it is meant', () => {
    const model = { ...leaning(), balance: 'free' as const };
    expect(codes(model)).not.toContain('ILL_OFF_CENTRE');
    expect(codes(model)).not.toContain('ILL_MARGIN_UNEVEN');
  });

  it('is quiet for a centred drawing, and for a small lean', () => {
    expect(codes(clean())).not.toContain('ILL_OFF_CENTRE');
    const slight = clean({
      shapes: [shape(box(130, 150, 300, 300)), shape(box(470, 150, 300, 300))],
    });
    expect(codes(slight)).not.toContain('ILL_MARGIN_UNEVEN');
  });

  it('judges against the room it was given, not the frame', () => {
    const room: Box = { left: 0, top: 0, right: 2000, bottom: 600 };
    expect(codes(clean({ allocated: room }))).toContain('ILL_MARGIN_UNEVEN');
  });
});

describe('ILL_SPARSE', () => {
  it('warns when the ink fills under 40% of the room', () => {
    const model = clean({ shapes: [shape(box(450, 250, 100, 100))], texts: [] });
    expect(codes(model)).toContain('ILL_SPARSE');
  });

  it('is quiet when the drawing fills its room', () => {
    expect(codes(clean())).not.toContain('ILL_SPARSE');
  });
});

describe('ILL_NEAR_ALIGN', () => {
  it('warns about edges that miss each other by a few pixels', () => {
    const shapes = [
      shape(box(100, 150, 200, 300)),
      shape(box(104, 460, 200, 100)),
      shape(box(500, 150, 200, 300)),
    ];
    const found = lintIllustration(clean({ shapes })).issues.find(
      (i) => i.code === 'ILL_NEAR_ALIGN',
    );
    expect(found?.measurement.worstPx).toBe(4);
    expect(found?.fix).toMatchObject({ action: 'align', edge: 'left' });
  });

  it('is quiet for equal edges and for deliberate offsets', () => {
    const equal = [shape(box(100, 150, 200, 300)), shape(box(100, 460, 200, 100))];
    expect(codes(clean({ shapes: equal }))).not.toContain('ILL_NEAR_ALIGN');
    const offset = [shape(box(100, 150, 200, 300)), shape(box(140, 460, 200, 100))];
    expect(codes(clean({ shapes: offset }))).not.toContain('ILL_NEAR_ALIGN');
  });

  it('is quiet for a pixel of rounding, and for a ring, whose marks are not to be aligned', () => {
    const rounding = [shape(box(100, 150, 200, 300)), shape(box(101.2, 460, 200, 100))];
    expect(codes(clean({ shapes: rounding }))).not.toContain('ILL_NEAR_ALIGN');
    const slip = [shape(box(100, 150, 200, 300)), shape(box(104, 460, 200, 100))];
    expect(codes(clean({ shapes: slip }))).toContain('ILL_NEAR_ALIGN');
    expect(codes(clean({ shapes: slip, layout: 'ring' }))).not.toContain('ILL_NEAR_ALIGN');
  });

  it('is quiet under a pixel and a half', () => {
    const rounding = [shape(box(100, 150, 200, 300)), shape(box(100.3, 460, 200, 100))];
    expect(codes(clean({ shapes: rounding }))).not.toContain('ILL_NEAR_ALIGN');
  });

  it('is quiet for boxes of different widths centred on one line, a centred column', () => {
    // A graph's rank: render, check, export, each as wide as its word, centred.
    const column = [
      shape(box(400, 100, 92, 50)),
      shape(box(403.5, 250, 85, 50)),
      shape(box(401.5, 400, 89, 50)),
    ];
    expect(codes(clean({ shapes: column }))).not.toContain('ILL_NEAR_ALIGN');
    const slipped = [shape(box(400, 100, 92, 50)), shape(box(403.5, 250, 92, 50))];
    expect(codes(clean({ shapes: slipped }))).toContain('ILL_NEAR_ALIGN');
  });
});

describe('ILL_RHYTHM', () => {
  const row = (gaps: number[]) => {
    let x = 100;
    const shapes = [shape(box(x, 200, 100, 100))];
    for (const gap of gaps) {
      x += 100 + gap;
      shapes.push(shape(box(x, 200, 100, 100)));
    }
    return clean({ shapes });
  };

  it('warns when the gaps between neighbours are uneven', () => {
    const found = lintIllustration(row([30, 60, 25, 70])).issues.find(
      (i) => i.code === 'ILL_RHYTHM',
    );
    expect(found?.measurement.neighbours).toBe(5);
    expect(found?.fix).toMatchObject({ action: 'even-gaps', axis: 'x' });
  });

  it('is quiet for even gaps, and for fewer than three', () => {
    expect(codes(row([40, 40, 40, 40]))).not.toContain('ILL_RHYTHM');
    expect(codes(row([20, 80]))).not.toContain('ILL_RHYTHM');
  });

  it('does not count the wide gap between two groups as a break of the rhythm', () => {
    // Two panels of cells · even inside each, far apart from each other.
    expect(codes(row([12, 12, 12, 400, 12, 12, 12]))).not.toContain('ILL_RHYTHM');
  });
});

describe('ILL_SHAPE_OVERLAP', () => {
  it('is a defect when two shapes are half on top of each other', () => {
    const model = clean({
      shapes: [shape(box(100, 150, 200, 300)), shape(box(250, 200, 200, 300))],
    });
    const verdict = lintIllustration(model);
    expect(verdict.issues.find((i) => i.code === 'ILL_SHAPE_OVERLAP')?.severity).toBe('error');
    expect(verdict.verdict).toBe('fail');
  });

  it('allows a shape holding another, and a declared overlay', () => {
    const holding = clean({
      shapes: [shape(box(100, 150, 400, 300)), shape(box(150, 200, 100, 100))],
    });
    expect(codes(holding)).not.toContain('ILL_SHAPE_OVERLAP');
    const overlay = clean({
      shapes: [shape(box(100, 150, 200, 300)), shape(box(250, 200, 200, 300), { role: 'overlay' })],
    });
    expect(codes(overlay)).not.toContain('ILL_SHAPE_OVERLAP');
  });

  it('allows shapes that only touch', () => {
    const touching = clean({
      shapes: [shape(box(100, 150, 200, 300)), shape(box(300, 150, 200, 300))],
    });
    expect(codes(touching)).not.toContain('ILL_SHAPE_OVERLAP');
  });
});

describe('ILL_FOCAL_MANY and ILL_FOCAL_WEAK', () => {
  const accent = (b: Box) => shape(b, { accent: true, fill: [240, 112, 32] });

  it('warns when the accent is on separate regions', () => {
    const model = clean({
      shapes: [
        accent(box(100, 150, 200, 300)),
        shape(box(400, 150, 200, 300)),
        accent(box(700, 150, 200, 300)),
      ],
    });
    expect(
      lintIllustration(model).issues.find((i) => i.code === 'ILL_FOCAL_MANY')?.measurement.regions,
    ).toBe(2);
  });

  it('counts a run of touching accent cells as one focal', () => {
    const cells = Array.from({ length: 12 }, (_, i) =>
      accent(box(100 + (i % 4) * 22, 150 + Math.floor(i / 4) * 22, 20, 20)),
    );
    const model = clean({ shapes: [...cells, shape(box(500, 150, 300, 300))] });
    expect(codes(model)).not.toContain('ILL_FOCAL_MANY');
  });

  it('counts a series of equal accent marks as one focal, far apart or not', () => {
    // The status dots of a matrix · eight, in two columns, all one size.
    const dots = Array.from({ length: 8 }, (_, i) =>
      accent(box(100 + (i % 2) * 300, 100 + Math.floor(i / 2) * 120, 40, 40)),
    );
    expect(codes(clean({ shapes: [...dots, shape(box(500, 100, 300, 400))] }))).not.toContain(
      'ILL_FOCAL_MANY',
    );
  });

  it('warns when the accent is much smaller than what is next to it', () => {
    const model = clean({
      shapes: [accent(box(100, 150, 60, 80)), shape(box(300, 100, 600, 400))],
    });
    expect(codes(model)).toContain('ILL_FOCAL_WEAK');
  });

  it('does not set the accent against the surface it sits in · a gauge filling its track', () => {
    const track = shape(box(100, 150, 800, 40));
    const fill = accent(box(100, 150, 300, 40));
    expect(codes(clean({ shapes: [track, fill] }))).not.toContain('ILL_FOCAL_WEAK');
    // A surface beside it still competes.
    const card = shape(box(100, 250, 800, 200));
    expect(codes(clean({ shapes: [track, fill, card] }))).toContain('ILL_FOCAL_WEAK');
  });

  it('does not set the accent against a panel of the composition beside it, a ground', () => {
    const fill = accent(box(100, 150, 300, 40));
    const panel = { ...shape(box(500, 100, 450, 400)), markKind: 'panel' };
    expect(codes(clean({ shapes: [fill, panel] }))).not.toContain('ILL_FOCAL_WEAK');
  });

  it('is quiet when the accent leads, by colour at equal size or by size', () => {
    expect(codes(clean())).not.toContain('ILL_FOCAL_WEAK');
    const equal = clean({
      shapes: [accent(box(100, 150, 200, 300)), shape(box(400, 150, 200, 300))],
    });
    expect(codes(equal)).not.toContain('ILL_FOCAL_WEAK');
  });
});

describe('ILL_TYPE_SCALE and ILL_WORDY', () => {
  it('warns about more than four font sizes', () => {
    const texts = [14, 20, 28, 40, 56].map((size, i) =>
      text(box(100, 100 + i * 60, 200, 40), 'x', size),
    );
    expect(codes(clean({ texts }))).toContain('ILL_TYPE_SCALE');
  });

  it('warns about sizes too close to be a hierarchy', () => {
    const texts = [text(box(100, 100, 200, 40), 'x', 25), text(box(100, 160, 200, 40), 'y', 27)];
    expect(codes(clean({ texts }))).toContain('ILL_TYPE_SCALE');
  });

  it('does not call two voices one size when their weights differ', () => {
    const texts = [
      text(box(100, 100, 200, 40), 'a note', 27, { weight: 400 }),
      text(box(100, 160, 200, 40), 'a tag', 25, { weight: 600 }),
    ];
    expect(codes(clean({ texts }))).not.toContain('ILL_TYPE_SCALE');
  });

  it('is quiet for three clearly different sizes', () => {
    const texts = [25, 31, 56].map((size, i) => text(box(100, 100 + i * 60, 200, 40), 'x', size));
    expect(codes(clean({ texts }))).not.toContain('ILL_TYPE_SCALE');
  });

  it('warns about more than ninety words', () => {
    const words = Array.from({ length: 91 }, () => 'word').join(' ');
    expect(codes(clean({ texts: [text(box(100, 100, 800, 200), words)] }))).toContain('ILL_WORDY');
    expect(codes(clean())).not.toContain('ILL_WORDY');
  });
});

describe('motion', () => {
  it('is a defect when an animation never ends', () => {
    const verdict = lintIllustration(clean({ motion: { endMs: 900, endless: true } }));
    expect(verdict.issues.find((i) => i.code === 'ILL_MOTION_ENDLESS')?.severity).toBe('error');
    expect(verdict.verdict).toBe('fail');
  });

  it('warns past 3s and fails past 5s', () => {
    const slow = lintIllustration(clean({ motion: { endMs: 3500, endless: false } }));
    expect(slow.issues.find((i) => i.code === 'ILL_MOTION_LONG')?.severity).toBe('warning');
    const slower = lintIllustration(clean({ motion: { endMs: 5200, endless: false } }));
    expect(slower.issues.find((i) => i.code === 'ILL_MOTION_LONG')?.severity).toBe('error');
  });
});

describe('the verdict', () => {
  it('fails on any defect whatever the score', () => {
    const model = clean({ shapes: [...clean().shapes, shape(box(950, 100, 80, 80))] });
    const verdict = lintIllustration(model);
    expect(verdict.verdict).toBe('fail');
    expect(verdict.score).toBeLessThan(100);
  });

  it('ranks by score otherwise · 85 ships, 70 is reread, under it is redone', () => {
    expect(lintIllustration(clean()).verdict).toBe('ship');
    const leaning = lintIllustration(
      clean({ shapes: [shape(box(40, 150, 300, 300)), shape(box(380, 150, 300, 300))], texts: [] }),
    );
    expect(leaning.verdict).not.toBe('fail');
    expect(leaning.score).toBeLessThan(100);
  });

  it('keeps six facets, each between 0 and 100', () => {
    const { facets } = lintIllustration(clean({ motion: { endMs: 4000, endless: false } }));
    expect(Object.keys(facets).sort()).toEqual([
      'alignment',
      'balance',
      'density',
      'frame',
      'hierarchy',
      'motion',
    ]);
    for (const value of Object.values(facets)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(facets.motion).toBeLessThan(100);
  });

  it('gives every finding a fix and the numbers behind it', () => {
    const model = clean({
      shapes: [shape(box(40, 150, 300, 300)), shape(box(380, 150, 300, 300))],
      motion: { endMs: 4000, endless: false },
    });
    for (const issue of lintIllustration(model).issues) {
      expect(issue.fix?.action, issue.code).toBeTruthy();
      expect(Object.keys(issue.measurement).length, issue.code).toBeGreaterThan(0);
    }
  });

  it('never throws on an empty drawing', () => {
    const empty: InkModel = {
      frame: FRAME,
      allocated: FRAME,
      texts: [],
      shapes: [],
      motion: { endMs: 0, endless: false },
    };
    expect(() => lintIllustration(empty)).not.toThrow();
  });
});
