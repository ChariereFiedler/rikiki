import { describe, expect, it } from 'vitest';
import { type LBox, type LItem, type Meter, layoutDiagram } from './layout.js';
import { type ElementLike, parseDiagram } from './model.js';

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

const lay = (
  children: ElementLike[],
  attrs: Record<string, string | true> = {},
  bounds = { w: 1600, h: 600 },
) => layoutDiagram(parseDiagram(el('deck-diagram', attrs, children)), { meter, bounds });

const boxes = (layout: ReturnType<typeof lay>): LBox[] =>
  layout.items.filter((i): i is LBox => i.kind === 'box');

const overlap = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) =>
  a.x < b.x + b.w - 0.5 && a.x + a.w > b.x + 0.5 && a.y < b.y + b.h - 0.5 && a.y + a.h > b.y + 0.5;

const finite = (layout: ReturnType<typeof lay>) =>
  JSON.stringify(layout).search(/null|NaN|Infinity/) === -1;

describe('a row of boxes', () => {
  const three = () => [
    el('dg-box', { label: 'One' }),
    el('dg-box', { label: 'Two' }),
    el('dg-box', { label: 'Three', emphasis: true }),
  ];

  it('places every box, inside the room, without overlap', () => {
    const layout = lay(three());
    expect(layout.status).toBe('fit');
    const placed = boxes(layout);
    expect(placed).toHaveLength(3);
    for (const box of placed) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(1600);
    }
    for (let i = 0; i < placed.length; i += 1)
      for (let j = i + 1; j < placed.length; j += 1)
        expect(overlap(placed[i]!, placed[j]!)).toBe(false);
  });

  it('keeps the written order from left to right', () => {
    const layout = lay(three());
    const xs = boxes(layout).map((b) => b.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  });

  it('centres the content in the room it was given', () => {
    const placed = boxes(lay(three()));
    const left = Math.min(...placed.map((b) => b.x));
    const right = 1600 - Math.max(...placed.map((b) => b.x + b.w));
    expect(Math.abs(left - right)).toBeLessThan(1);
  });

  it('is the same on every run', () => {
    expect(JSON.stringify(lay(three()))).toBe(JSON.stringify(lay(three())));
  });

  it('paints the emphasised box solid and the others soft, by default', () => {
    const placed = boxes(lay(three()));
    expect(placed.map((b) => b.paint)).toEqual(['soft', 'soft', 'solid']);
  });

  it('gives a box the lines of its text, wrapped into its width', () => {
    const layout = lay(
      [
        el('dg-box', {
          label: 'A label',
          note: 'a note long enough to need more than one line in a narrow box',
          tag: 'tag',
        }),
      ],
      {},
      { w: 420, h: 600 },
    );
    const [box] = boxes(layout);
    const roles = box!.texts.map((t) => t.role);
    expect(roles).toEqual(['label', 'note', 'tag']);
    expect(box!.texts.find((t) => t.role === 'note')!.lines.length).toBeGreaterThan(1);
    for (const t of box!.texts) {
      expect(t.y).toBeGreaterThanOrEqual(box!.y);
      expect(t.y + t.lines.length * t.line).toBeLessThanOrEqual(box!.y + box!.h + 0.5);
    }
  });
});

describe('a column', () => {
  it('stacks top to bottom with the gap between', () => {
    const layout = lay(
      [el('dg-box', { label: 'A' }), el('dg-box', { label: 'B' }), el('dg-box', { label: 'C' })],
      { layout: 'column' },
    );
    const placed = boxes(layout);
    expect(placed[1]!.y).toBeGreaterThan(placed[0]!.y + placed[0]!.h - 0.5);
    expect(placed[2]!.y).toBeGreaterThan(placed[1]!.y + placed[1]!.h - 0.5);
    expect(layout.size.h).toBeGreaterThan(0);
  });

  it('draws a funnel when the marks are bars · widths follow the values', () => {
    const layout = lay(
      [
        el('dg-bar', { label: 'Visits', value: '1000' }),
        el('dg-bar', { label: 'Sign-ups', value: '250' }),
        el('dg-bar', { label: 'Paying', value: '50' }),
      ],
      { layout: 'column', align: 'start' },
    );
    const bars = layout.items.filter((i) => i.kind === 'bar');
    const widths = bars.map((b) => (b as { w: number }).w);
    expect(widths[0]!).toBeGreaterThan(widths[1]!);
    expect(widths[1]!).toBeGreaterThan(widths[2]!);
    expect(widths[1]! / widths[0]!).toBeCloseTo(0.25, 1);
  });
});

