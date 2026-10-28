// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, a composition of panels
//
// `<deck-diagram compose="split">` holds sub-pictures (`dg-panel`) the engine lays
// out side by side, over an axis, one inside the other or as a dashboard, under one
// story. Each panel holds its marks directly, with its own layout and a surface that
// says its part. A panel is a scope: the names written in it are its own, and are
// reached from outside as `panel.mark` (`modele.lecteur`). Two panels that only stand
// side by side read as two slides, so they must be joined: by the same business
// object drawn in each (`entity`), or by an axis they share (a gauge, a curve, a
// timer or a counter of the same unit over ranges that meet). A panel nested in
// another one is joined to it by being inside it.
//
// This module runs before the writing is checked: it qualifies the names, so the
// checks that follow (references, duplicates) see one flat set, and it says what
// the composition gets wrong. Pure, and it imports only types, so the model can call
// it without a cycle.
// ════════════════════════════════════════════════════════════════

import type { Compose, DgIssue, DgNode } from './model.js';

const words = (value: string | undefined): string[] => (value ?? '').split(/\s+/).filter(Boolean);

const isPanel = (node: DgNode) => node.kind === 'panel';

/** The name a camera gives the whole picture · a reference that is not a mark. */
const ALL = 'all';

/** How many panels each composition lays out at its root · `inset` holds one, the
 *  others inside it; `body-axis` a body of one or more over its axis. */
const PANELS_AT_ROOT: Readonly<Record<Compose, { min: number; max: number }>> = Object.freeze({
  split: { min: 2, max: 2 },
  'model-incident': { min: 2, max: 2 },
  'body-axis': { min: 2, max: 4 },
  inset: { min: 1, max: 1 },
  dashboard: { min: 4, max: 4 },
});

/** The attributes that name another mark, by kind · they are read in the scope of the
 *  panel they are written in. */
function referencesOf(node: DgNode): string[] {
  const shared = ['after', 'with'];
  switch (node.kind) {
    case 'link':
      return ['from', 'to', ...shared];
    case 'text':
    case 'status':
      return ['for', ...shared];
    case 'gate':
      return ['by', 'over', ...shared];
    case 'table':
      return ['from', ...shared];
    case 'camera':
      return ['focus', 'to', ...shared];
    default:
      return shared;
  }
}

/** The names a panel owns · its marks, those of its groups, not those of a panel
 *  inside it (they are that panel's). */
function ownedNames(nodes: DgNode[]): Set<string> {
  const names = new Set<string>();
  const visit = (list: DgNode[]) => {
    for (const node of list) {
      if (isPanel(node)) continue;
      if (node.attrs.name) names.add(node.attrs.name);
      visit(node.children);
    }
  };
  visit(nodes);
  return names;
}

interface Scope {
  /** The panel's name · empty at the root, whose names are not qualified. */
  panel: string;
  names: Set<string>;
  parent?: Scope;
}

/** A name as written, resolved from the scope it is written in · a qualified name
 *  (`modele.lecteur`) or a panel name stands as it is, a local one is found in the
 *  nearest panel that owns it. */
function resolve(name: string, scope: Scope | undefined, panels: Set<string>): string {
  if (name === ALL || name.includes('.') || panels.has(name)) return name;
  for (let at = scope; at; at = at.parent)
    if (at.names.has(name)) return at.panel ? `${at.panel}.${name}` : name;
  return name;
}

/** The tree with every name of a panel qualified by it, and every reference resolved. */
function qualify(nodes: DgNode[], scope: Scope | undefined, panels: Set<string>): DgNode[] {
  return nodes.map((node) => {
    const attrs: Record<string, string> = { ...node.attrs };
    for (const attribute of referencesOf(node))
      if (attrs[attribute] !== undefined)
        attrs[attribute] = words(attrs[attribute])
          .map((name) => resolve(name, scope, panels))
          .join(' ');
    if (isPanel(node)) {
      const inner: Scope = {
        panel: node.attrs.name ?? '',
        names: ownedNames(node.children),
        parent: scope,
      };
      return { ...node, attrs, children: qualify(node.children, inner, panels) };
    }
    if (scope?.panel && attrs.name) attrs.name = `${scope.panel}.${attrs.name}`;
    return { ...node, attrs, children: qualify(node.children, scope, panels) };
  });
}

