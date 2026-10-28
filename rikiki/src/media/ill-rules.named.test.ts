import { describe, expect, it } from 'vitest';
import {
  type Box,
  type IllCode,
  type InkModel,
  type InkShape,
  type InkText,
  lintIllustration,
} from './ill-rules.js';

// The illustration rules on a diagram, whose painted parts say which mark drew them
// (`mark`, `markKind`, `role`) · a finding names the mark and the attribute to change,
// and the changes it proposes are tried on the ink before they are proposed. And the
// three traps of the free grammar that were the rules': gates in series read as many
// focals, an open gate read as the accent, lanes read as leaning.

const FRAME: Box = { left: 0, top: 0, right: 1000, bottom: 600 };
const ACCENT = [240, 112, 32] as const;
const CARD = [240, 236, 232] as const;

const box = (left: number, top: number, w: number, h: number): Box => ({
  left,
  top,
  right: left + w,
  bottom: top + h,
});

const shape = (b: Box, over: Partial<InkShape> = {}): InkShape => ({
  kind: 'rect',
  box: b,
  fill: CARD,
  accent: false,
  stroke: 0,
  ...over,
});

const text = (b: Box, words: string, over: Partial<InkText> = {}): InkText => ({
  text: words,
  box: b,
  size: 28,
  weight: 400,
  ...over,
});

const model = (shapes: InkShape[], texts: InkText[], over: Partial<InkModel> = {}): InkModel => ({
  frame: FRAME,
  allocated: FRAME,
  shapes,
  texts,
  motion: { endMs: 1000, endless: false },
  ...over,
});

const find = (m: InkModel, code: IllCode) =>
  lintIllustration(m).issues.find((i) => i.code === code);

const gate = (left: number, top: number, h: number) =>
  shape(box(left, top, 40, h), { fill: ACCENT, accent: true, role: 'barrier', markKind: 'gate' });

/** Two lanes under a gate each, a sink at the right · no other accent. */
const twoGates = (extra: InkShape[] = []) =>
  model(
    [
      shape(box(100, 200, 700, 4), { fill: null, kind: 'path', stroke: 3 }),
      shape(box(100, 320, 700, 4), { fill: null, kind: 'path', stroke: 3 }),
      { ...gate(300, 180, 60), mark: 'pare-feu' },
      { ...gate(560, 300, 60), mark: 'auth' },
      shape(box(830, 180, 140, 200), { fill: null, stroke: 2, mark: 'donnees', markKind: 'box' }),
      ...extra,
    ],
    [text(box(20, 190, 70, 28), 'Scans'), text(box(20, 310, 70, 28), 'Bots')],
  );

describe('gates in series', () => {
  it('are one thing put forward, however many stand', () => {
    expect(find(twoGates(), 'ILL_FOCAL_MANY')).toBeUndefined();
  });

  it('and a box put forward beside them are two, named', () => {
    const lit = shape(box(830, 420, 140, 100), {
      fill: ACCENT,
      accent: true,
      role: 'focal',
      mark: 'alerte',
      markKind: 'box',
    });
    const found = find(twoGates([lit]), 'ILL_FOCAL_MANY');
    expect(found).toBeDefined();
    expect(found?.fix?.marks).toEqual(expect.arrayContaining([['alerte'], ['pare-feu', 'auth']]));
  });

  it('are not weighed by area against the cards beside them', () => {
    const big = shape(box(500, 400, 300, 150), { mark: 'carte', markKind: 'box' });
    const lone = model([{ ...gate(300, 180, 160), mark: 'stop' }, big], []);
    expect(find(lone, 'ILL_FOCAL_WEAK')).toBeUndefined();
  });
});

describe('ILL_FOCAL_WEAK on a diagram', () => {
  const weak = () =>
    model(
      [
        shape(box(100, 200, 120, 80), {
          fill: ACCENT,
          accent: true,
          role: 'focal',
          mark: 'cible',
          markKind: 'box',
        }),
        shape(box(400, 100, 500, 400), { mark: 'contexte', markKind: 'box' }),
        shape(box(400, 520, 200, 40), { mark: 'pied', markKind: 'box' }),
      ],
      [],
    );

  it('names the mark put forward, its rival and how much larger it must be', () => {
    const found = find(weak(), 'ILL_FOCAL_WEAK');
    expect(found?.fix).toMatchObject({ focal: 'cible', rival: 'contexte' });
    expect(found?.fix?.need as number).toBeGreaterThan(1);
  });

  it('proposes the rival as an outline, tried: it then no longer outweighs the focal', () => {
    const tries = find(weak(), 'ILL_FOCAL_WEAK')?.fix?.try as { mark: string; set: string }[];
    expect(tries[0]).toMatchObject({ mark: 'contexte', set: 'paint="outline"' });
    expect(tries.at(-1)).toMatchObject({ mark: 'cible', set: 'size="large"', simulated: false });
  });
});