describe('a grid of dots', () => {
  it('places exactly the count, with a cell between the limits', () => {
    const layout = lay(
      [el('dg-dot', { count: '362' }), el('dg-dot', { count: '38', emphasis: true })],
      { layout: 'grid' },
    );
    const dots = layout.items.filter((i) => i.kind === 'dot');
    expect(dots).toHaveLength(400);
    const size = (dots[0] as { size: number }).size;
    expect(size).toBeGreaterThanOrEqual(12);
    expect(size).toBeLessThanOrEqual(44);
    expect(layout.size.h).toBeLessThanOrEqual(600);
  });

  it('honours an exact number of columns, and lights the first marks first', () => {
    const layout = lay(
      [el('dg-dot', { count: '36', emphasis: true }), el('dg-dot', { count: '364' })],
      { layout: 'grid', columns: '20' },
    );
    const dots = layout.items.filter((i) => i.kind === 'dot') as {
      x: number;
      emphasis: boolean;
      index: number;
    }[];
    expect(new Set(dots.map((d) => Math.round(d.x))).size).toBe(20);
    expect(dots.filter((d) => d.emphasis)).toHaveLength(36);
  });

  it('does not overlap any two cells', () => {
    const dots = lay([el('dg-dot', { count: '120' })], { layout: 'grid' }).items.filter(
      (i) => i.kind === 'dot',
    ) as { x: number; y: number; size: number }[];
    for (let i = 0; i < dots.length; i += 1) {
      for (let j = i + 1; j < dots.length; j += 1) {
        expect(
          overlap(
            { x: dots[i]!.x, y: dots[i]!.y, w: dots[i]!.size, h: dots[i]!.size },
            { x: dots[j]!.x, y: dots[j]!.y, w: dots[j]!.size, h: dots[j]!.size },
          ),
        ).toBe(false);
      }
    }
  });
});

describe('a graph', () => {
  const services = () => [
    el('dg-box', { name: 'web', label: 'Web' }),
    el('dg-box', { name: 'gw', label: 'Gateway', emphasis: true }),
    el('dg-box', { name: 'auth', label: 'Auth' }),
    el('dg-box', { name: 'db', label: 'Postgres' }),
    el('dg-link', { from: 'web', to: 'gw' }),
    el('dg-link', { from: 'gw', to: 'auth db' }),
  ];

  it('places it by layers without a coordinate, and routes every link', () => {
    const layout = lay(services(), { layout: 'layers', direction: 'right' });
    expect(layout.status).toBe('fit');
    expect(layout.links).toHaveLength(3);
    const placed = Object.fromEntries(boxes(layout).map((b) => [b.key, b]));
    expect(placed.web!.x).toBeLessThan(placed.gw!.x);
    expect(placed.gw!.x).toBeLessThan(placed.auth!.x);
    for (const link of layout.links) expect(link.points.length).toBeGreaterThanOrEqual(2);
  });

  it('never routes a link through a box that is not at its ends', () => {
    const layout = lay(services(), { layout: 'layers' });
    const placed = boxes(layout);
    for (const link of layout.links) {
      for (const box of placed.filter((b) => b.key !== link.from && b.key !== link.to)) {
        for (let i = 1; i < link.points.length; i += 1) {
          const a = link.points[i - 1]!;
          const b = link.points[i]!;
          const inside =
            Math.min(a.x, b.x) < box.x + box.w - 1 &&
            Math.max(a.x, b.x) > box.x + 1 &&
            Math.min(a.y, b.y) < box.y + box.h - 1 &&
            Math.max(a.y, b.y) > box.y + 1;
          expect(inside, `${link.from}->${link.to} through ${box.key}`).toBe(false);
        }
      }
    }
  });

  it('draws a link label on the link', () => {
    const layout = lay(
      [
        el('dg-box', { name: 'a', label: 'A' }),
        el('dg-box', { name: 'b', label: 'B' }),
        el('dg-link', { from: 'a', to: 'b', label: 'reads' }),
      ],
      { layout: 'layers' },
    );
    expect(layout.links[0]!.label?.lines).toEqual(['reads']);
  });
});