/** Every panel of the tree, nested ones included, with the panel that holds it. */
function panelsIn(nodes: DgNode[], parent?: DgNode): { panel: DgNode; parent?: DgNode }[] {
  return nodes.flatMap((node) => [
    ...(isPanel(node) ? [{ panel: node, ...(parent ? { parent } : {}) }] : []),
    ...panelsIn(node.children, isPanel(node) ? node : parent),
  ]);
}

/** A panel with no name cannot scope its marks · it is named by its place, and said. */
function namePanels(nodes: DgNode[], issues: DgIssue[]): DgNode[] {
  const nameless: string[] = [];
  const named = (list: DgNode[]): DgNode[] =>
    list.map((node) => {
      const children = named(node.children);
      if (!isPanel(node) || node.attrs.name) return { ...node, children };
      const name = `panel-${node.index + 1}`;
      nameless.push(node.attrs.label ? `"${node.attrs.label}"` : name);
      return { ...node, attrs: { ...node.attrs, name }, children };
    });
  const out = named(nodes);
  if (nameless.length)
    issues.push({
      code: 'DG_PANEL_PLACE',
      severity: 'error',
      items: nameless,
      message: `a panel is the scope of its names, and is reached by its own · ${nameless.join(', ')} has none, so its marks are named after its place`,
      fix: { action: 'set-attribute', attribute: 'name', on: 'dg-panel' },
    });
  return out;
}

/** A number as an author writes it · `1 200`, `72,5`. */
const numberOf = (text: string | undefined): number =>
  text === undefined ? Number.NaN : Number(text.replace(',', '.').replace(/\s/g, ''));

/** The range of values a measuring mark stands for, in its unit · a gauge from 0 to
 *  its maximum, a curve from 0 to its top, a timer from 0 to its delay, a counter
 *  from where it starts to its figure. */
function rangeOf(node: DgNode): { unit: string; from: number; to: number } | null {
  const unit = node.attrs.unit?.trim();
  if (!unit) return null;
  const values = (list: string | undefined) =>
    words(list)
      .map(numberOf)
      .filter((v) => Number.isFinite(v));
  if (node.kind === 'meter') {
    const max = numberOf(node.attrs.max);
    return { unit, from: 0, to: Number.isFinite(max) && max > 0 ? max : 100 };
  }
  if (node.kind === 'curve') {
    const max = numberOf(node.attrs.max);
    return {
      unit,
      from: 0,
      to: Number.isFinite(max) ? max : Math.max(0, ...values(node.attrs.values)),
    };
  }
  if (node.kind === 'timer') return { unit, from: 0, to: numberOf(node.attrs.value) };
  if (node.kind === 'counter') {
    const to = numberOf(node.attrs.value);
    const from = Number.isFinite(numberOf(node.attrs.from)) ? numberOf(node.attrs.from) : 0;
    return { unit, from: Math.min(from, to), to: Math.max(from, to) };
  }
  return null;
}

/** Which panels are joined, and by what · the same entity drawn in two panels, an
 *  axis of one unit whose ranges meet, a panel inside another one. */
