import { describe, expect, it } from 'vitest';
import {
  type DiagramLayout,
  type LBox,
  type LLane,
  type LMeter,
  type Meter,
  layoutDiagram,
} from './layout.js';
import { planRun } from './lanes.js';
import { type ElementLike, parseDiagram } from './model.js';

// The traps authors fell into while drawing fifteen concepts in the free grammar
// (examples/diagrams-prompts) · each one was the engine's, not the author's: an
// attribute dropped, a link drawn through a box, lanes that took the whole room, a
// label on a box, a note with no side left, gates in series that filtered once.

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

const lay = (
  children: ElementLike[],
  attrs: Record<string, string | true> = {},
  options: { w?: number; stage?: number; locale?: string } = {},
): DiagramLayout =>
  layoutDiagram(parse(children, attrs), {
    meter,
    bounds: { w: options.w ?? 1600, h: 600 },
    ...(options.stage === undefined ? {} : { stage: options.stage }),
    ...(options.locale ? { locale: options.locale } : {}),
  });

type Rect = { x: number; y: number; w: number; h: number };

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Whether the segment a→b passes through the inside of a rect, `pad` in from its edge. */
function segmentHits(a: { x: number; y: number }, b: { x: number; y: number }, r: Rect, pad = 1) {
  const [left, right, top, bottom] = [r.x + pad, r.x + r.w - pad, r.y + pad, r.y + r.h - pad];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let near = 0;
  let far = 1;
  for (const [p, q] of [
    [-dx, a.x - left],
    [dx, right - a.x],
    [-dy, a.y - top],
    [dy, bottom - a.y],
  ] as const) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) near = Math.max(near, t);
      else far = Math.min(far, t);
      if (near > far) return false;
    }
  }
  return near < far;
}

const box = (layout: DiagramLayout, key: string) =>
  layout.items.find((i): i is LBox => i.kind === 'box' && i.key === key)!;
const codes = (layout: DiagramLayout) => layout.issues.map((i) => i.code);

describe('link="arrow" on a dg-group', () => {
  const tree = () => [
    el('dg-group', { layout: 'row', link: 'arrow' }, [
      el('dg-box', { name: 'a', label: 'Panne' }),
      el('dg-box', { name: 'b', label: 'Échecs' }),
      el('dg-box', { name: 'c', label: 'Retries' }),
    ]),
  ];

  it('is read, not dropped as an attribute the group does not know', () => {
    expect(parse(tree(), { layout: 'column' }).issues.map((i) => i.code)).not.toContain(
      'DG_ATTR_UNKNOWN',
    );
  });

  it('chains the children of the group with arrows', () => {
    const layout = lay(tree(), { layout: 'column' });
    expect(layout.links.map((l) => `${l.from}>${l.to}`)).toEqual(['a>b', 'b>c']);
    expect(layout.links.every((l) => l.head)).toBe(true);
  });
});

describe('a link between two boxes of a row with a box between them', () => {
  const row = (route?: string) => [
    el('dg-box', { name: 'a', label: 'Producteur' }),
    el('dg-box', { name: 'b', label: 'Relais' }),
    el('dg-box', { name: 'c', label: 'Consommateur' }),
    el('dg-link', { from: 'a', to: 'c', ...(route ? { route } : {}) }),
  ];

  it('goes round the box in between instead of through it', () => {
    const layout = lay(row(), { layout: 'row' });
    const link = layout.links.find((l) => l.from === 'a' && l.to === 'c')!;
    const middle = box(layout, 'b');
    const through = link.points.slice(1).some((p, k) => segmentHits(link.points[k]!, p, middle));
    expect(through).toBe(false);
    expect(codes(layout)).not.toContain('DG_LINK_CROSSES');
  });

  it('is said when a link asked straight still runs through a box', () => {
    const layout = lay(row('straight'), { layout: 'row' });
    const found = layout.issues.find((i) => i.code === 'DG_LINK_CROSSES');
    expect(found?.severity).toBe('warning');
    expect(found?.items).toContain('a → c');
    expect(found?.fix).toMatchObject({ action: 'reroute', crosses: ['b'] });
  });
});