describe('links outside a graph', () => {
  it('chains a row with arrows when the group asks for it', () => {
    const layout = lay(
      [el('dg-box', { label: 'A' }), el('dg-box', { label: 'B' }), el('dg-box', { label: 'C' })],
      { link: 'arrow' },
    );
    expect(layout.links).toHaveLength(2);
    expect(layout.links.every((l) => l.head)).toBe(true);
  });

  it('closes a ring', () => {
    const layout = lay(
      [
        el('dg-box', { label: 'A' }),
        el('dg-box', { label: 'B' }),
        el('dg-box', { label: 'C' }),
        el('dg-box', { label: 'D' }),
      ],
      { layout: 'ring', link: 'arrow' },
    );
    expect(boxes(layout)).toHaveLength(4);
    expect(layout.links).toHaveLength(4);
  });

  it('ends a link on the edge of the boxes it joins, not in their middle', () => {
    const layout = lay([
      el('dg-box', { name: 'a', label: 'A' }),
      el('dg-box', { name: 'b', label: 'B' }),
      el('dg-link', { from: 'a', to: 'b', route: 'straight' }),
    ]);
    const [link] = layout.links;
    const a = boxes(layout).find((b) => b.key === 'a')!;
    const start = link!.points[0]!;
    expect(start.x).toBeGreaterThanOrEqual(a.x - 0.5);
    expect(start.x).toBeLessThanOrEqual(a.x + a.w + 0.5);
    expect(Math.abs(start.x - (a.x + a.w))).toBeLessThan(1);
  });

  it('draws a link asked straight as one straight line, even in a graph the engine routes', () => {
    const graph = (route?: string) =>
      lay(
        [
          el('dg-box', { name: 'a', label: 'A' }),
          el('dg-box', { name: 'b', label: 'B' }),
          el('dg-box', { name: 'c', label: 'C' }),
          el('dg-link', { from: 'a b', to: 'c', ...(route ? { route } : {}) }),
        ],
        { layout: 'layers', direction: 'down' },
      );
    expect(graph().links.some((l) => l.points.length > 2)).toBe(true);
    expect(graph('straight').links.every((l) => l.points.length === 2)).toBe(true);
  });
});

describe('an axis of parts end to end', () => {
  const span = (name: string, from: string, to: string) =>
    el('dg-bar', { name, label: name, from, to });

  it('draws stretches that tile a whole as one band, thicker than a track', () => {
    const band = lay([span('a', '0', '45'), span('b', '45', '80'), span('c', '80', '100')], {
      layout: 'axis',
    });
    const parts = band.items.filter((i) => i.kind === 'span');
    expect(new Set(parts.map((p) => p.y)).size).toBe(1);
    for (const [k, part] of parts.slice(1).entries()) {
      const before = parts[k]! as { x: number; w: number };
      expect(Math.abs((part as { x: number }).x - (before.x + before.w))).toBeLessThan(1);
    }
    const gantt = lay([span('a', '0', '50'), span('b', '40', '100')], { layout: 'axis' });
    const tracks = gantt.items.filter((i) => i.kind === 'span');
    expect(new Set(tracks.map((p) => p.y)).size).toBe(2);
    expect(parts[0]!.h).toBeGreaterThan(tracks[0]!.h);
  });
});

