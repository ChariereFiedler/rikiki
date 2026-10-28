import { describe, expect, it } from 'vitest';
import { choreograph, cueIds } from './choreography.js';
import { type Meter, layoutDiagram } from './layout.js';
import { type ElementLike, parseDiagram } from './model.js';
import { MORPH_CROWD, type Picture, morphIds, pictureOf, planTransition } from './morph.js';
import { MOTION_BUDGET, schedule } from './motion.js';

/** A font that is the same width for every letter · a test needs numbers, not glyphs. */
const meter: Meter = (size) => (text) => text.length * size * 0.55;

function el(
  localName: string,
  attrs: Record<string, string | true> = {},
  children: ElementLike[] = [],
): ElementLike {
  return {
    localName,
    children,
    getAttribute: (name) =>
      name in attrs ? String(attrs[name] === true ? '' : attrs[name]) : null,
    hasAttribute: (name) => name in attrs,
    getAttributeNames: () => Object.keys(attrs),
  };
}

/** The picture of each click of a diagram, as the element lays them out. */
function pictures(children: ElementLike[], attrs: Record<string, string> = {}): Picture[] {
  const parsed = parseDiagram(el('deck-diagram', attrs, children));
  return Array.from({ length: parsed.stages + 1 }, (_, stage) => {
    const drawn = layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 }, stage });
    return pictureOf(drawn, choreograph(drawn, drawn.tree).appears, stage);
  });
}

const indexOf = (picture: Picture, key: string) =>
  picture.layout.items.findIndex((item) => item.key === key);

/** A row of three that becomes a column of two, one gone and one new. */
const reorganised = () => [
  el('dg-state', {}, [
    el('dg-group', { layout: 'row' }, [
      el('dg-box', { name: 'a', label: 'Alpha' }),
      el('dg-box', { name: 'b', label: 'Beta' }),
      el('dg-box', { name: 'gone', label: 'Gone' }),
      el('dg-link', { from: 'a', to: 'b' }),
    ]),
  ]),
  el('dg-state', { step: '1' }, [
    el('dg-group', { layout: 'column' }, [
      el('dg-box', { name: 'new', label: 'New' }),
      el('dg-box', { name: 'b', label: 'Beta' }),
      el('dg-box', { name: 'a', label: 'Alpha' }),
      el('dg-link', { from: 'a', to: 'new' }),
    ]),
  ]),
];

