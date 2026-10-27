import { describe, expect, it } from 'vitest';
import { illustrationVerdicts } from './check.mjs';

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
