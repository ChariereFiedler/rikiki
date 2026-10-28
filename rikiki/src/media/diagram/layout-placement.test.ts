import { describe, expect, it } from 'vitest';
import {
  type LCurve,
  type LCursor,
  type LGate,
  type LLane,
  type Meter,
  layoutDiagram,
} from './layout.js';
import { labelSide } from './lanes.js';
import { type ElementLike, parseDiagram } from './model.js';

// A gate's word clear of the lanes above it, a cursor's word clear of a label beside
// it, a link between two parts laid out on their own, a ring that keeps its middle
// for what the loop fills, and the curve as a mark of the grammar.

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

const parse = (children: ElementLike[], attrs: Record<string, string | true> = {}) =>
  parseDiagram(el('deck-diagram', attrs, children));
const lay = (children: ElementLike[], attrs: Record<string, string | true> = {}) =>
  layoutDiagram(parse(children, attrs), { meter, bounds: { w: 1600, h: 600 } });

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

describe("a gate's word", () => {
  it('goes under a gate that stands on the last lanes only, above it otherwise', () => {
    expect(labelSide([1], 2)).toBe('below');
    expect(labelSide([1, 2], 3)).toBe('below');
    expect(labelSide([0], 2)).toBe('above');
    expect(labelSide([0, 1], 2)).toBe('above');
    // A gate in the middle has lanes on both sides · above, as before.
    expect(labelSide([1], 3)).toBe('above');
  });

  it('never sits on the track of the lane above the gate', () => {
    const layout = lay(
      [
        el('dg-lane', { name: 'clients', label: 'Clients' }),
        el('dg-lane', { name: 'batch', label: 'Batch' }),
        el('dg-gate', { name: 'limit', over: 'batch', label: 'shedding', state: 'open shed' }),
        el('dg-box', { name: 'api', label: 'API' }),
      ],
      { layout: 'lanes' },
    );
    const gate = layout.items.find((i): i is LGate => i.kind === 'gate')!;
    const clients = layout.items.find((i): i is LLane => i.kind === 'lane' && i.key === 'clients')!;
    const [word] = gate.texts;
    expect(word!.y).toBeGreaterThan(gate.y + gate.h);
    expect(word!.y).toBeGreaterThan(clients.y + clients.h);
    expect(layout.size.h).toBeGreaterThanOrEqual(word!.y + word!.line);
  });
});