describe('lanes beside a box, or in a state', () => {
  const lanes = (note = '') => [
    el('dg-box', { name: 'source', label: 'Producteur', ...(note ? { note } : {}) }),
    el('dg-group', { name: 'voies', layout: 'lanes' }, [
      el('dg-lane', { name: 'a', label: 'Lectures', flow: '4' }),
      el('dg-lane', { name: 'b', label: 'Écritures', flow: '4' }),
      el('dg-gate', { name: 'g', label: 'garde', state: 'open closed' }),
      el('dg-box', { name: 'api', label: 'API' }),
    ]),
  ];
  const trackOf = (layout: DiagramLayout) => {
    const lane = layout.items.find((i): i is LLane => i.kind === 'lane')!;
    return lane.track.x1 - lane.track.x0;
  };

  it('take the width they need, not the whole room · the row keeps room either side', () => {
    const wide = lay(lanes(), { layout: 'row' }, { w: 1600 });
    const source = box(wide, 'source');
    expect(source.x).toBeGreaterThan(0);
    expect(trackOf(wide)).toBe(trackOf(lay(lanes(), { layout: 'row' }, { w: 1500 })));
  });

  it('keep their length from one picture to the next when a neighbour changes', () => {
    const states = [
      el('dg-state', {}, lanes()),
      el('dg-state', { step: '1' }, lanes('émet dix messages par seconde, et ne ralentit pas')),
    ];
    const first = lay(states, { layout: 'row' }, { stage: 0 });
    const second = lay(states, { layout: 'row' }, { stage: 1 });
    expect(trackOf(first)).toBe(trackOf(second));
  });

  it('still fill the room when they are the whole drawing', () => {
    const layout = lay(
      [
        el('dg-lane', { name: 'a', label: 'A' }),
        el('dg-gate', { name: 'g', label: 'garde' }),
        el('dg-box', { name: 'api', label: 'API' }),
      ],
      { layout: 'lanes' },
    );
    const api = box(layout, 'api');
    expect(api.x + api.w).toBeGreaterThan(1500);
  });
});

describe('a per-click list on a mark that appears late', () => {
  const gate = (state: string) =>
    parse(
      [
        el('dg-lane', { name: 'a', label: 'A' }),
        el('dg-gate', { name: 'g', label: 'garde', state, step: '2' }),
      ],
      { layout: 'lanes' },
    );

  it('names the words written before the mark is there, never seen', () => {
    const found = gate('open closed').issues.find((i) => i.code === 'DG_STEP_WORDS_UNSEEN');
    expect(found?.severity).toBe('warning');
    expect(found?.items[0]).toContain('g');
    expect(found?.fix).toMatchObject({ attribute: 'state', write: 'open open open closed' });
  });

  it('is quiet when every word is padded to the click the mark appears on', () => {
    expect(gate('open open open closed').issues.map((i) => i.code)).not.toContain(
      'DG_STEP_WORDS_UNSEEN',
    );
  });

  it('counts the click of the state that holds the mark', () => {
    const parsed = parse([
      el('dg-state', {}, [el('dg-box', { name: 'x', label: 'X' })]),
      el('dg-state', { step: '1' }, [el('dg-meter', { name: 'm', label: 'M', value: '10 20 30' })]),
    ]);
    const found = parsed.issues.find((i) => i.code === 'DG_STEP_WORDS_UNSEEN');
    expect(found?.fix).toMatchObject({ attribute: 'value', write: '10 10 20 30' });
  });
});

describe("a link's label", () => {
  it('widens the gap of a row so it sits between the boxes it joins, never on them', () => {
    const layout = lay(
      [
        el('dg-box', { name: 'calcul', label: 'Calcul' }),
        el('dg-box', { name: 'solde', label: 'Solde' }),
        el('dg-link', { from: 'calcul', to: 'solde', label: 'recalculé à chaque rejeu' }),
      ],
      { layout: 'row', gap: 'tight' },
    );
    const label = layout.links[0]!.label!;
    const w = meter(label.size, label.weight)(label.lines[0]!);
    const rect = { x: label.x - w / 2, y: label.y, w, h: label.line };
    for (const key of ['calcul', 'solde']) expect(overlaps(rect, box(layout, key))).toBe(false);
  });

  it('is said when no place beside its line is free', () => {
    const layout = lay(
      [
        el('dg-group', { layout: 'row', gap: 'tight' }, [
          el('dg-box', { name: 'h1', label: 'Équipe Panier, Paiement et Livraison' }),
        ]),
        el('dg-group', { layout: 'row', gap: 'tight' }, [
          el('dg-box', { name: 'b1', label: 'Bas, à gauche, tout au bout' }),
        ]),
        el('dg-link', { from: 'h1', to: 'b1', label: 'une étiquette bien trop longue pour tenir' }),
      ],
      { layout: 'column', gap: 'tight' },
    );
    const label = layout.links[0]!.label!;
    const w = meter(label.size, label.weight)(label.lines[0]!);
    const rect = { x: label.x - w / 2, y: label.y, w, h: label.line };
    expect(['h1', 'b1'].some((key) => overlaps(rect, box(layout, key)))).toBe(true);
    const found = layout.issues.find((i) => i.code === 'DG_LABEL_BLOCKED');
    expect(found?.severity).toBe('warning');
    expect(found?.fix).toMatchObject({ action: 'shorten-label', link: 'h1 → b1' });
  });
});

