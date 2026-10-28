import { describe, expect, it } from 'vitest';
import { chartRow } from './chart-words.js';
import {
  COLUMN_FIGURE_SECONDS,
  COLUMN_GROW_SECONDS,
  COLUMN_STAGGER_SECONDS,
  niceTop,
} from './charts.js';
import { choreograph } from './choreography.js';
import { type LItem, type Meter, layoutDiagram } from './layout.js';
import { type LPiece, actSeconds } from './marks.js';
import { type DgCode, type ElementLike, parseDiagram } from './model.js';
import { planStory, storyIds } from './story.js';

// ════════════════════════════════════════════════════════════════
// The charts · a pie and columns. What is promised: each is written as lines of
// words then figures, placed with no coordinate, draws the parts in proportion
// to what was written (a ring that makes a whole, columns on one scale), brings
// one part forward when asked, says its figures where there is room and a scale
// where there is not, acts on its beat in a story · and what does not read is
// named (DG_CHART_DATA, DG_VALUE_RANGE).
// ════════════════════════════════════════════════════════════════

const meter: Meter = (size) => (text) => text.length * size * 0.55;

function el(localName: string, attrs: Record<string, string> = {}): ElementLike {
  return {
    localName,
    children: [],
    getAttribute: (name) => attrs[name] ?? null,
    hasAttribute: (name) => name in attrs,
    getAttributeNames: () => Object.keys(attrs),
  };
}

const diagram = (children: ElementLike[], attrs: Record<string, string> = {}): ElementLike => ({
  ...el('deck-diagram', attrs),
  children,
});

const lay = (children: ElementLike[], attrs: Record<string, string> = {}) => {
  const parsed = parseDiagram(diagram(children, attrs));
  return { parsed, drawn: layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 } }) };
};

const piece = <K extends LPiece['kind']>(items: LItem[], kind: K) =>
  items.find((i): i is Extract<LPiece, { kind: K }> => i.kind === kind)!;

const codes = (children: ElementLike[]): DgCode[] =>
  parseDiagram(diagram(children)).issues.map((i) => i.code as DgCode);

const TICKETS = '3 grands comptes 62\n41 PME 23\n212 indépendants 15';

describe('a line of a chart', () => {
  it('is its words, then the figures at its end · a number inside the words stays a word', () => {
    expect(chartRow('3 grands comptes 62')).toEqual({ label: '3 grands comptes', figures: ['62'] });
    expect(chartRow('T3 38 79')).toEqual({ label: 'T3', figures: ['38', '79'] });
    expect(chartRow('marge 2025 120', 1)).toEqual({ label: 'marge 2025', figures: ['120'] });
    expect(chartRow('énergie −31', 1)).toEqual({ label: 'énergie', figures: ['−31'] });
    expect(chartRow('latence 72,5')).toEqual({ label: 'latence', figures: ['72,5'] });
  });
});

describe('a pie', () => {
  const { drawn, parsed } = lay([
    el('dg-pie', {
      name: 'tickets',
      slices: TICKETS,
      unit: '%',
      value: '62 %',
      note: 'des tickets',
      focus: '3 grands comptes',
    }),
  ]);
  const pie = piece(drawn.items, 'pie');

  it('parses without an issue', () => {
    expect(parsed.issues).toEqual([]);
  });

  it('draws its parts in proportion, as one whole from the top, clockwise', () => {
    expect(pie.slices.map((s) => +(s.to - s.from).toFixed(2))).toEqual([0.62, 0.23, 0.15]);
    expect(pie.slices[0]!.from).toBe(0);
    expect(pie.slices.at(-1)!.to).toBeCloseTo(1);
  });

  it('brings forward the part it names, the others in shades darkest first', () => {
    expect(pie.slices.map((s) => s.focus)).toEqual([true, false, false]);
    expect(pie.slices.filter((s) => !s.focus).map((s) => s.shade)).toEqual([0, 1]);
  });

  it('names each part with its figure, and puts the figure of the whole in its hole', () => {
    expect(pie.legend.map((l) => [l.label.lines[0], l.figure.lines[0]])).toEqual([
      ['3 grands comptes', '62 %'],
      ['41 PME', '23 %'],
      ['212 indépendants', '15 %'],
    ]);
    expect(pie.value!.x).toBeCloseTo(pie.centre.x);
    expect(pie.value!.text.lines).toEqual(['62 %']);
    expect(pie.note!.text.y).toBeGreaterThan(pie.value!.text.y);
  });

  it('keeps its legend clear of its ring', () => {
    const ringRight = pie.centre.x + pie.r + pie.ring / 2;
    for (const row of pie.legend) expect(row.swatch.x).toBeGreaterThan(ringRight);
  });

  it('sweeps its ring, then shows the figure of the whole', () => {
    expect(actSeconds(pie)).toBeCloseTo(1.6 + 0.35);
  });
});

