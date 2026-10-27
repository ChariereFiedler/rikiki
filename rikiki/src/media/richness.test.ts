import { describe, expect, it } from 'vitest';
import type { DiagramSignature } from './diversity.js';
import type { InkBeat, InkModel, InkShape, InkText } from './ill-rules.js';
import {
  RICHNESS_CODES,
  type RichnessInput,
  measureRichness,
  modelOf,
  modelRepeatIssues,
  richnessIssues,
  wordsByMark,
} from './richness.js';

// ════════════════════════════════════════════════════════════════
// The richness of a drawing · written by hand as the check would read it: its ink
// (texts, shapes, a story) and what the diagram says it is made of.
// ════════════════════════════════════════════════════════════════

const FRAME = { left: 0, top: 0, right: 1600, bottom: 600 };

const text = (words: string, mark?: string, at = 0): InkText => ({
  text: words,
  box: { left: at, top: 100, right: at + 120, bottom: 130 },
  size: 24,
  weight: 400,
  ...(mark ? { mark } : {}),
});

/** A card of 300 by 120 at `x` · a fill, an accent, or an outline. */
const card = (x: number, look: Partial<InkShape> = {}): InkShape => ({
  kind: 'rect',
  box: { left: x, top: 80, right: x + 300, bottom: 200 },
  fill: null,
  accent: false,
  stroke: 2,
  ...look,
});

const PALE = [240, 237, 232] as const;
const INK = [6, 8, 15] as const;
const ACCENT = [240, 112, 32] as const;

const model = (texts: InkText[], shapes: InkShape[], extra: Partial<InkModel> = {}): InkModel => ({
  frame: FRAME,
  allocated: FRAME,
  texts,
  shapes,
  motion: { endMs: 0, endless: false },
  ...extra,
});

/** What a diagram says of itself · a chain of boxes unless told otherwise. */
const signature = (
  structure: Partial<DiagramSignature['structure']> = {},
  time: Partial<DiagramSignature['time']> = {},
  tones: string[] = [],
): DiagramSignature => ({
  structure: {
    kind: 'deck-diagram',
    intent: null,
    layouts: ['row'],
    marks: { box: 3 },
    links: 2,
    topology: 'chain',
    tokens: false,
    gates: false,
    morph: false,
    ...structure,
  },
  visual: { surfaces: [], tones, density: 3 },
  time: { clicks: 0, motifs: [], ...time },
});

const beat = (
  phase: string,
  mark: string,
  atMs: number,
  extra: Partial<InkBeat> = {},
): InkBeat => ({
  phase,
  mark,
  kind: 'enter',
  atMs,
  lasting: true,
  declared: true,
  ...extra,
});

/** Three generic boxes in a chain, outlined alike · the poorest picture. */
const generic: RichnessInput = {
  model: model(
    [text('Service A', 'a'), text('Service B', 'b', 400), text('Service C', 'c', 800)],
    [card(0, { mark: 'a' }), card(400, { mark: 'b' }), card(800, { mark: 'c' })],
  ),
  signature: signature(),
  sourced: false,
};

/** A kill switch told as a story · the facts of a case, painted by role, proven. */
const story: RichnessInput = {
  model: model(
    [
      text('mardi 14:02', 'essai'),
      text('DB 2 · STOP', 'drapeau', 400),
      text('is_active()', 'lit', 800),
      text('0 devis créé', 'acme', 1200),
    ],
    [
      card(0, { fill: PALE, mark: 'essai' }),
      card(400, { fill: ACCENT, accent: true, mark: 'drapeau' }),
      card(800, { fill: INK, mark: 'lit' }),
      card(1200, { fill: null, paint: [0, 200, 160, 0.18], stroke: 0, mark: 'acme' }),
    ],
    {
      story: {
        playedMs: 7000,
        budgetMs: 10000,
        steadyMs: 3000,
        beats: [
          beat('steady', 'api', 0, { kind: 'flow' }),
          beat('event', 'drapeau', 3000, { kind: 'swap' }),
          beat('effect', 'stop', 4500),
          beat('proof', 'acme', 6000, { kind: 'proof' }),
        ],
      },
    },
  ),
  signature: signature(
    { marks: { box: 4, lane: 2, gate: 1 }, layouts: ['lanes'], tokens: true, gates: true },
    { motifs: ['gate', 'tokens'] },
    ['accent', 'warn'],
  ),
  sourced: true,
};