describe("a cursor's word", () => {
  it('goes under every label when it would stand close beside one, not touching it', () => {
    const layout = lay(
      [
        el('dg-bar', { label: 'Reads', tag: 'feb · mar', from: '2', to: '4' }),
        el('dg-bar', { label: 'Writes', tag: 'april', from: '4', to: '5' }),
        el('dg-bar', { label: 'Off', tag: 'may', from: '5', to: '7' }),
        el('dg-bar', { label: 'Count', tag: 'jan', from: '1', to: '2' }),
        el('dg-cursor', { label: 'today', value: '3.7' }),
      ],
      { layout: 'axis' },
    );
    const cursor = layout.items.find((i): i is LCursor => i.kind === 'cursor')!;
    const [word] = cursor.texts;
    const labels = layout.items.filter((i) => i.kind === 'span').flatMap((s) => s.texts);
    const box = { x: word!.x, y: word!.y, w: 'today'.length * 23 * 0.55, h: word!.line };
    for (const label of labels) {
      const w = Math.max(...label.lines.map((l) => meter(label.size, label.weight)(l)));
      expect(overlaps(box, { x: label.x - 16, y: label.y, w: w + 32, h: label.line })).toBe(false);
    }
  });

  /** The parts of a budget, the cursor in a small one near the end · its line went
   *  down through the label of the part beside it to reach its word under them all. */
  const budget = (value: string) =>
    lay(
      [
        el('dg-bar', { label: 'salaires', tag: '70 %', from: '0', to: '70' }),
        el('dg-bar', { label: 'cloud', tag: '22 %', from: '70', to: '92' }),
        el('dg-bar', { label: 'outils', tag: '4 %', from: '92', to: '96' }),
        el('dg-bar', { label: 'divers', tag: '4 %', from: '96', to: '100' }),
        el('dg-cursor', { label: 'plafond · 94 %', value }),
      ],
      { layout: 'axis' },
    );
  const textBox = (t: {
    x: number;
    y: number;
    size: number;
    weight: number;
    line: number;
    lines: string[];
  }) => ({
    x: t.x,
    y: t.y,
    w: Math.max(...t.lines.map((l) => meter(t.size, t.weight)(l))),
    h: t.line * t.lines.length,
  });

  it('crosses no label with its line, in a small part beside others', () => {
    for (const value of ['94', '98', '93', '50', '2']) {
      const layout = budget(value);
      const cursor = layout.items.find((i): i is LCursor => i.kind === 'cursor')!;
      const labels = layout.items.filter((i) => i.kind === 'span').flatMap((s) => s.texts);
      for (const label of labels)
        expect(overlaps(cursor, textBox(label)), `${value} · ${label.lines.join(' ')}`).toBe(false);
      for (const label of labels)
        expect(
          overlaps(textBox(cursor.texts[0]!), textBox(label)),
          `${value} · word on ${label.lines.join(' ')}`,
        ).toBe(false);
      expect(layout.size.h).toBeGreaterThanOrEqual(cursor.texts[0]!.y + cursor.texts[0]!.line);
    }
  });

  it('sets its word just above the tracks when the label of its part is under them', () => {
    const layout = lay(
      [
        el('dg-bar', { label: 'a', tag: '40 %', from: '0', to: '40' }),
        el('dg-bar', { label: 'b', tag: '10 %', from: '40', to: '50' }),
        el('dg-bar', { label: 'c', tag: '50 %', from: '50', to: '100' }),
        el('dg-cursor', { label: 'cap', value: '45' }),
      ],
      { layout: 'axis' },
    );
    const cursor = layout.items.find((i): i is LCursor => i.kind === 'cursor')!;
    const tracks = layout.items.filter((i) => i.kind === 'span');
    const under = Math.max(...tracks.map((s) => s.y + s.h));
    const word = cursor.texts[0]!;
    expect(word.y, 'not dropped under every label').toBeLessThan(under);
    expect(word.y + word.line, 'above the tracks, where no label is').toBeLessThanOrEqual(cursor.y);
  });
});

describe('a link between two parts of a picture', () => {
  it('is drawn between marks laid out in two groups, from the root', () => {
    const layout = lay(
      [
        el('dg-group', { layout: 'row' }, [
          el('dg-box', { name: 'a', label: 'A' }),
          el('dg-box', { name: 'b', label: 'B' }),
        ]),
        el('dg-group', { layout: 'row' }, [el('dg-box', { name: 'c', label: 'C' })]),
        el('dg-link', { from: 'b', to: 'c' }),
      ],
      { layout: 'column' },
    );
    const link = layout.links.find((l) => l.from === 'b' && l.to === 'c');
    expect(link).toBeDefined();
    expect(link!.points.length).toBeGreaterThanOrEqual(2);
  });
});