describe('annotations and groups', () => {
  it('puts a note beside its target, touching nothing, with a leader', () => {
    const layout = lay(
      [
        el('dg-box', { name: 'x', label: 'Target' }),
        el('dg-box', { label: 'Other' }),
        el('dg-text', { for: 'x', side: 'bottom', label: 'a note' }),
      ],
      { layout: 'row' },
    );
    const [note] = layout.notes;
    expect(note).toBeTruthy();
    const target = boxes(layout).find((b) => b.key === 'x')!;
    for (const box of boxes(layout))
      expect(overlap({ x: note!.x, y: note!.y, w: note!.w, h: note!.h }, box)).toBe(false);
    expect(note!.leader).toBeTruthy();
    expect(note!.y).toBeGreaterThanOrEqual(target.y + target.h);
  });

  it('keeps a note on the side asked even when the grid would fill the room', () => {
    // The room for the note is reserved before the grid is placed.
    const layout = lay(
      [
        el('dg-dot', { count: '362' }),
        el('dg-dot', { name: 'lost', count: '38', emphasis: true }),
        el('dg-text', {
          for: 'lost',
          side: 'right',
          label: '38 leave in year one',
          note: 'about one in ten',
        }),
      ],
      { layout: 'grid' },
    );
    const [note] = layout.notes;
    expect(layout.status, layout.reasons.join('; ')).toBe('fit');
    const dots = layout.items.filter((i) => i.kind === 'dot') as { x: number; size: number }[];
    const rightEdge = Math.max(...dots.map((d) => d.x + d.size));
    expect(note!.x).toBeGreaterThanOrEqual(rightEdge);
    expect(note!.x + note!.w).toBeLessThanOrEqual(1600.5);
  });

  it('is not fooled by a note that needs exactly the room reserved for it', () => {
    // Widths at which the reserved room and the note are equal to the last digit.
    for (const k of [0.5, 0.55, 0.58, 0.62, 0.65]) {
      const wide: Meter = (size) => (text) => text.length * size * k;
      const parsed = parseDiagram(
        el('deck-diagram', { layout: 'grid' }, [
          el('dg-dot', { count: '362' }),
          el('dg-dot', { name: 'lost', count: '38', emphasis: true }),
          el('dg-text', {
            for: 'lost',
            side: 'right',
            label: '38 leave in year one',
            note: 'about one in ten',
          }),
        ]),
      );
      const layout = layoutDiagram(parsed, { meter: wide, bounds: { w: 1600, h: 600 } });
      const [note] = layout.notes;
      expect(note!.y, `meter ${k}`).toBeGreaterThanOrEqual(0);
      const dots = layout.items.filter((i) => i.kind === 'dot') as { x: number; size: number }[];
      expect(note!.x, `meter ${k}`).toBeGreaterThanOrEqual(
        Math.max(...dots.map((d) => d.x + d.size)),
      );
    }
  });

  it('does not stretch a group to fill the row', () => {
    const layout = lay(
      [
        el('dg-group', { label: 'A', paint: 'outline', layout: 'column' }, [
          el('dg-box', { label: 'one' }),
        ]),
        el('dg-group', { label: 'B', paint: 'outline', layout: 'column' }, [
          el('dg-box', { label: 'two' }),
        ]),
      ],
      { layout: 'row' },
    );
    const frames = layout.items.filter((i) => i.kind === 'frame') as { w: number }[];
    expect(frames).toHaveLength(2);
    for (const frame of frames) expect(frame.w).toBeLessThan(700);
  });

  it('labels a link once, on a horizontal run above the line', () => {
    const layout = lay(
      [
        el('dg-box', { name: 'a', label: 'A' }),
        el('dg-box', { name: 'b', label: 'B' }),
        el('dg-box', { name: 'c', label: 'C' }),
        el('dg-link', { from: 'a b', to: 'c', label: 'SQL' }),
      ],
      { layout: 'layers' },
    );
    expect(layout.links.filter((l) => l.label)).toHaveLength(1);
  });

  it('draws a group surface and caption behind its children, with room for them', () => {
    const layout = lay([
      el('dg-group', { name: 'g', label: 'Before', paint: 'outline', layout: 'column' }, [
        el('dg-box', { label: 'One' }),
        el('dg-box', { label: 'Two' }),
      ]),
    ]);
    const frame = layout.items.find((i) => i.kind === 'frame');
    expect(frame).toBeTruthy();
    for (const box of boxes(layout)) {
      expect(box.x).toBeGreaterThanOrEqual((frame as { x: number }).x);
      expect(box.y).toBeGreaterThanOrEqual((frame as { y: number }).y);
      expect(box.x + box.w).toBeLessThanOrEqual(
        (frame as { x: number; w: number }).x + (frame as { w: number }).w + 0.5,
      );
    }
  });
});

