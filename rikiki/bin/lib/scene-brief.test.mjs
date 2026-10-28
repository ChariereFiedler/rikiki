import { describe, expect, it } from 'vitest';
import { BRIEF_SCHEMA, validateBrief } from './scene-brief.mjs';
import { planScenes } from './scene-plan.mjs';

const base = {
  schema: BRIEF_SCHEMA,
  claim: 'A is the safer choice',
  relation: 'parallel',
  focus: 'A',
  items: [{ label: 'A' }, { label: 'B' }],
  source: { text: 'Illustration', nature: 'illustration' },
};
const converge = { ...base, relation: 'converge', focus: 'Hub', inputs: [{ label: 'A' }], hub: { label: 'Hub' }, outcomes: [{ label: 'B' }] };
const matrix = { ...base, relation: 'position-2d', columns: ['EU', 'US'], rows: [{ label: 'A', levels: ['prod', 'none'] }] };
const mechanism = { ...base, relation: 'mechanism-proof', mechanism: { inputs: [{ label: 'Input' }], hub: { label: 'Hub' }, outcomes: [{ label: 'Result' }] }, proof: { items: [{ label: 'A', value: 1 }, { label: 'B', value: 2 }], unit: '%' } };

describe('scene brief optional fields', () => {
  const malformed = [
    ['numeric item note', { ...base, items: [{ label: 'A', note: 42 }, { label: 'B' }] }, 'items[0].note'],
    ['object item tag', { ...base, items: [{ label: 'A', tag: {} }, { label: 'B' }] }, 'items[0].tag'],
    ['array item icon', { ...base, items: [{ label: 'A', icon: [] }, { label: 'B' }] }, 'items[0].icon'],
    ['numeric group', { ...base, relation: 'compare-size', items: [{ label: 'A', value: 1, group: 2 }, { label: 'B', value: 2 }] }, 'items[0].group'],
    ['array focus', { ...base, focus: [] }, 'focus'],
    ['empty focus', { ...base, focus: '' }, 'focus'],
    ['numeric eyebrow', { ...base, eyebrow: 12 }, 'eyebrow'],
    ['object speaker notes', { ...base, notes: {} }, 'notes'],
    ['null unit', { ...base, unit: null }, 'unit'],
    ['object maximum', { ...base, max: { toString: 3 } }, 'max'],
    ['numeric hub note', { ...converge, hub: { label: 'Hub', note: 42 } }, 'hub.note'],
    ['numeric before note', { ...base, relation: 'before-after', focus: 'After', before: { label: 'Before', value: 1, note: 42 }, after: { label: 'After', value: 2 } }, 'before.note'],
    ['object nested hub icon', { ...mechanism, mechanism: { ...mechanism.mechanism, hub: { label: 'Hub', icon: {} } } }, 'mechanism.hub.icon'],
    ['numeric nested proof unit', { ...mechanism, proof: { ...mechanism.proof, unit: 42 } }, 'proof.unit'],
    ['object nested proof maximum', { ...mechanism, proof: { ...mechanism.proof, max: { toString: 3 } } }, 'proof.max'],
    ['object column label', { ...matrix, columns: [{ region: 'EU' }, 'US'] }, 'columns[0]'],
    ['array statuses', { ...matrix, statuses: [] }, 'statuses'],
    ['numeric status alias', { ...matrix, statuses: { prod: 42 } }, 'statuses.prod'],
    ['unknown status name', { ...matrix, statuses: { production: 'live' } }, 'statuses.production'],
    ['numeric verdict note', { ...base, verdict: { label: 'Choose A', note: 42 } }, 'verdict.note'],
  ];

  it.each(malformed)('rejects %s before the planner can throw', (_name, brief, path) => {
    const result = validateBrief(brief);
    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.path)).toContain(path);
    expect(() => planScenes(brief)).not.toThrow();
    expect(planScenes(brief).ok).toBe(false);
  });

  it('still plans valid optional labels, aliases and empty optional notes', () => {
    expect(planScenes({ ...base, items: [{ label: 'A', note: '', tag: 'safer', icon: 'flag' }, { label: 'B' }], notes: '', eyebrow: 'Options' }).ok).toBe(true);
    expect(planScenes({ ...matrix, statuses: { prod: 'live', none: 'not yet' } }).ok).toBe(true);
    expect(planScenes(mechanism).ok).toBe(true);
  });
});
