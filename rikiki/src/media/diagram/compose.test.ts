import { describe, expect, it } from 'vitest';
import { compileIntent } from './intent.js';
import { type Meter, bendShares, layoutDiagram } from './layout.js';
import { type DgIssue, type DgNode, type ElementLike, parseDiagram, treeAt } from './model.js';

// ════════════════════════════════════════════════════════════════
// A composition of panels · what is promised: the names of a panel are its own and
// are reached as `panel.mark`, panels that share nothing are refused with a fix, the
// composition lays its panels out by its shape (1,65 to 1, two equal views, a body
// over its axis, one inside the other, two by two), and an intent is never hidden.
// ════════════════════════════════════════════════════════════════

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

const box = (name: string, attrs: Record<string, string> = {}) =>
  el('dg-box', { name, label: name, ...attrs });

const parse = (attrs: Record<string, string>, children: ElementLike[]) =>
  parseDiagram(el('deck-diagram', attrs, children), compileIntent);

const codes = (issues: DgIssue[]) => issues.map((i) => i.code);

const named = (nodes: DgNode[]): string[] =>
  nodes.flatMap((n) => [...(n.attrs.name ? [n.attrs.name] : []), ...named(n.children)]);

/** The kill switch and its incident, joined by the flag both draw. */
const modelIncident = (flag = 'stop') => [
  el('dg-panel', { name: 'modele', layout: 'row' }, [
    box('drapeau', { entity: flag }),
    box('lecteur'),
    el('dg-link', { name: 'lit', from: 'lecteur', to: 'drapeau' }),
  ]),
  el('dg-panel', { name: 'incident', layout: 'row' }, [
    box('db2', { entity: 'stop' }),
    box('lecteur'),
    el('dg-link', { from: 'lecteur', to: 'db2', after: 'modele.lit' }),
  ]),
];

describe('the names of a panel', () => {
  it('are qualified by the panel, so two panels may name a mark alike', () => {
    const parsed = parse({ compose: 'model-incident' }, modelIncident());
    expect(codes(parsed.issues)).toEqual([]);
    expect(named(parsed.children)).toEqual([
      'modele',
      'modele.drapeau',
      'modele.lecteur',
      'modele.lit',
      'incident',
      'incident.db2',
      'incident.lecteur',
    ]);
  });

  it('resolve a local name in its panel and a qualified one as written', () => {
    const parsed = parse({ compose: 'model-incident' }, modelIncident());
    const link = parsed.children[1]!.children.find((n) => n.kind === 'link')!;
    expect(link.attrs).toMatchObject({
      from: 'incident.lecteur',
      to: 'incident.db2',
      after: 'modele.lit',
    });
  });

  it('say a qualified reference to nothing, with the names known', () => {
    const parsed = parse({ compose: 'model-incident' }, [
      ...modelIncident(),
      el('dg-camera', { focus: 'modele.absent', to: 'all' }),
    ]);
    expect(codes(parsed.issues)).toContain('DG_REF_UNKNOWN');
  });

  it('name a panel with no name after its place, and say so', () => {
    const [first] = modelIncident();
    const nameless = el('dg-panel', { layout: 'row' }, [box('db2', { entity: 'stop' })]);
    const parsed = parse({ compose: 'model-incident' }, [first!, nameless]);
    expect(parsed.issues.find((i) => i.code === 'DG_PANEL_PLACE')?.message).toMatch(/has none/);
    expect(named(parsed.children)).toContain('panel-5.db2');
  });
});