describe('a note asked on top', () => {
  it('is put on top of a mark at the top of the drawing, the drawing moved down for it', () => {
    const layout = lay(
      [
        el('dg-box', { name: 'a', label: 'Producteur' }),
        el('dg-box', { name: 'b', label: 'Consommateur' }),
        el('dg-text', { for: 'b', side: 'top', label: 'lent' }),
      ],
      { layout: 'row' },
    );
    const note = layout.notes[0]!;
    const b = box(layout, 'b');
    expect(note.y + note.h).toBeLessThanOrEqual(b.y);
    expect(note.y).toBeGreaterThanOrEqual(0);
    expect(layout.status).toBe('fit');
  });

  it('finds a side on the box the lanes run into', () => {
    const layout = lay(
      [
        el('dg-lane', { name: 'l1', label: 'Scans', flow: '4' }),
        el('dg-lane', { name: 'l2', label: 'Bots', flow: '4' }),
        el('dg-gate', { name: 'c1', over: 'l1', label: 'pare-feu' }),
        el('dg-box', { name: 'coeur', label: 'Données' }),
        el('dg-text', { for: 'coeur', side: 'top', label: '2 sur 12 passent' }),
      ],
      { layout: 'lanes' },
    );
    expect(layout.reasons.join(' ')).not.toContain('no free side');
    const note = layout.notes[0]!;
    expect(note.y + note.h).toBeLessThanOrEqual(box(layout, 'coeur').y);
  });
});

describe('gates in series on one lane', () => {
  it('filter in cascade · each shedding gate lets half of what reaches it through', () => {
    const run = planRun({
      track: { x0: 0, x1: 1400 },
      gates: [
        { x: 300, w: 96, state: 'shed' },
        { x: 800, w: 96, state: 'shed' },
      ],
      flow: 8,
      speed: 'normal',
    });
    const past = (x: number) => run.tokens.filter((t) => t.to > x).length;
    expect(past(300 + 96)).toBe(4);
    expect(past(800 + 96)).toBe(2);
    const refusedBetween = run.tokens.filter(
      (t) => t.fate === 'refuse' && t.to > 396 && t.to < 800,
    );
    expect(refusedBetween).toHaveLength(2);
  });

  it('a closed gate after a shedding one holds what the first let through', () => {
    const run = planRun({
      track: { x0: 0, x1: 1400 },
      gates: [
        { x: 300, w: 96, state: 'shed' },
        { x: 800, w: 96, state: 'closed' },
      ],
      flow: 6,
      speed: 'normal',
    });
    expect(run.tokens.filter((t) => t.to > 896)).toHaveLength(0);
    expect(run.tokens.filter((t) => t.to > 396 && t.to < 800)).toHaveLength(3);
  });
});

describe("a gauge's figure", () => {
  const gauge = (value: string, locale?: string) => {
    const layout = lay(
      [el('dg-meter', { name: 'm', label: 'Erreurs', value, unit: '%', max: '1' })],
      {},
      locale ? { locale } : {},
    );
    const item = layout.items.find((i): i is LMeter => i.kind === 'meter')!;
    return item.figures.map((f) => f.lines.join(' '));
  };

  it('is written with the decimal sign of the deck language', () => {
    expect(gauge('0.2 0.5', 'fr')).toEqual(['0,2 %', '0,5 %']);
    expect(gauge('0,2', 'en')).toEqual(['0.2 %']);
  });

  it('is written as it is without a language', () => {
    expect(gauge('0.2')).toEqual(['0.2 %']);
  });
});