describe('columns', () => {
  const DAYS = 'lun. 31\nmar. 14\nmer. 11\njeu. 12';

  it('stand on one baseline, each as tall as its figure on one scale', () => {
    const { drawn, parsed } = lay([el('dg-columns', { name: 'jours', columns: DAYS })]);
    const cols = piece(drawn.items, 'columns');
    expect(parsed.issues).toEqual([]);
    const baseline = cols.plot.y + cols.plot.h;
    for (const bar of cols.bars) expect(bar.rect.y + bar.rect.h).toBeCloseTo(baseline);
    const [lun, mar] = cols.bars;
    expect(lun!.rect.h / mar!.rect.h).toBeCloseTo(31 / 14);
  });

  it('say every figure over its column when there is room, and need no scale then', () => {
    const { drawn } = lay([el('dg-columns', { name: 'jours', columns: DAYS, unit: 'inc.' })]);
    const cols = piece(drawn.items, 'columns');
    expect(cols.bars.map((b) => b.figure?.text.lines[0])).toEqual([
      '31 inc.',
      '14 inc.',
      '11 inc.',
      '12 inc.',
    ]);
    expect(cols.grid).toEqual([]);
  });

  it('in several series, name them, draw a scale, and say the figures of the column brought forward only', () => {
    const { drawn, parsed } = lay([
      el('dg-columns', {
        name: 'ventes',
        series: '2025\n2026',
        columns: 'T1 42 51\nT2 47 58\nT3 38 79\nT4 55 64',
        focus: 'T3',
      }),
    ]);
    const cols = piece(drawn.items, 'columns');
    expect(parsed.issues).toEqual([]);
    expect(cols.series).toBe(2);
    expect(cols.legend.map((l) => l.text.lines[0])).toEqual(['2025', '2026']);
    expect(cols.grid.length).toBeGreaterThan(0);
    expect(cols.focus).toBe(2);
    expect(cols.bars.filter((b) => b.figure).map((b) => b.column)).toEqual([2, 2]);
  });

  it('round the top of their scale up to a round figure, or take the max written', () => {
    expect(niceTop(31)).toBe(40);
    expect(niceTop(79)).toBe(80);
    expect(niceTop(340)).toBe(400);
    expect(niceTop(0)).toBe(1);
    const { drawn } = lay([el('dg-columns', { name: 'l', columns: DAYS, max: '62' })]);
    const cols = piece(drawn.items, 'columns');
    expect(cols.bars[0]!.rect.h / cols.plot.h).toBeCloseTo(31 / 62);
  });

  it('draw their threshold across the plot at its height, its figure outside it', () => {
    const { drawn } = lay([
      el('dg-columns', { name: 'j', columns: DAYS, threshold: '20', max: '40' }),
    ]);
    const cols = piece(drawn.items, 'columns');
    expect(cols.threshold!.y).toBeCloseTo(cols.plot.y + cols.plot.h / 2);
    expect(cols.threshold!.text.x).toBeGreaterThan(cols.plot.x + cols.plot.w);
  });

  it('grow one after the other · their act lasts with how many there are', () => {
    const { drawn } = lay([el('dg-columns', { name: 'j', columns: DAYS })]);
    expect(actSeconds(piece(drawn.items, 'columns'))).toBeCloseTo(
      COLUMN_GROW_SECONDS + 3 * COLUMN_STAGGER_SECONDS + COLUMN_FIGURE_SECONDS,
    );
  });
});