describe('panels only side by side', () => {
  it('are refused, with what joins them', () => {
    const parsed = parse({ compose: 'model-incident' }, modelIncident('autre'));
    const apart = parsed.issues.find((i) => i.code === 'DG_PANEL_APART')!;
    expect(apart.severity).toBe('error');
    expect(apart.items).toEqual(['incident']);
    expect(apart.fix?.use).toMatch(/entity/);
  });

  it('are joined by an axis of one unit over ranges that meet', () => {
    const gauge = (name: string, unit: string, max: string) =>
      el('dg-panel', { name, layout: 'column' }, [
        el('dg-meter', { name: 'm', label: 'p95', value: '200', max, unit }),
      ]);
    expect(
      codes(
        parse({ compose: 'split' }, [gauge('a', 'ms', '1000'), gauge('b', 'ms', '800')]).issues,
      ),
    ).not.toContain('DG_PANEL_APART');
    expect(
      codes(parse({ compose: 'split' }, [gauge('a', 'ms', '1000'), gauge('b', '%', '100')]).issues),
    ).toContain('DG_PANEL_APART');
  });

  it('are joined when one stands inside the other', () => {
    const parsed = parse({ compose: 'inset' }, [
      el('dg-panel', { name: 'prod', layout: 'row' }, [
        el('dg-panel', { name: 'jeu', layout: 'column' }, [box('cas')]),
        box('reels'),
      ]),
    ]);
    expect(codes(parsed.issues)).toEqual([]);
  });

  it('may share several objects on one mark', () => {
    const parsed = parse({ compose: 'split' }, [
      el('dg-panel', { name: 'a' }, [box('x', { entity: 'v25 checkout' })]),
      el('dg-panel', { name: 'b' }, [box('y', { entity: 'checkout' })]),
    ]);
    expect(codes(parsed.issues)).toEqual([]);
  });
});

describe('what a composition holds', () => {
  it('drops an intent it cannot hold, and says it is neither drawn nor proved', () => {
    const parsed = parse({ compose: 'model-incident', intent: 'barrier' }, modelIncident());
    const said = parsed.issues.find((i) => i.code === 'DG_PANEL_INTENT')!;
    expect(said.severity).toBe('error');
    expect(said.message).toMatch(/neither drawn nor proved/);
    expect(parsed.intent).toBeUndefined();
  });

  it('drops a layout on its root, and says so', () => {
    const parsed = parse({ compose: 'model-incident', layout: 'row' }, modelIncident());
    expect(parsed.issues.find((i) => i.code === 'DG_PANEL_PLACE')?.severity).toBe('warning');
    expect(parsed.attrs.layout).toBeUndefined();
  });

  it('says a wrong number of panels, a body with no axis, an inset with no panel inside', () => {
    const one = parse({ compose: 'dashboard' }, modelIncident());
    expect(one.issues.find((i) => i.code === 'DG_PANEL_PLACE')?.message).toMatch(/2 panels/);
    const noAxis = parse({ compose: 'body-axis' }, modelIncident());
    expect(noAxis.issues.find((i) => i.code === 'DG_PANEL_PLACE')?.message).toMatch(/axis/);
    const flat = parse({ compose: 'inset' }, [el('dg-panel', { name: 'p' }, [box('a')])]);
    expect(flat.issues.find((i) => i.code === 'DG_PANEL_PLACE')?.message).toMatch(/inside a panel/);
  });

  it('does not draw a mark standing at its root, and says so', () => {
    const parsed = parse({ compose: 'model-incident' }, [...modelIncident(), box('perdu')]);
    expect(parsed.issues.find((i) => i.code === 'DG_PANEL_PLACE')?.message).toMatch(/not drawn/);
    expect(named(parsed.children)).not.toContain('perdu');
  });

  it('says a panel or an entity outside a composition', () => {
    const parsed = parse({ layout: 'row' }, [
      el('dg-panel', { name: 'seul' }, [box('a')]),
      box('b', { entity: 'x' }),
    ]);
    const said = parsed.issues.filter((i) => i.code === 'DG_PANEL_PLACE');
    expect(said.map((i) => i.severity).sort()).toEqual(['error', 'warning']);
  });
});

