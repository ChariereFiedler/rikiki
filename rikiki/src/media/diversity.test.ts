import { describe, expect, it } from 'vitest';
import { signatureOf, topologyOf } from './diagram/diagram-signature.js';
import { compileIntent } from './diagram/intent.js';
import { type ElementLike, parseDiagram } from './diagram/model.js';
import {
  DIVERSITY_LIMITS,
  type GalleryEntry,
  distance,
  familyOf,
  measureDiversity,
  repeatedLookIssues,
  signatureFromInk,
  structuralKey,
  thumbOf,
} from './diversity.js';
import type { InkModel } from './ill-rules.js';

/** An element as the parser reads it · a tag, its attributes, its children. */
function el(
  tag: string,
  attrs: Record<string, string> = {},
  ...children: ElementLike[]
): ElementLike {
  return {
    localName: tag,
    children,
    getAttribute: (n) => (n in attrs ? attrs[n]! : null),
    hasAttribute: (n) => n in attrs,
    getAttributeNames: () => Object.keys(attrs),
  };
}

const box = (name: string, label = name, extra: Record<string, string> = {}) =>
  el('dg-box', { name, label, ...extra });
const link = (from: string, to: string, extra: Record<string, string> = {}) =>
  el('dg-link', { from, to, ...extra });
const signature = (root: ElementLike) => signatureOf(parseDiagram(root, compileIntent));

/** A graph of services · the same drawing whatever its words. */
const services = (words: string[]) =>
  el(
    'deck-diagram',
    { layout: 'layers', direction: 'right' },
    box('a', words[0]),
    box('b', words[1], { emphasis: '' }),
    box('c', words[2]),
    box('d', words[3]),
    link('a', 'b'),
    link('b', 'c d'),
  );

const barrier = el(
  'deck-diagram',
  { intent: 'barrier' },
  el('dg-lane', { role: 'flow', name: 'api', label: 'API' }),
  el('dg-lane', { role: 'flow', name: 'jobs', label: 'jobs' }),
  el('dg-gate', { role: 'barrier', name: 'stop', label: 'STOP' }),
  box('beyond', 'Partner', { role: 'beyond' }),
);
const bottleneck = el(
  'deck-diagram',
  { intent: 'bottleneck' },
  box('in', 'Arrivals', { role: 'source', value: '6 / min' }),
  el('dg-queue', { role: 'queue', name: 'wait', label: 'waiting' }),
  box('neck', 'Review', { role: 'neck', value: '2 / min' }),
  box('out', 'Done', { role: 'sink', value: '2 / min' }),
);
const bars = el(
  'deck-diagram',
  { layout: 'column', align: 'start' },
  el('dg-bar', { label: 'Storage', value: '52', emphasis: '' }),
  el('dg-bar', { label: 'Compute', value: '31' }),
  el('dg-bar', { label: 'Network', value: '12' }),
);
const loop = el(
  'deck-diagram',
  { layout: 'ring', link: 'arrow' },
  box('build'),
  box('measure'),
  box('learn', 'learn', { emphasis: '' }),
);
const crowd = el(
  'deck-diagram',
  { layout: 'grid' },
  el('dg-dot', { count: '90' }),
  el('dg-dot', { name: 'lit', count: '10', emphasis: '' }),
  el('dg-text', { for: 'lit', side: 'right', label: '10 leave' }),
);
const morph = el(
  'deck-diagram',
  {},
  el('dg-state', {}, el('dg-group', { layout: 'row' }, box('a'), box('b'))),
  el('dg-state', { step: '1' }, el('dg-group', { layout: 'column' }, box('a'), box('b'))),
);

describe('signatureOf', () => {
  it('reads a graph as its layouts, its marks and how its arrows fan out', () => {
    const s = signature(services(['Web', 'Gateway', 'Auth', 'Postgres']));
    expect(s.structure).toMatchObject({
      kind: 'deck-diagram',
      intent: null,
      layouts: ['layers'],
      marks: { box: 4 },
      links: 3,
      topology: 'fan-out',
      tokens: false,
      gates: false,
      morph: false,
    });
    expect(s.visual.tones).toEqual(['accent']);
    expect(s.time).toEqual({ clicks: 0, motifs: [] });
  });

  it('reads a ring chained by arrows as a loop', () => {
    expect(signature(loop).structure.topology).toBe('cycle');
  });

  it('reads an intent through what it compiles to · lanes, a gate, tokens, a click', () => {
    const s = signature(barrier);
    expect(s.structure.intent).toBe('barrier');
    expect(s.structure.layouts).toContain('lanes');
    expect(s.structure).toMatchObject({ gates: true, tokens: true });
    expect(s.time.clicks).toBeGreaterThan(0);
    expect(s.time.motifs).toEqual(expect.arrayContaining(['gate', 'tokens']));
  });

  it('reads a picture that reorganises as a morph, one click', () => {
    const s = signature(morph);
    expect(s.structure.morph).toBe(true);
    // The state's own click is the morph, not a mark revealed.
    expect(s.time).toEqual({ clicks: 1, motifs: ['morph'] });
  });
});