function joinsOf(panels: { panel: DgNode; parent?: DgNode }[]): {
  groups: string[][];
} {
  const names = panels.map(({ panel }) => panel.attrs.name!);
  const root = new Map(names.map((n) => [n, n]));
  const find = (n: string): string => {
    const up = root.get(n)!;
    if (up === n) return n;
    const top = find(up);
    root.set(n, top);
    return top;
  };
  const join = (a: string, b: string) => root.set(find(a), find(b));
  const entities = new Map<string, Set<string>>();
  const axes: { panel: string; unit: string; from: number; to: number }[] = [];
  for (const { panel, parent } of panels) {
    const name = panel.attrs.name!;
    if (parent) join(name, parent.attrs.name!);
    const visit = (list: DgNode[]) => {
      for (const node of list) {
        if (isPanel(node)) continue;
        // A mark may stand for several objects · `entity="v250 checkout"`.
        for (const entity of words(node.attrs.entity)) {
          const seen = entities.get(entity) ?? new Set();
          seen.add(name);
          entities.set(entity, seen);
        }
        const range = rangeOf(node);
        if (range && Number.isFinite(range.from) && Number.isFinite(range.to))
          axes.push({ panel: name, ...range });
        visit(node.children);
      }
    };
    visit(panel.children);
  }
  for (const seen of entities.values()) {
    const [first, ...rest] = [...seen];
    for (const other of rest) join(first!, other);
  }
  for (const a of axes)
    for (const b of axes)
      if (a.panel !== b.panel && a.unit === b.unit && a.from <= b.to && b.from <= a.to)
        join(a.panel, b.panel);
  const groups = new Map<string, string[]>();
  for (const n of names) groups.set(find(n), [...(groups.get(find(n)) ?? []), n]);
  return { groups: [...groups.values()].sort((a, b) => b.length - a.length) };
}

/** Panels that are only side by side · two pictures in one frame. */
function checkJoined(nodes: DgNode[], issues: DgIssue[]): void {
  const panels = panelsIn(nodes);
  if (panels.length < 2) return;
  const { groups } = joinsOf(panels);
  if (groups.length < 2) return;
  const apart = groups.slice(1).flat();
  issues.push({
    code: 'DG_PANEL_APART',
    severity: 'error',
    items: apart,
    message: `${apart.map((n) => `"${n}"`).join(', ')} ${apart.length === 1 ? 'shares' : 'share'} nothing with ${groups[0]!.map((n) => `"${n}"`).join(', ')} · panels only side by side read as two slides, and a common title does not join them`,
    measurement: { groups },
    fix: {
      action: 'articulate',
      use: 'entity="…" on the mark of the same object in each panel, or a dg-meter, dg-curve, dg-timer or dg-counter of the same unit over ranges that meet',
      or: 'split the slide',
    },
  });
}

/** How many panels the composition lays out, and the one it sets at its foot. */
function checkShape(compose: Compose, nodes: DgNode[], issues: DgIssue[]): void {
  const panels = nodes.filter(isPanel);
  const wanted = PANELS_AT_ROOT[compose];
  const wrong: string[] = [];
  if (panels.length < wanted.min || panels.length > wanted.max)
    wrong.push(
      `${panels.length} panel${panels.length === 1 ? '' : 's'} at its root, ${compose} lays out ${wanted.min === wanted.max ? wanted.min : `${wanted.min} to ${wanted.max}`}`,
    );
  if (compose === 'body-axis' && panels.filter((p) => p.attrs.layout === 'axis').length !== 1)
    wrong.push('body-axis sets one panel with layout="axis" at its foot · it has not exactly one');
  if (compose === 'inset' && !panels.some((p) => p.children.some(isPanel)))
    wrong.push('inset draws a panel inside a panel · its panel holds none');
  if (!wrong.length) return;
  issues.push({
    code: 'DG_PANEL_PLACE',
    severity: 'error',
    items: wrong,
    message: `compose="${compose}": ${wrong.join('; ')} · laid out as it can, which is not the composition asked for`,
    measurement: { panels: panels.length },
    expected: wanted,
    fix: { action: 'set-panels', compose, panels: wanted },
  });
}

/** What stands at the root of a composition besides its panels and its cameras is
 *  not drawn · a mark belongs to the panel whose picture it is part of. */