describe('the charts in a story', () => {
  it('a pie of the steady beat is swept on its beat, after it came in', () => {
    const { drawn, parsed } = lay(
      [
        el('dg-pie', { name: 'p', slices: TICKETS, beat: 'steady' }),
        el('dg-box', { name: 'b', label: 'plan', proof: '−40 %', beat: 'proof' }),
      ],
      { play: 'enter' },
    );
    expect(parsed.issues).toEqual([]);
    const plan = planStory(drawn, choreograph(drawn, drawn.tree), {});
    const i = drawn.items.findIndex((item) => item.kind === 'pie');
    const sweep = plan.timing.get(storyIds.act(i))!;
    expect(sweep.duration).toBeGreaterThan(0);
    expect(plan.script.beats.find((b) => b.mark === 'p')).toMatchObject({ kind: 'act' });
  });
});

describe('what a chart needs to read', () => {
  const pie = (slices: string, extra: Record<string, string> = {}) =>
    codes([el('dg-pie', { name: 'p', slices, ...extra })]);
  const columns = (attrs: Record<string, string>) =>
    codes([el('dg-columns', { name: 'c', ...attrs })]);

  it('a pie of one part, or of seven, does not read as parts of a whole', () => {
    expect(pie('tout 100')).toContain('DG_CHART_DATA');
    expect(pie('a 1\nb 1\nc 1\nd 1\ne 1\nf 1\ng 1')).toContain('DG_CHART_DATA');
  });

  it('a part needs one figure above 0, and words before it', () => {
    expect(pie('a\nb 50')).toContain('DG_CHART_DATA');
    expect(pie('a 0\nb 50')).toContain('DG_CHART_DATA');
    expect(pie('40\nb 60')).toContain('DG_CHART_DATA');
  });

  it('what is brought forward is one of its own', () => {
    expect(pie(TICKETS, { focus: 'PME' })).toContain('DG_CHART_DATA');
    expect(columns({ columns: 'a 1\nb 2', focus: 'c' })).toContain('DG_CHART_DATA');
  });

  it('a column has one figure per series, and there are three series at most', () => {
    expect(columns({ columns: 'a 1\nb 2 3', series: 'x\ny' })).toContain('DG_CHART_DATA');
    expect(columns({ columns: 'a 1 2 3 4\nb 1 2 3 4', series: 'w\nx\ny\nz' })).toContain(
      'DG_CHART_DATA',
    );
    expect(columns({ columns: 'a 1' })).toContain('DG_CHART_DATA');
  });

  it('a figure above the max written, or a threshold outside it, is said', () => {
    expect(columns({ columns: 'a 10\nb 50', max: '40' })).toContain('DG_VALUE_RANGE');
    expect(columns({ columns: 'a 10\nb 20', max: '40', threshold: '45' })).toContain(
      'DG_VALUE_RANGE',
    );
    expect(columns({ columns: 'a 10\nb 20', threshold: 'haut' })).toContain('DG_VALUE_INVALID');
  });

  it('checks stacked column totals against max, while grouped series keep their own scale', () => {
    const data = { columns: 'a 60 60\nb 40 50', series: 'x\ny', max: '100' };
    expect(columns({ ...data, stacked: '' })).toContain('DG_VALUE_RANGE');
    expect(columns({ ...data, stacked: 'false' })).not.toContain('DG_VALUE_RANGE');
    expect(columns({ ...data, columns: 'a 60 40\nb 40 50', stacked: '' })).not.toContain(
      'DG_VALUE_RANGE',
    );
  });

  it('a part or a column below 0 is said · only a step of a waterfall goes down', () => {
    expect(pie('a −10\nb 50')).toContain('DG_CHART_DATA');
    expect(columns({ columns: 'a −10\nb 20' })).toContain('DG_CHART_DATA');
  });

  it('a pie is a ring or a full disc, nothing else', () => {
    expect(pie(TICKETS, { shape: 'pie' })).toEqual([]);
    expect(pie(TICKETS, { shape: 'donut' })).toContain('DG_VALUE_INVALID');
  });

  it('a waterfall starts from a total with no sign, and never walks below 0', () => {
    const waterfall = (steps: string, extra: Record<string, string> = {}) =>
      codes([el('dg-waterfall', { name: 'w', steps, ...extra })]);
    expect(waterfall('2025 100\nprix +12\ncoûts −30', { total: '2026' })).toEqual([]);
    expect(waterfall('2025 +100\nprix +12')).toContain('DG_CHART_DATA');
    expect(waterfall('2025 10\nperte −30')).toContain('DG_CHART_DATA');
    expect(waterfall('2025 100')).toContain('DG_CHART_DATA');
    expect(waterfall('2025 100\nprix +12', { focus: '2026', total: '2026' })).toEqual([]);
    expect(waterfall('2025 100\nprix +12', { focus: 'coûts' })).toContain('DG_CHART_DATA');
  });

  it('a well-written chart says nothing', () => {
    expect(pie(TICKETS, { focus: '41 PME' })).toEqual([]);
    expect(columns({ columns: 'a 10\nb 20', series: 'x', threshold: '15', max: '40' })).toEqual([]);
  });
});