describe('topologyOf', () => {
  const e = (from: string, to: string, back = false) => ({ from, to, back });
  it('names a line, a fan each way, a loop and anything else', () => {
    expect(topologyOf([])).toBe('none');
    expect(topologyOf([e('a', 'b'), e('b', 'c')])).toBe('chain');
    expect(topologyOf([e('a', 'b'), e('a', 'c')])).toBe('fan-out');
    expect(topologyOf([e('a', 'c'), e('b', 'c')])).toBe('fan-in');
    expect(topologyOf([e('a', 'b'), e('b', 'a')])).toBe('cycle');
    expect(topologyOf([e('a', 'b'), e('b', 'c', true)])).toBe('cycle');
    expect(topologyOf([e('a', 'c'), e('b', 'c'), e('c', 'd'), e('c', 'e')])).toBe('graph');
  });
});

/** A drawing as `check` would measure it · cards at these lefts, in an 800 by 400 frame. */
function inkWith(lefts: number[], scale = 1): InkModel {
  const frame = { left: 0, top: 0, right: 800 * scale, bottom: 400 * scale };
  return {
    frame,
    allocated: frame,
    texts: [],
    shapes: lefts.map((left) => ({
      kind: 'rect' as const,
      box: {
        left: left * scale,
        top: 50 * scale,
        right: (left + 150) * scale,
        bottom: 350 * scale,
      },
      fill: [230, 230, 230] as const,
      accent: false,
      stroke: 0,
    })),
    motion: { endMs: 0, endless: false },
  };
}

describe('thumbOf', () => {
  it('is a grid over the frame, the heaviest cell 1', () => {
    const thumb = thumbOf(inkWith([20, 320]));
    expect(thumb).toHaveLength(DIVERSITY_LIMITS.thumbCols * DIVERSITY_LIMITS.thumbRows);
    expect(Math.max(...thumb)).toBe(1);
  });

  it('is the same for the same drawing at another size, and differs where the ink moves', () => {
    expect(thumbOf(inkWith([20, 320], 2))).toEqual(thumbOf(inkWith([20, 320])));
    expect(thumbOf(inkWith([20, 320]))).not.toEqual(thumbOf(inkWith([320, 620])));
  });

  it('gives a drawing that says nothing of itself a signature of its tag and its ink', () => {
    const s = signatureFromInk('deck-scene-cards', inkWith([20, 320]));
    expect(s.structure.kind).toBe('deck-scene-cards');
    expect(s.visual.thumb.length).toBeGreaterThan(0);
    expect(familyOf(s.structure)).toBe('deck-scene-cards');
  });
});

describe('distance', () => {
  it('is 0 between a drawing and itself, whatever the words, and symmetric', () => {
    const a = signature(services(['Web', 'Gateway', 'Auth', 'Postgres']));
    const b = signature(services(['Shop', 'Cart', 'Stock', 'Billing']));
    expect(distance(a, b).d).toBe(0);
    expect(structuralKey(a.structure)).toBe(structuralKey(b.structure));
    const c = signature(bars);
    expect(distance(a, c)).toEqual(distance(c, a));
  });

  it('weighs structure, then the look, then time · 0.5, 0.3, 0.2', () => {
    const d = distance(signature(barrier), signature(crowd));
    expect(d.d).toBeCloseTo(0.5 * d.structure + 0.3 * d.visual + 0.2 * d.time, 1);
    expect(d.d).toBeGreaterThan(DIVERSITY_LIMITS.repeated);
  });
});

const gallery = (roots: ElementLike[]): GalleryEntry[] =>
  roots.map((root, i) => ({ slide: i + 1, slideId: `s${i + 1}`, signature: signature(root) }));

describe('measureDiversity', () => {
  it('says a gallery of six clones is one look six times · every pair, one structure, one family', () => {
    const words = [
      'Web Gateway Auth Postgres',
      'Shop Cart Stock Billing',
      'App API Queue Worker',
      'CRM Sync Lake Report',
      'Mail Relay Spam Inbox',
      'Edge Cache Origin Disk',
    ];
    const report = measureDiversity(gallery(words.map((w) => services(w.split(' ')))));
    expect(report.illustrations).toBe(6);
    expect(report.structures).toBe(1);
    expect(report.repeated).toHaveLength(15);
    expect(report.largestFamily).toMatchObject({ name: 'layout:layers', count: 6, share: 1 });
    expect(report.targets.familyShare).toBe(false);
    const issues = repeatedLookIssues(report);
    expect(issues).toHaveLength(15);
    expect(issues.every((i) => i.code === 'ILL_REPEATED_LOOK' && i.severity === 'warning')).toBe(
      true,
    );
    expect(issues[0]!.measurement.slides).toHaveLength(2);
    expect(issues[0]!.fix.action).toBe('vary-the-look');
  });

  it('says nothing of a varied gallery · six drawings, six structures, no pair alike', () => {
    const report = measureDiversity(
      gallery([barrier, bottleneck, services(['a', 'b', 'c', 'd']), bars, loop, crowd]),
    );
    expect(report.repeated).toEqual([]);
    expect(repeatedLookIssues(report)).toEqual([]);
    expect(report.structures).toBe(6);
    expect(report.intents).toEqual(['barrier', 'bottleneck']);
    expect(report.matrix).toHaveLength(6);
    expect(report.matrix[0]![0]).toBe(0);
    expect(report.meanNearest).toBeGreaterThan(DIVERSITY_LIMITS.repeated);
  });
});