describe('ILL_OFF_CENTRE on a diagram', () => {
  /** A heavy box at the left, a note beside it on its left · it leans left. */
  const leaning = (over: Partial<InkModel> = {}) =>
    model(
      [
        shape(box(300, 200, 200, 200), { mark: 'producteur', markKind: 'box' }),
        shape(box(600, 260, 160, 80), { fill: null, stroke: 2, mark: 'aval', markKind: 'box' }),
      ],
      [
        text(box(140, 270, 140, 60), 'émet dix par seconde', {
          mark: 'emet',
          markKind: 'text',
          markFor: 'producteur',
        }),
        text(box(320, 220, 160, 50), 'Producteur', { mark: 'producteur', markKind: 'box' }),
      ],
      over,
    );

  it('names the marks that pull the weight to one side, and by what share', () => {
    const found = find(leaning(), 'ILL_OFF_CENTRE');
    expect(found?.measurement.dxPct as number).toBeLessThan(-8);
    const pulls = found?.fix?.pulls as { mark: string; sharePct: number }[];
    expect(pulls[0]?.mark).toBe('producteur');
    expect(pulls.every((p) => p.sharePct > 0)).toBe(true);
  });

  it('proposes only the changes that, tried on the ink, bring it under the limit', () => {
    const tries = find(leaning(), 'ILL_OFF_CENTRE')?.fix?.try as {
      mark: string;
      set: string;
      leanAfterPct: number;
    }[];
    expect(tries.length).toBeGreaterThan(0);
    for (const t of tries) expect(Math.abs(t.leanAfterPct)).toBeLessThanOrEqual(8);
    expect(tries.map((t) => `${t.mark} ${t.set}`)).toEqual(
      expect.arrayContaining(['aval paint="soft"', 'emet side="right"']),
    );
  });

  it('leaves the lean across alone when the structure sets its labels at the left', () => {
    expect(find(leaning({ lean: 'x' }), 'ILL_OFF_CENTRE')).toBeUndefined();
    // Its height still counts · the same drawing pushed to the top leans.
    const high = leaning({ lean: 'x', allocated: { ...FRAME, bottom: 1400 } });
    expect(find(high, 'ILL_OFF_CENTRE')?.measurement.dyPct as number).toBeLessThan(-15);
  });
});

describe('the lean in height of a flat drawing', () => {
  /** A row of boxes, a line going round them above with its word · 1700 by 180. */
  const strip = (h: number) => {
    const room = { left: 0, top: 0, right: 1700, bottom: h };
    return model(
      [
        shape(box(70, h - 100, 480, 95)),
        shape(box(610, h - 100, 480, 95), { fill: null, stroke: 2 }),
        shape(box(1150, h - 100, 480, 95), { fill: ACCENT, accent: true }),
        shape(box(310, 40, 1080, 30), { fill: null, kind: 'path', stroke: 2 }),
      ],
      [text(box(820, 10, 70, 26), 'direct')],
      { frame: room, allocated: room },
    );
  };

  it('is a share of a slide-like height, not of the strip · 36px low does not lean', () => {
    expect(find(strip(180), 'ILL_OFF_CENTRE')).toBeUndefined();
  });

  it('still leans when the drawing is as tall as its width plans', () => {
    // The same boxes at the bottom of a room 640 tall · their weight sits far below.
    expect(find(strip(640), 'ILL_OFF_CENTRE')?.measurement.dyPct as number).toBeGreaterThan(15);
  });
});

describe('ILL_NEAR_ALIGN on a diagram', () => {
  it('names the two marks and the cause, and stretching them aligns them', () => {
    const found = find(
      model(
        [
          shape(box(100, 200, 200, 120), { mark: 'a', markKind: 'box' }),
          shape(box(400, 200, 200, 124), { mark: 'b', markKind: 'box' }),
        ],
        [],
      ),
      'ILL_NEAR_ALIGN',
    );
    expect(found?.fix).toMatchObject({ marks: ['a', 'b'], cause: 'heights', edge: 'bottom' });
    expect(found?.fix?.try).toEqual([
      { set: 'align="stretch"', on: 'the group that holds them', pairsAfter: 0 },
    ]);
  });
});

describe('ILL_SPARSE on a diagram', () => {
  it('says where the room is empty and what to change on the marks', () => {
    const found = find(
      model(
        [
          shape(box(400, 250, 120, 80), { role: 'focal', mark: 'seul', markKind: 'box' }),
          shape(box(540, 250, 60, 80), { mark: 'autre', markKind: 'box' }),
        ],
        [],
      ),
      'ILL_SPARSE',
    );
    expect(found?.fix?.emptyPct).toMatchObject({ left: 40, top: 41.7 });
    expect(found?.fix?.try).toEqual(
      expect.arrayContaining([{ mark: 'seul', set: 'size="large"', simulated: false }]),
    );
  });
});

describe("a link's label", () => {
  const label = (left: number) =>
    text(box(left, 200, 120, 28), 'recalculé', { role: 'link-label', mark: 'calcul → solde' });
  const boxes = [
    shape(box(100, 150, 200, 140), { mark: 'calcul', markKind: 'box' }),
    shape(box(500, 150, 200, 140), { mark: 'solde', markKind: 'box' }),
    shape(box(40, 100, 720, 260), { role: 'frame', mark: 'groupe', markKind: 'group' }),
  ];

  it('set on a box is a defect, the box named', () => {
    const found = find(model(boxes, [label(250)]), 'ILL_TEXT_OVER_SHAPE');
    expect(found?.severity).toBe('error');
    expect(found?.measurement.on).toEqual(['calcul']);
    expect(lintIllustration(model(boxes, [label(250)])).verdict).toBe('fail');
  });

  it('between the boxes, on the surface that holds them, is fine', () => {
    expect(find(model(boxes, [label(340)]), 'ILL_TEXT_OVER_SHAPE')).toBeUndefined();
  });
});