describe('when it does not fit', () => {
  it('says so, names why, and still draws every mark', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      el('dg-box', { label: `Box number ${i}`, note: 'a note that takes some room in the box' }),
    );
    const layout = lay(many, { layout: 'column' }, { w: 300, h: 200 });
    expect(layout.status).toBe('unresolved');
    expect(layout.reasons.length).toBeGreaterThan(0);
    expect(boxes(layout)).toHaveLength(6);
  });

  it('tries tighter gaps before giving up', () => {
    const rows = Array.from({ length: 5 }, (_, i) => el('dg-box', { label: `Row ${i}` }));
    const loose = layoutDiagram(parseDiagram(el('deck-diagram', { layout: 'column' }, rows)), {
      meter,
      bounds: { w: 600, h: 430 },
      density: 'normal',
    });
    const ladder = layoutDiagram(parseDiagram(el('deck-diagram', { layout: 'column' }, rows)), {
      meter,
      bounds: { w: 600, h: 430 },
    });
    expect(ladder.reasons.length).toBeLessThanOrEqual(loose.reasons.length);
    expect(ladder.size.h).toBeLessThanOrEqual(loose.size.h);
  });
});

describe('any tree', () => {
  function mulberry32(seed: number) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const WORDS = [
    'cache',
    'index',
    'gateway',
    'auth',
    'a longer label here',
    'x',
    'Postgres replica',
  ];

  function randomTree(random: () => number): {
    children: ElementLike[];
    attrs: Record<string, string>;
  } {
    const layouts = ['row', 'column', 'grid', 'layers', 'ring'];
    const layout = layouts[Math.floor(random() * layouts.length)]!;
    const count = 1 + Math.floor(random() * 8);
    const children: ElementLike[] = [];
    for (let i = 0; i < count; i += 1) {
      const attrs: Record<string, string> = {
        name: `n${i}`,
        label: WORDS[Math.floor(random() * WORDS.length)]!,
      };
      if (random() < 0.4) attrs.note = WORDS[Math.floor(random() * WORDS.length)]!;
      children.push(el('dg-box', attrs));
    }
    if (layout === 'layers')
      for (let i = 1; i < count; i += 1)
        if (random() < 0.8)
          children.push(el('dg-link', { from: `n${Math.floor(random() * i)}`, to: `n${i}` }));
    return { children, attrs: { layout } };
  }

  it('is deterministic, finite, and never loses or overlaps a box when it fits', () => {
    const random = mulberry32(5);
    for (let run = 0; run < 250; run += 1) {
      const { children, attrs } = randomTree(random);
      const once = lay(children, attrs, { w: 1200, h: 700 });
      const twice = lay(children, attrs, { w: 1200, h: 700 });
      expect(JSON.stringify(once), `run ${run}`).toBe(JSON.stringify(twice));
      expect(finite(once), `run ${run}`).toBe(true);
      const placed = boxes(once);
      expect(placed, `run ${run}`).toHaveLength(
        children.filter((c) => c.localName === 'dg-box').length,
      );
      if (once.status === 'fit') {
        for (const b of placed) {
          expect(b.x, `run ${run}`).toBeGreaterThanOrEqual(-0.5);
          expect(b.x + b.w, `run ${run}`).toBeLessThanOrEqual(1200.5);
        }
        for (let i = 0; i < placed.length; i += 1)
          for (let j = i + 1; j < placed.length; j += 1)
            expect(
              overlap(placed[i]!, placed[j]!),
              `run ${run}: ${placed[i]!.key} ${placed[j]!.key} in ${attrs.layout}`,
            ).toBe(false);
      }
    }
  });

  it('puts every text inside the box that holds it', () => {
    const random = mulberry32(11);
    for (let run = 0; run < 120; run += 1) {
      const { children, attrs } = randomTree(random);
      for (const b of boxes(lay(children, attrs, { w: 1400, h: 800 }))) {
        for (const t of b.texts) {
          expect(t.x, `run ${run}`).toBeGreaterThanOrEqual(b.x - 0.5);
          expect(t.y + t.lines.length * t.line, `run ${run}`).toBeLessThanOrEqual(b.y + b.h + 0.5);
        }
      }
    }
  });
});

export type { LItem };