describe('the shapes of a composition', () => {
  const laid = (attrs: Record<string, string>, children: ElementLike[]) =>
    layoutDiagram(parse(attrs, children), { meter, bounds: { w: 1600, h: 600 } });

  it('splits the width 1.65 to 1, the panels as tall as each other', () => {
    const drawn = laid({ compose: 'split' }, modelIncident());
    const a = drawn.places.get('modele')!;
    const b = drawn.places.get('incident')!;
    expect(a.w / b.w).toBeCloseTo(1.65, 1);
    expect(a.h).toBe(b.h);
    expect(drawn.status).toBe('fit');
  });

  it('sets a model and its incident side by side, as wide as each other', () => {
    const drawn = laid({ compose: 'model-incident' }, modelIncident());
    expect(drawn.places.get('modele')!.w).toBeCloseTo(drawn.places.get('incident')!.w, 0);
  });

  it('sets the axis at the foot of the body, across the whole room', () => {
    const drawn = laid({ compose: 'body-axis' }, [
      el('dg-panel', { name: 'temps', layout: 'axis' }, [
        el('dg-bar', { name: 'rpo', label: 'RPO', from: '0', to: '12' }),
        el('dg-cursor', { name: 'panne', label: 'panne', value: '12', entity: 'p' }),
      ]),
      el('dg-panel', { name: 'reseau', layout: 'row' }, [box('principal', { entity: 'p' })]),
    ]);
    const body = drawn.places.get('reseau')!;
    const foot = drawn.places.get('temps')!;
    expect(foot.y).toBeGreaterThan(body.y + body.h - 1);
    expect(foot.w).toBe(1600);
  });

  it('sets a dashboard two by two', () => {
    const panel = (name: string) => el('dg-panel', { name }, [box(`${name}-w`, { entity: 'e' })]);
    const drawn = laid({ compose: 'dashboard' }, ['a', 'b', 'c', 'd'].map(panel));
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((n) => drawn.places.get(n)!);
    expect(a!.y).toBe(b!.y);
    expect(c!.y).toBe(d!.y);
    expect(c!.y).toBeGreaterThan(a!.y);
    expect(a!.x).toBe(c!.x);
  });

  it('sets an inset panel as wide as the room, its panel inside it', () => {
    const drawn = laid({ compose: 'inset' }, [
      el('dg-panel', { name: 'prod', layout: 'row' }, [
        el('dg-panel', { name: 'jeu' }, [box('cas')]),
        box('reels'),
      ]),
    ]);
    const outer = drawn.places.get('prod')!;
    const inner = drawn.places.get('jeu')!;
    expect(outer.w).toBe(1600);
    expect(inner.x).toBeGreaterThan(outer.x);
    expect(inner.y).toBeGreaterThan(outer.y);
  });

  it('keeps a note inside the panel of its mark', () => {
    const drawn = laid({ compose: 'model-incident' }, [
      el('dg-panel', { name: 'a', layout: 'row' }, [
        box('x', { entity: 'e' }),
        el('dg-status', { for: 'x', state: 'fail', label: '26 → 29 avril', side: 'bottom' }),
      ]),
      el('dg-panel', { name: 'b', layout: 'row' }, [box('y', { entity: 'e' })]),
    ]);
    const panel = drawn.places.get('a')!;
    const note = drawn.notes[0]!;
    expect(note.y + note.h).toBeLessThanOrEqual(panel.y + panel.h);
    expect(drawn.status).toBe('fit');
  });

  it('gives a panel the least width it holds its marks in, the others the rest', () => {
    expect(bendShares([1.65, 1], [0, 0], 1000).map(Math.round)).toEqual([623, 377]);
    expect(bendShares([1, 1], [700, 0], 1000).map(Math.round)).toEqual([700, 300]);
  });

  it('plays its clicks as pictures, a mark named alike in a panel moving', () => {
    const parsed = parse({ compose: 'model-incident' }, [
      el('dg-panel', { name: 'a', layout: 'row' }, [
        el('dg-state', {}, [box('x', { entity: 'e' }), box('y')]),
        el('dg-state', { step: '1' }, [box('y'), box('x', { entity: 'e' })]),
      ]),
      el('dg-panel', { name: 'b' }, [box('z', { entity: 'e' })]),
    ]);
    expect(codes(parsed.issues)).toEqual([]);
    expect(parsed.states).toBe(true);
    expect(named(treeAt(parsed.children, 1))).toContain('a.x');
    for (const stage of [0, 1])
      expect(layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 }, stage }).status).toBe(
        'fit',
      );
  });
});
