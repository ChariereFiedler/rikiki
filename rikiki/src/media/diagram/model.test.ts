import { describe, expect, it } from 'vitest';
import {
  type ElementLike,
  MAX_DOTS,
  MAX_GROUP_DEPTH,
  parseDiagram,
  treeAt,
  words,
} from './model.js';

/** An element written as a literal · `el('dg-box', { label: 'Web' })`. */
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

const diagram = (children: ElementLike[], attrs: Record<string, string | true> = {}) =>
  parseDiagram(el('deck-diagram', attrs, children));
const codes = (children: ElementLike[], attrs: Record<string, string | true> = {}) =>
  diagram(children, attrs).issues.map((issue) => issue.code);

describe('parseDiagram', () => {
  it('reads marks and groups into a tree, in source order', () => {
    const parsed = diagram([
      el('dg-box', { name: 'a', label: 'A' }),
      el('dg-group', { layout: 'column' }, [
        el('dg-box', { label: 'B' }),
        el('dg-dot', { count: '5' }),
      ]),
    ]);
    expect(parsed.issues).toEqual([]);
    expect(parsed.children.map((n) => n.kind)).toEqual(['box', 'group']);
    expect(parsed.children[1]!.children.map((n) => n.kind)).toEqual(['box', 'dot']);
    expect(parsed.children.flatMap((n) => [n, ...n.children]).map((n) => n.index)).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it('counts repeats in the marks it holds', () => {
    expect(diagram([el('dg-dot', { count: '50' }), el('dg-box', { label: 'x' })]).marks).toBe(51);
  });

  it('keeps boolean attributes as the word true', () => {
    const [box] = diagram([el('dg-box', { label: 'x', emphasis: true })]).children;
    expect(box!.attrs.emphasis).toBe('true');
  });

  it('skips notes and scripts without a complaint', () => {
    expect(codes([el('dg-box', { label: 'x' }), el('deck-notes'), el('script')])).toEqual([]);
  });
});

describe('what the writing gets wrong', () => {
  it('names an attribute a mark does not read, and what it reads', () => {
    const found = diagram([el('dg-box', { label: 'x', colour: 'red' })]).issues.find(
      (i) => i.code === 'DG_ATTR_UNKNOWN',
    );
    expect(found?.items).toEqual(['dg-box · colour']);
    expect(found?.message).toContain('paint');
    expect(found?.severity).toBe('warning');
  });

  it('lets the global attributes of any element through', () => {
    expect(
      codes([el('dg-box', { label: 'x', 'data-testid': 't', class: 'c' })], { id: 'i', style: '' }),
    ).toEqual([]);
  });

  it('errors on a child that is not a mark, and does not draw it', () => {
    const parsed = diagram([el('dg-box', { label: 'x' }), el('p')]);
    expect(parsed.issues.find((i) => i.code === 'DG_CHILD_UNKNOWN')).toMatchObject({
      severity: 'error',
      items: ['p'],
    });
    expect(parsed.children).toHaveLength(1);
  });

  it('errors on a link to a name that is not there', () => {
    const found = diagram([
      el('dg-box', { name: 'a', label: 'A' }),
      el('dg-link', { from: 'a', to: 'ghost' }),
    ]).issues.find((i) => i.code === 'DG_REF_UNKNOWN');
    expect(found?.items).toEqual(['ghost']);
    expect(found?.fix).toMatchObject({ action: 'name-the-mark', known: ['a'] });
  });

  it('reads a list of names in from and to', () => {
    expect(words('web app  gw')).toEqual(['web', 'app', 'gw']);
    expect(
      codes([
        el('dg-box', { name: 'a', label: 'A' }),
        el('dg-box', { name: 'b', label: 'B' }),
        el('dg-box', { name: 'c', label: 'C' }),
        el('dg-link', { from: 'a b', to: 'c' }),
      ]),
    ).toEqual([]);
  });

  it('errors on an annotation pointing at nothing', () => {
    expect(
      codes([el('dg-box', { label: 'x' }), el('dg-text', { for: 'ghost', label: 'note' })]),
    ).toContain('DG_REF_UNKNOWN');
  });

  it('errors on a name used twice', () => {
    expect(
      codes([el('dg-box', { name: 'a', label: 'A' }), el('dg-box', { name: 'a', label: 'B' })]),
    ).toContain('DG_NAME_DUPLICATE');
  });

  it('warns about more than one emphasis', () => {
    const found = diagram([
      el('dg-box', { label: 'A', emphasis: true }),
      el('dg-box', { label: 'B', emphasis: true }),
    ]).issues.find((i) => i.code === 'DG_EMPHASIS_MANY');
    expect(found).toMatchObject({ severity: 'warning', items: ['A', 'B'] });
  });

  it('is quiet about one emphasis, and about a link that is emphasised', () => {
    expect(
      codes([
        el('dg-box', { name: 'a', label: 'A', emphasis: true }),
        el('dg-box', { name: 'b', label: 'B' }),
        el('dg-link', { from: 'a', to: 'b', emphasis: true }),
      ]),
    ).not.toContain('DG_EMPHASIS_MANY');
  });

  it('errors on a value that is not one of the words a mark accepts', () => {
    const found = diagram([el('dg-box', { label: 'x', paint: 'neon' })]).issues.find(
      (i) => i.code === 'DG_VALUE_INVALID',
    );
    expect(found?.fix).toMatchObject({
      attribute: 'paint',
      oneOf: expect.arrayContaining(['solid']),
    });
    expect(codes([el('dg-group', { layout: 'spiral' }, [el('dg-box', { label: 'x' })])])).toContain(
      'DG_VALUE_INVALID',
    );
  });

  it('reads the value of a box as a figure printed as written, not as a number', () => {
    expect(codes([el('dg-box', { label: 'Team', value: '49 €' })])).not.toContain(
      'DG_VALUE_INVALID',
    );
    expect(codes([el('dg-bar', { label: 'Team', value: '49 €' })])).toContain('DG_VALUE_INVALID');
  });

  it('errors on a count or a value that is not a number, and accepts a decimal comma', () => {
    expect(codes([el('dg-dot', { count: 'many' })])).toContain('DG_VALUE_INVALID');
    expect(codes([el('dg-bar', { label: 'x', value: '1,7' })])).not.toContain('DG_VALUE_INVALID');
    expect(codes([el('dg-bar', { label: 'x', value: '12 500' })])).not.toContain(
      'DG_VALUE_INVALID',
    );
  });

  it('errors past the ceiling of 400 dots, and past a tightened max-marks', () => {
    const big = diagram([el('dg-dot', { count: String(MAX_DOTS + 1) })]).issues.find(
      (i) => i.code === 'DG_BUDGET',
    );
    expect(big?.fix).toMatchObject({ action: 'remove-marks', keep: MAX_DOTS });
    const boxes = Array.from({ length: 6 }, (_, i) => el('dg-box', { label: `b${i}` }));
    expect(codes(boxes, { 'max-marks': '5' })).toContain('DG_BUDGET');
    expect(codes(boxes, { 'max-marks': '6' })).not.toContain('DG_BUDGET');
  });

  it('does not let max-marks lift the ceiling', () => {
    const boxes = Array.from({ length: 501 }, (_, i) => el('dg-box', { label: `b${i}` }));
    expect(codes(boxes, { 'max-marks': '9999' })).toContain('DG_BUDGET');
  });

  it('errors on groups nested too deep', () => {
    let inner: ElementLike = el('dg-box', { label: 'deep' });
    for (let i = 0; i <= MAX_GROUP_DEPTH; i += 1) inner = el('dg-group', {}, [inner]);
    expect(codes([inner])).toContain('DG_DEPTH');
  });

  it('errors on an empty diagram', () => {
    expect(codes([])).toEqual(['DG_EMPTY']);
  });

  it('gives every issue a fix that names an action', () => {
    const parsed = diagram([
      el('dg-box', { name: 'a', label: 'A', colour: 'x', emphasis: true }),
      el('dg-box', { name: 'a', label: 'B', emphasis: true, paint: 'neon' }),
      el('dg-link', { from: 'a', to: 'ghost' }),
      el('p'),
    ]);
    expect(parsed.issues.length).toBeGreaterThan(4);
    for (const issue of parsed.issues) expect(issue.fix?.action, issue.code).toBeTruthy();
  });
});

describe('parseDiagram · lanes, gates, cursors and motion', () => {
  const lanes = (extra: ElementLike[] = [], gate: Record<string, string | true> = {}) =>
    el('dg-group', { layout: 'lanes' }, [
      el('dg-lane', { name: 'api', label: 'API', flow: '3' }),
      el('dg-lane', { name: 'job', label: 'Jobs' }),
      el('dg-gate', { name: 'stop', over: 'api job', state: 'open closed', ...gate }),
      el('dg-box', { name: 'acme', label: 'ACME' }),
      ...extra,
    ]);

  it('reads a group of lanes with no issue, and counts the clicks its gate takes', () => {
    const parsed = diagram([lanes()]);
    expect(parsed.issues).toEqual([]);
    expect(parsed.stages).toBe(1);
    expect(parsed.children[0]!.children.map((n) => n.kind)).toEqual([
      'lane',
      'lane',
      'gate',
      'box',
    ]);
  });

  it('counts the clicks from the highest step', () => {
    expect(diagram([el('dg-box', { label: 'A', step: '3' })]).stages).toBe(3);
    expect(diagram([el('dg-box', { label: 'A' })]).stages).toBe(0);
  });

  it('names a lane, a gate or a cursor placed where no layout draws it', () => {
    expect(codes([el('dg-lane', { label: 'API' })])).toContain('DG_MARK_PLACE');
    expect(codes([el('dg-gate', {})])).toContain('DG_MARK_PLACE');
    expect(
      codes([el('dg-group', { layout: 'lanes' }, [el('dg-cursor', { value: '1' })])]),
    ).toContain('DG_MARK_PLACE');
    expect(
      codes([el('dg-group', { layout: 'axis' }, [el('dg-cursor', { value: '1' })])]),
    ).not.toContain('DG_MARK_PLACE');
  });

  it('names a gate over a lane that its group does not have', () => {
    expect(codes([lanes([], { over: 'api ghost' })])).toContain('DG_GATE_LANE_UNKNOWN');
  });

  it('refuses more tokens than can be counted, and a flow that is not a whole number', () => {
    expect(codes([el('dg-group', { layout: 'lanes' }, [el('dg-lane', { flow: '40' })])])).toContain(
      'DG_TOKENS_MANY',
    );
    expect(
      codes([el('dg-group', { layout: 'lanes' }, [el('dg-lane', { flow: 'many' })])]),
    ).toContain('DG_VALUE_INVALID');
  });

  it('checks the words of motion and of a gate against their lists', () => {
    expect(codes([el('dg-box', { label: 'A', enter: 'explode' })])).toContain('DG_VALUE_INVALID');
    expect(codes([el('dg-box', { label: 'A', step: '0' })])).toContain('DG_VALUE_INVALID');
    expect(codes([el('dg-box', { label: 'A', step: 'later' })])).toContain('DG_VALUE_INVALID');
    expect(codes([lanes([], { state: 'open ajar' })])).toContain('DG_VALUE_INVALID');
    expect(codes([lanes([], { at: 'far' })])).toContain('DG_VALUE_INVALID');
    expect(
      codes([
        el('dg-link', { from: 'a', to: 'b', speed: 'warp' }),
        el('dg-box', { name: 'a' }),
        el('dg-box', { name: 'b' }),
      ]),
    ).toContain('DG_VALUE_INVALID');
  });

  it('names what an after or a by points at when it is not there', () => {
    expect(codes([el('dg-box', { label: 'A', after: 'ghost' })])).toContain('DG_REF_UNKNOWN');
    expect(codes([lanes([], { by: 'ghost' })])).toContain('DG_REF_UNKNOWN');
  });

  it('names marks that wait for each other', () => {
    const parsed = diagram([
      el('dg-box', { name: 'a', after: 'b' }),
      el('dg-box', { name: 'b', after: 'a' }),
    ]);
    const cycle = parsed.issues.find((i) => i.code === 'DG_MOTION_CYCLE');
    expect(cycle?.items.sort()).toEqual(['a', 'b']);
  });
});

describe('states · a picture per click', () => {
  const twoPictures = () =>
    diagram([
      el('dg-box', { name: 'shared', label: 'Shared' }),
      el('dg-state', {}, [el('dg-box', { name: 'a', label: 'A' })]),
      el('dg-state', { step: '2' }, [
        el('dg-box', { name: 'a', label: 'A again' }),
        el('dg-box', { name: 'b', label: 'B' }),
      ]),
    ]);

  it('stands, on each click, the state whose step was reached last, the shared marks kept', () => {
    const parsed = twoPictures();
    expect(parsed.issues).toEqual([]);
    expect(parsed.states).toBe(true);
    expect(parsed.stages).toBe(2);
    const labels = (stage: number) => treeAt(parsed.children, stage).map((n) => n.attrs.label);
    expect(labels(0)).toEqual(['Shared', 'A']);
    expect(labels(1)).toEqual(['Shared', 'A']);
    expect(labels(2)).toEqual(['Shared', 'A again', 'B']);
  });

  it('returns a tree without states as it is', () => {
    const parsed = diagram([el('dg-box', { label: 'x' })]);
    expect(parsed.states).toBe(false);
    expect(treeAt(parsed.children, 3)).toBe(parsed.children);
  });

  it('lets two states name the same mark, never one picture twice', () => {
    expect(
      codes([el('dg-state', {}, [el('dg-box', { name: 'a' }), el('dg-box', { name: 'a' })])]),
    ).toContain('DG_NAME_DUPLICATE');
    expect(twoPictures().issues.map((i) => i.code)).not.toContain('DG_NAME_DUPLICATE');
  });

  it('checks a link against the picture it is drawn in', () => {
    const found = codes([
      el('dg-state', {}, [el('dg-box', { name: 'a' })]),
      el('dg-state', { step: '1' }, [
        el('dg-box', { name: 'b' }),
        el('dg-link', { from: 'a', to: 'b' }),
      ]),
    ]);
    expect(found).toContain('DG_REF_UNKNOWN');
  });

  it('names two states of one place that stand from the same click', () => {
    const found = diagram([
      el('dg-state', {}, [el('dg-box', { label: 'one' })]),
      el('dg-state', {}, [el('dg-box', { label: 'two' })]),
    ]).issues.find((i) => i.code === 'DG_STATE_STEP');
    expect(found?.fix?.action).toBe('set-attribute');
  });

  it('reads nothing on a state but its step', () => {
    expect(codes([el('dg-state', { label: 'x' }, [el('dg-box', { label: 'a' })])])).toContain(
      'DG_ATTR_UNKNOWN',
    );
  });

  it('places a state’s marks with the group that holds it', () => {
    const lanesState = el('dg-group', { layout: 'lanes' }, [
      el('dg-state', {}, [el('dg-lane', { name: 'api' })]),
    ]);
    expect(codes([lanesState])).not.toContain('DG_MARK_PLACE');
    expect(codes([el('dg-state', {}, [el('dg-lane', { name: 'api' })])])).toContain(
      'DG_MARK_PLACE',
    );
  });
});

describe('a meter and a queue', () => {
  it('count one click per word of their per-click lists', () => {
    expect(diagram([el('dg-meter', { value: '10 40 90' })]).stages).toBe(2);
    expect(diagram([el('dg-queue', { count: '6', fill: '0 3' })]).stages).toBe(1);
    expect(diagram([el('dg-meter', { value: '10', tone: 'ok warn danger' })]).stages).toBe(2);
  });

  it('accept what they read, and nothing more', () => {
    expect(
      codes([
        el('dg-meter', {
          label: 'Disk',
          value: '40 85',
          max: '100',
          unit: '%',
          threshold: '80',
          tone: 'ok danger',
        }),
        el('dg-queue', { label: 'waiting', count: '8', fill: '2 6', tone: 'warn' }),
      ]),
    ).toEqual([]);
  });

  it('refuse a value outside the scale, which would draw a lie', () => {
    const found = diagram([
      el('dg-meter', { value: '40 120', max: '100' }),
      el('dg-queue', { count: '4', fill: '6' }),
      el('dg-queue', { count: '40' }),
      el('dg-meter', { value: '10', threshold: '200' }),
    ]).issues.filter((i) => i.code === 'DG_VALUE_RANGE');
    expect(found).toHaveLength(4);
    expect(found.every((i) => i.severity === 'error')).toBe(true);
  });

  it('refuse a word where a number goes, and a tone that is not one, on any click', () => {
    expect(codes([el('dg-meter', { value: '40 lots' })])).toContain('DG_VALUE_INVALID');
    expect(codes([el('dg-queue', { count: '4', fill: '1 some' })])).toContain('DG_VALUE_INVALID');
    expect(codes([el('dg-meter', { value: '40', tone: 'ok scary' })])).toContain(
      'DG_VALUE_INVALID',
    );
    // A box turns on a click, a word that is not a tone is refused on any click · a
    // note keeps one tone.
    expect(codes([el('dg-box', { label: 'x', tone: 'ok warn' })])).toEqual([]);
    expect(codes([el('dg-box', { label: 'x', tone: 'normal scary' })])).toContain(
      'DG_VALUE_INVALID',
    );
    expect(codes([el('dg-text', { label: 'x', tone: 'ok warn' })])).toContain('DG_VALUE_INVALID');
  });

  it('count a box that turns among the clicks of the diagram', () => {
    expect(diagram([el('dg-box', { label: 'x', tone: 'normal normal danger' })]).stages).toBe(2);
  });
});