function keepPanels(nodes: DgNode[], issues: DgIssue[]): DgNode[] {
  const stray = nodes.filter((n) => !isPanel(n) && n.kind !== 'camera');
  if (stray.length)
    issues.push({
      code: 'DG_PANEL_PLACE',
      severity: 'error',
      items: stray.map((n) => `${n.kind} ${n.attrs.name ?? n.attrs.label ?? n.index + 1}`),
      message:
        'only dg-panel and dg-camera stand at the root of a composition · the rest is not drawn',
      fix: { action: 'move-into', into: 'dg-panel' },
    });
  return nodes.filter((n) => isPanel(n) || n.kind === 'camera');
}

/** Panels and entities outside a composition · drawn as groups, and said. */
function checkStray(nodes: DgNode[], issues: DgIssue[]): void {
  const panels = panelsIn(nodes).map(({ panel }) => panel.attrs.name ?? panel.attrs.label ?? '');
  const entities: string[] = [];
  const visit = (list: DgNode[]) => {
    for (const node of list) {
      if (node.attrs.entity) entities.push(node.attrs.name ?? node.attrs.label ?? node.kind);
      visit(node.children);
    }
  };
  visit(nodes);
  if (panels.length)
    issues.push({
      code: 'DG_PANEL_PLACE',
      severity: 'error',
      items: panels,
      message:
        'a dg-panel is a part of a composition, and this diagram has no compose · it is drawn as a group',
      fix: { action: 'set-attribute', on: 'deck-diagram', attribute: 'compose' },
    });
  if (entities.length)
    issues.push({
      code: 'DG_PANEL_PLACE',
      severity: 'warning',
      items: entities,
      message:
        'entity joins the panels of a composition, and this diagram has none · it changes nothing',
      fix: { action: 'remove-attributes', attributes: ['entity'] },
    });
}

/** A tree written as a composition, its names qualified and what it gets wrong said ·
 *  a tree with no `compose` is returned as it is, its stray panels said. */
export function composeTree(tree: { attrs: Record<string, string>; children: DgNode[] }): {
  attrs: Record<string, string>;
  children: DgNode[];
  issues: DgIssue[];
} {
  const issues: DgIssue[] = [];
  const compose = tree.attrs.compose as Compose | undefined;
  if (compose === undefined || !(compose in PANELS_AT_ROOT)) {
    if (compose === undefined) checkStray(tree.children, issues);
    return { ...tree, issues };
  }
  const attrs = { ...tree.attrs };
  if (attrs.intent !== undefined) {
    issues.push({
      code: 'DG_PANEL_INTENT',
      severity: 'error',
      items: [`intent="${attrs.intent}"`],
      message:
        'compose and intent are exclusive · an intent places all the marks of one picture, a composition several pictures · the panels are drawn, the intent is neither drawn nor proved',
      fix: {
        action: 'remove-attributes',
        attributes: ['intent', 'also'],
        or: 'drop compose and the panels',
      },
    });
    delete attrs.intent;
    delete attrs.also;
  }
  if (attrs.layout !== undefined) {
    issues.push({
      code: 'DG_PANEL_PLACE',
      severity: 'warning',
      items: [`layout="${attrs.layout}"`],
      message: `the composition lays out its panels itself · layout="${attrs.layout}" on the root is dropped (a panel takes its own layout)`,
      fix: { action: 'remove-attributes', attributes: ['layout'] },
    });
    delete attrs.layout;
  }
  const kept = namePanels(keepPanels(tree.children, issues), issues);
  checkShape(compose, kept, issues);
  const panels = new Set(panelsIn(kept).map(({ panel }) => panel.attrs.name!));
  const root: Scope = { panel: '', names: ownedNames(kept) };
  const children = qualify(kept, root, panels);
  checkJoined(children, issues);
  return { attrs, children, issues };
}