describe('a pie drawn as a full disc', () => {
  const { drawn } = lay([
    el('dg-pie', { name: 'p', slices: TICKETS, shape: 'pie', value: '1 240', note: 'tickets' }),
  ]);
  const pie = piece(drawn.items, 'pie');

  it('is a ring as thick as its radius · no hole', () => {
    expect(pie.ring).toBeCloseTo(2 * pie.r);
  });

  it('heads its legend with the figure of the whole, which has no hole to sit in', () => {
    const firstRow = pie.legend[0]!;
    expect(pie.value!.text.y).toBeLessThan(firstRow.label.y);
    expect(pie.value!.x).toBeGreaterThan(pie.centre.x + pie.ring);
  });
});

describe('stacked columns', () => {
  const { drawn, parsed } = lay([
    el('dg-columns', {
      name: 'mix',
      series: 'abonnement\nservices',
      columns: 'T1 30 10\nT2 34 16\nT3 40 30',
      stacked: '',
      focus: 'T3',
    }),
  ]);
  const cols = piece(drawn.items, 'columns');

  it('stand their series on one another, one column each', () => {
    expect(parsed.issues).toEqual([]);
    expect(cols.stacked).toBe(true);
    const [low, high] = cols.bars.filter((b) => b.column === 0);
    expect(high!.rect.y + high!.rect.h).toBeCloseTo(low!.rect.y);
    expect(high!.rect.x).toBeCloseTo(low!.rect.x);
  });

  it('scale on their totals, and say the total over each column', () => {
    const t3 = cols.bars.filter((b) => b.column === 2);
    const height = t3.reduce((sum, b) => sum + b.rect.h, 0);
    const t1 = cols.bars.filter((b) => b.column === 0).reduce((sum, b) => sum + b.rect.h, 0);
    expect(height / t1).toBeCloseTo(70 / 40);
    expect(cols.bars.flatMap((b) => (b.figure ? [b.figure.text.lines[0]] : []))).toEqual([
      '40',
      '50',
      '70',
    ]);
  });
});

describe('a waterfall', () => {
  const { drawn, parsed } = lay([
    el('dg-waterfall', {
      name: 'marge',
      steps: 'marge 2025 120\nprix +18\nvolume +9\nénergie −31\nsalaires −12',
      total: 'marge 2026',
      unit: 'k€',
      focus: 'énergie',
    }),
  ]);
  const fall = piece(drawn.items, 'waterfall');
  const scale = (b: { rect: { h: number } }) => b.rect.h;

  it('walks from a total, step by step, to the next one', () => {
    expect(parsed.issues).toEqual([]);
    expect(fall.bars.map((b) => b.kind)).toEqual(['total', 'up', 'up', 'down', 'down', 'total']);
    const [start, , , , , end] = fall.bars;
    expect(scale(end!) / scale(start!)).toBeCloseTo(104 / 120);
  });

  it('floats each step from the level reached, and links it to the next', () => {
    const [start, prix] = fall.bars;
    expect(prix!.rect.y + prix!.rect.h).toBeCloseTo(start!.rect.y);
    expect(fall.links).toHaveLength(fall.bars.length - 1);
    expect(fall.links[0]!.y).toBeCloseTo(start!.rect.y);
  });

  it('says each step with its sign, a true minus, and the closing total it computes', () => {
    expect(fall.bars.map((b) => b.figure?.text.lines[0])).toEqual([
      '120 k€',
      '+18 k€',
      '+9 k€',
      '−31 k€',
      '−12 k€',
      '104 k€',
    ]);
  });

  it('takes its steps one after the other', () => {
    expect(actSeconds(fall)).toBeCloseTo(0.45 + 5 * 0.32 + 0.25);
  });
});