describe('the richness of a drawing', () => {
  it('gives three generic boxes painted alike almost nothing, and says why', () => {
    const r = measureRichness(generic);
    expect(r.criteria.content).toMatchObject({ points: 0, measurement: { facts: 0, generic: 3 } });
    expect(r.criteria.content.fix?.action).toBe('add-precise-facts');
    expect(r.criteria.paint).toMatchObject({ points: 0, measurement: { aplats: 0 } });
    expect(
      r.criteria.story.points,
      'a still that tells no event is not judged as a story',
    ).toBeNull();
    expect(r.score).toBeLessThanOrEqual(25);
    expect(richnessIssues(r).map((i) => i.code)).toEqual(['ILL_GENERIC', 'ILL_FLAT_PAINT']);
  });

  it('gives a story with the facts of its case, painted by role and proven, every point', () => {
    const r = measureRichness(story);
    for (const name of ['content', 'demonstration', 'story', 'paint', 'result'] as const)
      expect(r.criteria[name].points, name).toBe(20);
    expect(r.score).toBe(100);
    expect(r.criteria.content.measurement.kinds).toEqual(['how-much', 'when', 'which']);
    expect(r.criteria.paint.measurement.aplats, 'a tint is a paint').toBe(4);
    expect(richnessIssues(r)).toEqual([]);
  });

  it('reads the kind of a fact, and an enumeration or a generic word as none', () => {
    const facts = (words: string[]) =>
      measureRichness({
        ...generic,
        model: model(
          words.map((w) => text(w)),
          [],
        ),
      }).criteria.content.measurement;
    expect(facts(['appli 1', 'T4', 'semaine 3', 'Service A', 'Étape 2'])).toMatchObject({
      facts: 0,
      generic: 5,
    });
    expect(facts(['19 h sans lead'])).toMatchObject({ kinds: ['when'] });
    expect(facts(['is_active()', 'v1.8.2'])).toMatchObject({ kinds: ['which'] });
    expect(facts(['312 tests', '12 / j'])).toMatchObject({ kinds: ['how-much'] });
  });

  it('half marks two rates of one kind · a picture of rates fits any case', () => {
    const rates = { ...generic, sourced: true, model: model([text('12 / j'), text('3 / j')], []) };
    expect(measureRichness(rates).criteria.content.points).toBe(10);
    const pinned = { ...rates, model: model([text('12 / j'), text('depuis le 3 mars')], []) };
    expect(measureRichness(pinned).criteria.content.points).toBe(20);
    expect(measureRichness({ ...pinned, sourced: false }).criteria.content).toMatchObject({
      points: 10,
      fix: { action: 'name-the-source' },
    });
  });

  it('leaves out what does not apply and renormalises · a still of a share is not marked down for not moving', () => {
    const share = {
      model: model(
        [text('62 % salaires', 's'), text('budget 2026', 'b', 400)],
        [card(0, { fill: ACCENT, accent: true, mark: 's' }), card(400, { fill: PALE, mark: 'b' })],
      ),
      signature: signature({ marks: { bar: 4 }, links: 0, topology: 'none', layouts: ['axis'] }),
      sourced: true,
    };
    const r = measureRichness(share);
    expect(r.criteria.story.points).toBeNull();
    expect(r.criteria.content.points).toBe(20);
    expect(r.score).toBe(
      Math.round(
        ((20 +
          (r.criteria.demonstration.points ?? 0) +
          (r.criteria.paint.points ?? 0) +
          (r.criteria.result.points ?? 0)) /
          ((r.criteria.paint.points === null ? 3 : 4) * 20)) *
          100,
      ),
    );
  });

  it('judges an event told as a still · half for clicks, nothing for one image', () => {
    const cause = { ...generic, signature: signature({ intent: 'cause' }) };
    expect(measureRichness(cause).criteria.story).toMatchObject({
      points: 0,
      fix: { action: 'tell-it-as-a-story' },
    });
    const clicked = { ...generic, signature: signature({ intent: 'cause' }, { clicks: 2 }) };
    expect(measureRichness(clicked).criteria.story.points).toBe(10);
  });

  it('takes a story with no break as whole when it ends on something that lasts', () => {
    const rings = {
      ...story,
      model: {
        ...story.model,
        story: {
          playedMs: 5000,
          budgetMs: 10000,
          steadyMs: 0,
          beats: [beat('steady', 'code', 0), beat('spread', 'recul', 1500, { kind: 'camera' })],
        },
      },
    };
    expect(measureRichness(rings).criteria.story).toMatchObject({
      points: 20,
      measurement: { reveal: true },
    });
    const broken = {
      ...rings,
      model: { ...rings.model, story: { ...rings.model.story, beats: [beat('event', 'x', 0)] } },
    };
    expect(measureRichness(broken).criteria.story.points).toBe(0);
  });

  it('gives no point for more of the same · ten colours earn what three did', () => {
    const colours = (n: number) =>
      Array.from({ length: n }, (_, i) => card(i * 150, { fill: [20 * i, 100, 100] }));
    const many = { ...story, model: { ...story.model, shapes: colours(10) } };
    const three = { ...story, model: { ...story.model, shapes: colours(3) } };
    expect(measureRichness(many).criteria.paint.points).toBe(20);
    expect(measureRichness(three).criteria.paint.points).toBe(20);
    expect(measureRichness(many).score).toBe(measureRichness(three).score);
  });

  it('wants the value of the thing put forward in a still', () => {
    const focal = (words: string) => ({
      ...generic,
      model: model(
        [text(words, 'neck')],
        [card(0, { fill: ACCENT, accent: true, mark: 'neck' }), card(400, { fill: PALE })],
      ),
    });
    expect(measureRichness(focal('Revue · 3 / j')).criteria.result.points).toBe(20);
    expect(measureRichness(focal('Revue')).criteria.result).toMatchObject({
      points: 10,
      fix: { action: 'value-the-focal' },
    });
  });

  it('lists the codes the check registers', () => {
    expect(RICHNESS_CODES).toEqual(['ILL_GENERIC', 'ILL_FLAT_PAINT', 'ILL_MODEL_REPEAT']);
  });
});

