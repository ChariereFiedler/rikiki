import { describe, expect, it } from 'vitest';
import { ACT_HEIGHT, ACT_STRIP, actIndex, layoutAct, readActs } from './act.js';
import { type ElementLike, parseDiagram } from './model.js';

// ════════════════════════════════════════════════════════════════
// The strip of an act · what is promised: the steps are read off one attribute
// separated by "·"; the steps behind, the one the slide stands at and the steps
// ahead are told apart; the stations are evenly apart and centred, as wide as the
// widest label needs; a label that cannot hold its slot is said; a step that is not
// one of the steps, a strip of one step or of eight, are refused by the writing.
// ════════════════════════════════════════════════════════════════

const STEPS = 'terminal · code · environnement · exploitation · client';
const measure = { regular: (t: string) => t.length * 12, bold: (t: string) => t.length * 13 };

describe('readActs and actIndex', () => {
  it('reads the steps between "·", trimmed, and finds a step whatever its case', () => {
    expect(readActs(STEPS)).toEqual([
      'terminal',
      'code',
      'environnement',
      'exploitation',
      'client',
    ]);
    expect(readActs(' a ·· b ')).toEqual(['a', 'b']);
    expect(readActs(undefined)).toEqual([]);
    expect(actIndex(readActs(STEPS), 'Code')).toBe(1);
    expect(actIndex(readActs(STEPS), 'prod')).toBe(-1);
  });
});

describe('layoutAct', () => {
  it('tells the steps behind, the current one and the steps ahead apart, the rail reached to the current', () => {
    const strip = layoutAct(readActs(STEPS), 2, 1600, measure);
    expect(strip.stations.map((s) => s.state)).toEqual(['done', 'done', 'current', 'todo', 'todo']);
    expect(strip.rail.reached).toBe(strip.stations[2]!.x);
    expect(strip.height).toBe(ACT_HEIGHT);
    expect(strip.fits).toBe(true);
  });

  it('spaces the stations evenly, centred, as wide as the widest label needs', () => {
    const { stations } = layoutAct(readActs(STEPS), 0, 1600, measure);
    const gaps = stations.slice(1).map((s, i) => s.x - stations[i]!.x);
    expect(new Set(gaps.map((g) => Math.round(g))).size).toBe(1);
    expect(gaps[0]).toBe('environnement'.length * 12 + 2 * ACT_STRIP.pad);
    expect((stations[0]!.x + stations.at(-1)!.x) / 2).toBeCloseTo(800, 5);
  });

  it('says when its labels cannot hold apart on the width given', () => {
    const long = readActs('une étape très longue · une autre bien longue · et une troisième');
    expect(layoutAct(long, 0, 600, measure).fits).toBe(false);
  });
});

function el(
  localName: string,
  attrs: Record<string, string> = {},
  children: ElementLike[] = [],
): ElementLike {
  return {
    localName,
    children,
    getAttribute: (name) => (name in attrs ? attrs[name]! : null),
    hasAttribute: (name) => name in attrs,
    getAttributeNames: () => Object.keys(attrs),
  };
}

describe('the writing of a strip', () => {
  const issues = (attrs: Record<string, string>) =>
    parseDiagram(el('deck-diagram', attrs, [el('dg-box', { name: 'a', label: 'a' })])).issues.map(
      (i) => `${i.code} ${i.items.join(',')}`,
    );

  it('takes a step of its steps, and the pair of an incident', () => {
    expect(issues({ acts: STEPS, act: 'code', pair: 'remede' })).toEqual([]);
  });

  it('refuses a step that is none of them, a step with no strip, a strip of one step or of eight', () => {
    expect(issues({ acts: STEPS, act: 'prod' })).toEqual([
      'DG_VALUE_INVALID deck-diagram · act="prod"',
    ]);
    expect(issues({ acts: STEPS })).toEqual(['DG_VALUE_INVALID deck-diagram · act=""']);
    expect(issues({ act: 'code' })).toEqual(['DG_VALUE_INVALID deck-diagram · act']);
    expect(issues({ acts: 'seule', act: 'seule' })).toEqual([
      'DG_VALUE_INVALID deck-diagram · acts="seule"',
    ]);
    expect(issues({ acts: 'a · b · c · d · e · f · g · h', act: 'a' })[0]).toMatch(
      /^DG_VALUE_INVALID/,
    );
  });
});
