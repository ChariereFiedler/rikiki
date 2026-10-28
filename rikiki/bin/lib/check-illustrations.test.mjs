import { describe, expect, it } from 'vitest';
import { illustrationVerdicts, readIllustrationSignature } from './check.mjs';

const signature = {
  structure: { kind: 'deck-diagram', intent: null, layouts: ['row'], marks: { box: 2 }, links: 1,
    topology: 'chain', tokens: false, gates: false, morph: false },
  visual: { surfaces: ['outline'], tones: [], density: 2 },
  time: { clicks: 0, motifs: [] },
};

describe('a declared illustration signature', () => {
  it('keeps a complete signature, including false flags, zero counts and extra metadata', () => {
    const declared = { ...signature, futureMetadata: { label: 'kept' } };
    expect(readIllustrationSignature(JSON.stringify(declared))).toEqual(declared);
  });

  it.each([null, '', 'bad JSON', '{}', '[]', 'null', '42'])('derives ink instead of consuming %j', (source) => {
    expect(readIllustrationSignature(source)).toBeNull();
  });

  it.each([
    ['layouts', { ...signature, structure: { ...signature.structure, layouts: 'row' } }],
    ['marks', { ...signature, structure: { ...signature.structure, marks: [] } }],
    ['mark counts', { ...signature, structure: { ...signature.structure, marks: { box: '2' } } }],
    ['flags', { ...signature, structure: { ...signature.structure, tokens: 'false' } }],
    ['surfaces', { ...signature, visual: { ...signature.visual, surfaces: null } }],
    ['tones', { ...signature, visual: { ...signature.visual, tones: [1] } }],
    ['time', { ...signature, time: null }],
    ['clicks', { ...signature, time: { ...signature.time, clicks: -1 } }],
    ['motifs', { ...signature, time: { ...signature.time, motifs: {} } }],
  ])('rejects a signature with unusable %s', (_field, declared) => {
    expect(readIllustrationSignature(JSON.stringify(declared))).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// A drawing walked through several states · one verdict, judged on what the
// deck's policy kept in every state. Pure: no browser.
// ════════════════════════════════════════════════════════════════

const row = (state, issue, score) => ({
  slide: 2,
  element: 'deck-root > deck-feature#flux > deck-diagram',
  state,
  score,
  verdict: 'fail',
  facets: {},
  richness: { score: 50 },
  motif: { words: {} },
  findings: { ill: [{ code: issue, severity: 'error', facet: 'frame' }], meaning: [] },
});

/** A policy that silences one rule and keeps the others as they are. */
const silencing = (code) => (finding) => (finding.code === code ? { kept: false } : { kept: true, severity: finding.severity });

describe('the verdict of a drawing walked through several states', () => {
  it('keeps the worst state left once the policy has judged every state', () => {
    // State 0 is the worse one as measured, and the policy drops what makes it so ·
    // state 1 keeps an error, which must still fail the drawing.
    const rows = [row(0, 'ILL_ESCAPE', 40), row(1, 'ILL_SHAPE_OVERLAP', 60)];
    const [verdict] = illustrationVerdicts(rows, silencing('ILL_ESCAPE'));
    expect(verdict.verdict).toBe('fail');
    expect(verdict.state).toBe(1);
  });

  it('ships a drawing whose every error the policy dropped', () => {
    const rows = [row(0, 'ILL_ESCAPE', 40), row(1, 'ILL_ESCAPE', 60)];
    const verdicts = illustrationVerdicts(rows, silencing('ILL_ESCAPE'));
    expect(verdicts).toHaveLength(1);
    expect(verdicts[0]).toMatchObject({ verdict: 'ship', suppressed: ['ILL_ESCAPE'] });
    expect(verdicts[0]).not.toHaveProperty('motif');
    expect(verdicts[0]).not.toHaveProperty('findings');
  });
});