describe('planTransition', () => {
  it('moves what both pictures name, from its old place to its new one', () => {
    const [before, after] = pictures(reorganised());
    const plan = planTransition(before!, after!);
    for (const key of ['a', 'b']) {
      const id = cueIds.item(indexOf(after!, key));
      const move = plan.moves.get(id);
      expect(move, key).toBeDefined();
      const old = before!.layout.items[move!.from]!;
      const now = after!.layout.items[indexOf(after!, key)]!;
      expect(old.key).toBe(key);
      expect(move!.dx).toBeCloseTo(old.x - now.x);
      expect(move!.dy).toBeCloseTo(old.y - now.y);
    }
  });

  it('lets go what only the first has, and brings in what only the second has', () => {
    const [before, after] = pictures(reorganised());
    const plan = planTransition(before!, after!);
    expect(plan.leaving.items.map((i) => before!.layout.items[i]!.key)).toEqual(['gone']);
    expect(plan.entering.has(cueIds.item(indexOf(after!, 'new')))).toBe(true);
    // The link a→b is not in the second picture, a→new is not in the first.
    expect(plan.leaving.links).toEqual([0]);
    expect(plan.entering.has(cueIds.link(0))).toBe(true);
  });

  it('leaves alone what does not change, and keeps a link drawn the same', () => {
    const still = [
      el('dg-box', { name: 'fixed', label: 'Fixed' }),
      el('dg-state', {}, [el('dg-box', { name: 'x', label: 'One' })]),
      el('dg-state', { step: '1' }, [el('dg-box', { name: 'x', label: 'One' })]),
    ];
    const [before, after] = pictures(still);
    const plan = planTransition(before!, after!);
    expect(plan.moves.size).toBe(0);
    expect(plan.entering.size).toBe(0);
    expect(plan.leaving).toEqual({ items: [], links: [], notes: [] });
  });

  it('says a label changed, so its new words fade in as the mark moves', () => {
    const [before, after] = pictures([
      el('dg-state', {}, [el('dg-box', { name: 'flag', label: 'MARCHE' })]),
      el('dg-state', { step: '1' }, [
        el('dg-box', { name: 'flag', label: 'STOP', tone: 'danger' }),
      ]),
    ]);
    const move = planTransition(before!, after!).moves.get(cueIds.item(0));
    expect(move?.relabel).toBe(true);
  });

  it('plays in three phases that do not overlap · leave, move, come in · inside the budget', () => {
    const [before, after] = pictures(reorganised());
    const plan = planTransition(before!, after!);
    const { timing, ends } = schedule(plan.cues);
    const span = (ids: string[]) => {
      const times = ids.map((id) => timing.get(id)!);
      return {
        start: Math.min(...times.map((t) => t.start)),
        end: Math.max(...times.map((t) => t.start + t.duration)),
      };
    };
    const leaving = span(plan.cues.filter((c) => c.role === 'exit').map((c) => c.id));
    const moving = span([...plan.moves.keys()].map(morphIds.move));
    const coming = span([...plan.entering]);
    expect(leaving.end).toBeLessThanOrEqual(moving.start);
    expect(moving.end).toBeLessThanOrEqual(coming.start);
    expect(ends.at(-1)!).toBeLessThanOrEqual(MOTION_BUDGET);
  });

  it('is deterministic · the same pictures give the same plan', () => {
    const run = () => {
      const [before, after] = pictures(reorganised());
      const plan = planTransition(before!, after!);
      return JSON.stringify({ ...plan, moves: [...plan.moves], entering: [...plan.entering] });
    };
    expect(run()).toBe(run());
  });

  it(`says when more than ${MORPH_CROWD} marks move at once`, () => {
    const names = Array.from({ length: MORPH_CROWD + 1 }, (_, i) => `m${i}`);
    const boxes = (order: string[]) => order.map((name) => el('dg-box', { name, label: name }));
    const [before, after] = pictures([
      el('dg-state', {}, [el('dg-group', { layout: 'row' }, boxes(names))]),
      el('dg-state', { step: '1' }, [
        el('dg-group', { layout: 'column' }, boxes([...names].reverse())),
      ]),
    ]);
    const codes = planTransition(before!, after!).issues.map((i) => i.code);
    expect(codes).toEqual(['DG_MORPH_CROWD']);
  });

  it('carries the fill a meter had, so it grows from there', () => {
    const [before, after] = pictures([
      el('dg-meter', { name: 'disk', label: 'Disk', value: '40 85', unit: '%' }),
    ]);
    const plan = planTransition(before!, after!);
    const move = plan.moves.get(cueIds.item(0));
    const disk = before!.layout.items[0]!;
    expect(disk.kind === 'meter' && move?.fill).toBe(disk.kind === 'meter' ? disk.fills[0] : NaN);
  });
});

describe('pictureOf', () => {
  it('holds what has appeared by its click, and nothing that comes later', () => {
    const parsed = parseDiagram(
      el('deck-diagram', {}, [
        el('dg-box', { name: 'a', label: 'A' }),
        el('dg-box', { name: 'b', label: 'B', step: '1' }),
      ]),
    );
    const drawn = layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 } });
    const { appears } = choreograph(drawn, drawn.tree);
    expect(pictureOf(drawn, appears, 0).items).toEqual([0]);
    expect(pictureOf(drawn, appears, 1).items).toEqual([0, 1]);
  });
});