describe('the graphic model of a drawing', () => {
  it('is one model for every picture of boxes and arrows, whatever its intent', () => {
    expect(modelOf(signature())).toBe('deck-diagram:boxes');
    expect(modelOf(signature({ intent: 'cause', layouts: ['layers'], topology: 'fan-out' }))).toBe(
      'deck-diagram:boxes',
    );
    expect(modelOf(signature({ layouts: ['lanes'], marks: { lane: 2, gate: 1, box: 1 } }))).toBe(
      'deck-diagram:gate+lane+lanes',
    );
    expect(modelOf(null, 'deck-scene-flow')).toBe('deck-scene-flow');
  });

  const use = (
    slide: number,
    words: Record<string, string> = {},
    model = 'deck-diagram:boxes',
  ) => ({
    slide,
    model,
    words,
  });

  it('warns on the third use of one model in five illustrated slides, on that slide', () => {
    const issues = modelRepeatIssues([use(2), use(3), use(5)]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'ILL_MODEL_REPEAT', severity: 'warning' });
    expect(issues[0]!.measurement).toMatchObject({ slide: 5, uses: 3, slides: [2, 3, 5] });
    expect(issues[0]!.fix.action).toBe('vary-the-model');
  });

  it('leaves a model alone twice, or three times far apart', () => {
    expect(modelRepeatIssues([use(1), use(2)])).toEqual([]);
    const far = [
      use(1),
      use(2, {}, 'a'),
      use(3, {}, 'b'),
      use(4, {}, 'c'),
      use(5, {}, 'd'),
      use(6),
      use(7, {}, 'e'),
      use(8, {}, 'f'),
      use(9, {}, 'g'),
      use(10, {}, 'h'),
      use(11),
    ];
    expect(modelRepeatIssues(far)).toEqual([]);
  });

  it('exempts a motif that progresses · the same marks, their words moving on', () => {
    const step = (n: number, slide: number) =>
      use(slide, { frise: `étape ${n} sur 4`, code: 'code' });
    expect(modelRepeatIssues([step(1, 1), step(2, 2), step(3, 3)])).toEqual([]);
    const still = (slide: number) => use(slide, { frise: 'étape 1 sur 4', code: 'code' });
    expect(
      modelRepeatIssues([still(1), still(2), still(3)]),
      'the same words do not progress',
    ).toHaveLength(1);
  });

  it('exempts a motif at the next step of its act, even in other words, and not a clone', () => {
    const steps = ['code', 'environnement', 'exploitation'];
    const chapter = (n: number) => ({
      ...use(n + 1, { scope: steps[n]!, ring: `${n + 1} anneaux` }),
      act: { steps, at: n },
    });
    expect(modelRepeatIssues([chapter(0), chapter(1), chapter(2)])).toEqual([]);
    const clone = (slide: number, words: string) => use(slide, { a: words, b: `${words} bis` });
    expect(
      modelRepeatIssues([clone(1, 'Web'), clone(2, 'Shop'), clone(3, 'Mail')]),
      'every word changed on the same marks is another case drawn the same way',
    ).toHaveLength(1);
  });

  it('reads the words of a drawing by the mark that wrote them', () => {
    const words = wordsByMark(
      model([text('DB 2', 'flag'), text('STOP', 'flag'), text('free')], []),
    );
    expect(words).toEqual({ flag: 'DB 2 STOP' });
  });
});