describe('a ring with a gauge or a queue in it', () => {
  it('keeps its middle for it, clear of every stage, and does not chain it', () => {
    const layout = lay(
      [
        el('dg-box', { name: 'a', label: 'Tired' }),
        el('dg-box', { name: 'b', label: 'Rushed fixes' }),
        el('dg-box', { name: 'c', label: 'New incidents' }),
        el('dg-queue', { name: 'open', label: 'open', count: '6', fill: '2' }),
      ],
      { layout: 'ring', link: 'arrow' },
    );
    expect(layout.status).toBe('fit');
    const queue = layout.items.find((i) => i.kind === 'queue')!;
    const stages = layout.items.filter((i) => i.kind === 'box');
    for (const stage of stages) expect(overlaps(queue, stage)).toBe(false);
    const left = Math.min(...stages.map((s) => s.x));
    const right = Math.max(...stages.map((s) => s.x + s.w));
    expect(queue.x).toBeGreaterThan(left);
    expect(queue.x + queue.w).toBeLessThan(right);
    expect(layout.links.every((l) => l.from !== 'open' && l.to !== 'open')).toBe(true);
    expect(layout.links).toHaveLength(3);
  });

  it('puts it under the ring when the middle would make the ring taller than a slide', () => {
    const layout = lay(
      [
        el('dg-box', { name: 'a', label: 'More users' }),
        el('dg-box', { name: 'b', label: 'More content' }),
        el('dg-box', { name: 'c', label: 'Better search' }),
        el('dg-box', { name: 'd', label: 'More reach' }),
        el('dg-queue', { name: 'base', label: 'readers', count: '10', fill: '4' }),
      ],
      { layout: 'ring' },
    );
    expect(layout.status).toBe('fit');
    const queue = layout.items.find((i) => i.kind === 'queue')!;
    const lowest = Math.max(...layout.items.filter((i) => i.kind === 'box').map((b) => b.y + b.h));
    expect(queue.y).toBeGreaterThan(lowest);
  });
});

describe('dg-curve', () => {
  const curve = (attrs: Record<string, string | true>) =>
    el('dg-curve', { name: 'c', label: 'Latency', ...attrs });

  it('is laid out as a mark · its points on its scale, its words, its threshold', () => {
    const layout = lay([
      curve({ values: '100 200 600', max: '800', unit: 'ms', threshold: '400', ticks: 'a b c' }),
    ]);
    expect(layout.status).toBe('fit');
    const item = layout.items.find((i): i is LCurve => i.kind === 'curve')!;
    const base = item.plot.y + item.plot.h;
    expect(item.points.map((p) => Math.round(base - p.y))).toEqual(
      [100, 200, 600].map((v) => Math.round((v / 800) * item.plot.h)),
    );
    expect(item.threshold).toBeCloseTo(base - item.plot.h / 2);
    expect(item.crossing!.at.y).toBeCloseTo(item.threshold!);
    expect(item.crossing!.share).toBeGreaterThan(0);
    expect(item.crossing!.share).toBeLessThan(1);
    const words = item.texts.map((t) => t.lines.join(' '));
    expect(words).toEqual(['Latency', '600 ms', 'a', 'b', 'c', '400 ms']);
  });

  it('takes a round scale over its values when it does not say one', () => {
    const item = lay([curve({ values: '3 9 17' })]).items.find(
      (i): i is LCurve => i.kind === 'curve',
    )!;
    // 20 is the scale · 17 stands at 85 % of the plot.
    const base = item.plot.y + item.plot.h;
    expect((base - item.points[2]!.y) / item.plot.h).toBeCloseTo(0.85);
  });

  it('says a series too short or too long, and words that match neither the values nor the ends', () => {
    const codes = (attrs: Record<string, string>) =>
      parse([curve(attrs)]).issues.map((i) => i.code);
    expect(codes({ values: '4' })).toContain('DG_CURVE_POINTS');
    expect(codes({ values: Array.from({ length: 13 }, (_, k) => k).join(' ') })).toContain(
      'DG_CURVE_POINTS',
    );
    expect(codes({ values: '1 2 3', ticks: 'a b c d' })).toContain('DG_CURVE_POINTS');
    expect(codes({ values: '1 2 3', ticks: 'a c' })).not.toContain('DG_CURVE_POINTS');
    expect(codes({ values: '1 2 3', ticks: 'a b c' })).not.toContain('DG_CURVE_POINTS');
  });

  it('says a value or a threshold past its scale, and a value that is not a number', () => {
    const codes = (attrs: Record<string, string>) =>
      parse([curve(attrs)]).issues.map((i) => i.code);
    expect(codes({ values: '10 120', max: '100' })).toContain('DG_VALUE_RANGE');
    expect(codes({ values: '10 20', max: '100', threshold: '150' })).toContain('DG_VALUE_RANGE');
    expect(codes({ values: '10 twenty' })).toContain('DG_VALUE_INVALID');
    expect(codes({ values: '10 20', max: '100' })).toEqual([]);
  });
});
