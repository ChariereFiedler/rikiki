import { describe, expect, it } from 'vitest';
import { type Motif, type MotifEntry, deckMotifIssues, progressOf } from './deck-motifs.js';

const STEPS = ['terminal', 'code', 'environnement', 'exploitation', 'client'];

const motif = (words: Record<string, string>, extra: Partial<Motif> = {}): Motif => ({
  words,
  names: Object.keys(words),
  ...extra,
});

const at = (slide: number, slideId: string, m: Motif): MotifEntry => ({ slide, slideId, motif: m });

describe('progressOf', () => {
  const base = { flag: 'DB 2 · MARCHE', reader: 'is_active()', prod: 'ACME · prod' };

  it('says a step of the act, a wider scope, other figures, another state', () => {
    const act = (n: number) => ({ act: { steps: STEPS, at: n } });
    expect(progressOf(motif(base, act(1)), motif(base, act(2)))).toEqual(['step']);
    expect(progressOf(motif(base), motif({ ...base, test: 'test du STOP' }))).toEqual(['scope']);
    expect(
      progressOf(motif({ ...base, prod: '3 devis' }), motif({ ...base, prod: '0 devis' })),
    ).toEqual(['data']);
    expect(progressOf(motif(base), motif({ ...base, flag: 'DB 2 · STOP' }))).toEqual(['state']);
  });

  it('says nothing of the same picture again, of a step back, of two drawings that share no motif', () => {
    expect(progressOf(motif(base), motif(base))).toEqual([]);
    const back = progressOf(
      motif(base, { act: { steps: STEPS, at: 3 } }),
      motif(base, { act: { steps: STEPS, at: 1 } }),
    );
    expect(back).toEqual([]);
    expect(
      progressOf(motif(base), motif({ web: 'Web', api: 'API', db: 'Postgres', q: 'queue' })),
    ).toEqual([]);
    expect(progressOf(undefined, motif(base))).toEqual([]);
    // Every word changed · another case drawn the same way, a clone, no progression.
    const clone = motif({ flag: 'DB 3 · ON', reader: 'enabled()', prod: 'Shop · prod' });
    expect(progressOf(motif(base), clone)).toEqual([]);
  });

  it('reads the marks off the words when a drawing names none', () => {
    expect(
      progressOf({ words: { a: 'étape 1', b: 'code' } }, { words: { a: 'étape 2', b: 'code' } }),
    ).toEqual(['data']);
  });
});

describe('deckMotifIssues · pair', () => {
  const incident = motif(
    { flag: 'DB 2 · MARCHE', reader: 'is_active()', prod: 'ACME · prod', job: 'relance' },
    { pair: 'remede' },
  );

  it('says nothing of a remedy after its incident that keeps its marks', () => {
    const remedy = motif({
      flag: 'DB 2 · STOP',
      reader: 'is_active()',
      prod: '0 devis',
      test: 'test',
    });
    expect(deckMotifIssues([at(1, 'incident', incident), at(2, 'remede', remedy)])).toEqual([]);
  });

  it('names an unknown remedy, with the slides that could be', () => {
    const [found] = deckMotifIssues([
      at(1, 'incident', incident),
      at(2, 'autre', motif({ x: 'x' })),
    ]);
    expect(found).toMatchObject({ code: 'ILL_PAIR_TARGET', severity: 'error', slide: 1 });
    expect(found!.fix).toMatchObject({
      action: 'set-attribute',
      attribute: 'pair',
      known: ['autre'],
    });
    // Only some slides walked · the remedy may stand on one that was not.
    expect(deckMotifIssues([at(1, 'incident', incident)], { partial: true })).toEqual([]);
  });

  it('warns of a remedy that comes first', () => {
    const remedy = motif({ flag: 'DB 2 · STOP', reader: 'is_active()', prod: '0 devis' });
    const [found] = deckMotifIssues([at(1, 'remede', remedy), at(2, 'incident', incident)]);
    expect(found).toMatchObject({ code: 'ILL_PAIR_TARGET', severity: 'warning' });
  });

  it('warns on the remedy that drops the marks of its incident, and names them', () => {
    const remedy = motif({ flag: 'DB 2 · STOP', other: 'autre chose' });
    const [found] = deckMotifIssues([at(1, 'incident', incident), at(2, 'remede', remedy)]);
    expect(found).toMatchObject({ code: 'ILL_PAIR_MARKS', severity: 'warning', slide: 2 });
    expect(found!.measurement).toMatchObject({
      kept: 1,
      marks: 4,
      missing: ['reader', 'prod', 'job'],
    });
    expect(found!.fix).toMatchObject({
      action: 'keep-the-marks',
      names: ['reader', 'prod', 'job'],
    });
  });
});

describe('deckMotifIssues · zoom-from', () => {
  const before = motif({ code: 'code', env: 'staging' });
  const opener = (slide: string, mark = 'code') =>
    motif({ code: 'code' }, { zoomFrom: { slide, mark } });

  it('says nothing of a camera that opens from the slide before, on a mark it draws', () => {
    expect(deckMotifIssues([at(1, 'avant', before), at(2, 'chapitre', opener('avant'))])).toEqual(
      [],
    );
  });

  it('says an unknown slide, a mark the slide does not draw, a slide that is not the one before', () => {
    expect(deckMotifIssues([at(2, 'chapitre', opener('nulle'))])[0]).toMatchObject({
      code: 'ILL_ZOOM_FROM_TARGET',
      severity: 'error',
    });
    expect(
      deckMotifIssues([at(1, 'avant', before), at(2, 'c', opener('avant', 'client'))])[0],
    ).toMatchObject({
      code: 'ILL_ZOOM_FROM_TARGET',
      severity: 'error',
    });
    const far = deckMotifIssues([at(1, 'avant', before), at(3, 'c', opener('avant'))]);
    expect(far).toHaveLength(1);
    expect(far[0]).toMatchObject({ code: 'ILL_ZOOM_FROM_TARGET', severity: 'warning' });
  });

  it('finds the mark in any diagram of the slide it opens from', () => {
    const first = at(1, 'avant', motif({ x: 'x' }));
    const second = at(1, 'avant', motif({ ci: 'CI' }));
    expect(deckMotifIssues([first, second, at(2, 'chapitre', opener('avant', 'ci'))])).toEqual([]);
    // Drawn by none of them · still said.
    expect(
      deckMotifIssues([first, second, at(2, 'chapitre', opener('avant', 'prod'))])[0],
    ).toMatchObject({
      code: 'ILL_ZOOM_FROM_TARGET',
      severity: 'error',
    });
  });
});

describe('deckMotifIssues · pair, a remedy slide of several diagrams', () => {
  it('reads the marks of the remedy in every diagram of its slide', () => {
    const incident = motif({ flag: 'MARCHE', reader: 'lit', prod: 'prod' }, { pair: 'remede' });
    const legend = at(2, 'remede', motif({ legend: 'légende' }));
    const mended = at(2, 'remede', motif({ flag: 'STOP', reader: 'lit', prod: '0 devis' }));
    expect(deckMotifIssues([at(1, 'incident', incident), legend, mended])).toEqual([]);
  });
});

describe('progressOf · a mark with no words', () => {
  it('does not take two absent texts for an anchor · a clone stays a clone', () => {
    const before = motif({ a: 'DB 2 · MARCHE', b: 'is_active()' }, { names: ['g', 'a', 'b'] });
    const after = motif({ a: 'DB 3 · ON', b: 'enabled()' }, { names: ['g', 'a', 'b'] });
    expect(progressOf(before, after)).toEqual([]);
    // A text both drawings write the same still anchors.
    const kept = motif({ a: 'DB 2 · STOP', b: 'is_active()' }, { names: ['g', 'a', 'b'] });
    expect(progressOf(before, kept)).toEqual(['state']);
  });
});

describe('deckMotifIssues · act', () => {
  it('says one act written two ways, and keeps two acts apart', () => {
    const act = (steps: string[], n = 0) => motif({ a: 'a' }, { act: { steps, at: n } });
    const drift = deckMotifIssues([
      at(1, 'a', act(STEPS)),
      at(2, 'b', act(['terminal', 'code', 'env', 'exploitation', 'client'], 1)),
    ]);
    expect(drift[0]).toMatchObject({ code: 'ILL_ACT_DRIFT', severity: 'warning', slide: 2 });
    expect(drift[0]!.fix).toMatchObject({ attribute: 'acts', value: STEPS.join(' · ') });
    const two = deckMotifIssues([
      at(1, 'a', act(STEPS)),
      at(2, 'b', act(['idée', 'vente', 'produit'])),
    ]);
    expect(two).toEqual([]);
  });
});
