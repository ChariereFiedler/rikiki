import { describe, expect, it } from 'vitest';
import {
  type ItemRecord,
  type SceneKind,
  heightIssue,
  lintScene,
  overflowIssue,
} from './scene-lint.js';
import { MAX_SCENE_HEIGHT } from './scene-layout.js';

const item = (fields: Partial<ItemRecord> = {}): ItemRecord => ({
  label: 'MCP',
  note: null,
  icon: null,
  tag: null,
  value: null,
  level: null,
  from: null,
  to: null,
  emphasis: false,
  ...fields,
});
const many = (count: number, fields: (index: number) => Partial<ItemRecord> = () => ({})) =>
  Array.from({ length: count }, (_, i) => item({ label: `Item ${i + 1}`, ...fields(i) }));
const codes = (kind: SceneKind, items: ItemRecord[], scene = {}) =>
  lintScene(kind, items, scene).map((issue) => issue.code);

describe('a well-written scene', () => {
  it.each<[SceneKind, ItemRecord[], object]>([
    [
      'cards',
      [
        item({ icon: 'target', note: 'One connector for every assistant.', emphasis: true }),
        item({ label: 'UCP', icon: 'cloud' }),
      ],
      {},
    ],
    ['steps', many(3, (i) => ({ note: `Step ${i + 1} comes first.` })), {}],
    [
      'flow',
      [
        item({ label: 'Catalogue' }),
        item({ label: 'Connector', emphasis: true }),
        item({ label: 'Answer' }),
      ],
      {},
    ],
    ['bars', many(3, (i) => ({ value: ['1,7', '12 500', '3.2'][i] })), {}],
    ['matrix', many(2, () => ({ level: 'prod test' })), { columns: 'France|US' }],
    [
      'ranges',
      [
        item({ from: '1', to: '5' }),
        item({ label: 'Open', from: '3' }),
        item({ label: 'Point', to: '10' }),
      ],
      {},
    ],
  ])('%s reports nothing', (kind, items, scene) => {
    expect(lintScene(kind, items, scene)).toEqual([]);
  });
});

describe('items the scene would drop or cannot build on', () => {
  it.each<[SceneKind, number]>([
    ['cards', 5],
    ['steps', 6],
    ['bars', 8],
    ['matrix', 6],
    ['ranges', 8],
  ])('%s draws %i items and names the one after', (kind, max) => {
    const make = (n: number) => many(n, () => ({ value: '1', level: 'prod', from: '1', to: '2' }));
    expect(codes(kind, make(max), { columns: 'A' })).not.toContain('SCENE_ITEMS_DROPPED');
    const issue = lintScene(kind, make(max + 1), { columns: 'A' }).find(
      (found) => found.code === 'SCENE_ITEMS_DROPPED',
    );
    expect(issue?.severity).toBe('error');
    expect(issue?.items).toEqual([`Item ${max + 1}`]);
  });

  it('counts a flow by role: the fifth source and the third outcome are cut', () => {
    const flow = [
      ...many(5, (i) => ({ label: `S${i + 1}` })),
      item({ label: 'Hub', emphasis: true }),
      ...many(3, (i) => ({ label: `O${i + 1}` })),
    ];
    const issue = lintScene('flow', flow).find((found) => found.code === 'SCENE_ITEMS_DROPPED');
    expect(issue?.items).toEqual(['S5', 'O3']);
  });

  it('refuses a comparison of one card, and a flow of one item', () => {
    expect(codes('cards', many(1))).toContain('SCENE_TOO_FEW_ITEMS');
    expect(
      codes(
        'bars',
        many(1, () => ({ value: '3' })),
      ),
    ).toContain('SCENE_TOO_FEW_ITEMS');
    expect(codes('flow', many(1))).toContain('SCENE_TOO_FEW_ITEMS');
    expect(codes('steps', many(1))).not.toContain('SCENE_TOO_FEW_ITEMS');
  });

  it('refuses an empty scene', () => {
    expect(codes('cards', [])).toEqual(['SCENE_TOO_FEW_ITEMS']);
  });

  it('names an item with no label by its position', () => {
    const issue = lintScene('cards', [item(), item({ label: '  ' })]).find(
      (found) => found.code === 'SCENE_ITEM_NO_LABEL',
    );
    expect(issue?.items).toEqual(['item 2']);
  });
});

describe('icons', () => {
  it('knows the glyphs of the closed set and no other', () => {
    expect(
      codes(
        'cards',
        many(2, () => ({ icon: 'target' })),
      ),
    ).toEqual([]);
    const issue = lintScene('cards', [
      item({ icon: 'rocket' }),
      item({ label: 'B', icon: 'cloud' }),
    ])[0];
    expect(issue).toMatchObject({ code: 'SCENE_ICON_UNKNOWN', severity: 'error', items: ['MCP'] });
  });
});

describe('bars', () => {
  it.each(['', 'ten', '1,2,3', null])('a bar whose value is %j is flagged', (value) => {
    const issue = lintScene('bars', [item({ value }), item({ label: 'B', value: '4' })])[0];
    expect(issue).toMatchObject({ code: 'SCENE_VALUE_INVALID', items: ['MCP'] });
  });

  it('reads the figure the way the bar does: comma, thousands space', () => {
    expect(
      codes(
        'bars',
        many(2, (i) => ({ value: i ? '1 200,5' : '0' })),
      ),
    ).toEqual([]);
  });
});

describe('ranges', () => {
  it.each([
    ['a word', { from: 'soon', to: '5' }],
    ['an end before the start', { from: '9', to: '2' }],
    ['a word as the end', { from: '1', to: 'later' }],
  ])('a row with %s is flagged', (_name, fields) => {
    expect(codes('ranges', [item(fields)])).toEqual(['SCENE_VALUE_INVALID']);
  });

  it('accepts a point, an open row, and an empty range', () => {
    expect(
      codes('ranges', [item({ to: '4' }), item({ from: '4' }), item({ from: '3', to: '3' })]),
    ).toEqual([]);
  });

  it('accepts a row with no bound at all: a duration still to be fixed, drawn dashed', () => {
    expect(codes('ranges', [item({ from: '1', to: '5' }), item({ label: 'To fix' })])).toEqual([]);
  });
});

describe('matrix', () => {
  const scene = { columns: 'France|US|UK' };
  const row = (level: string | null) => [item({ label: 'Row', level })];

  it('wants one known status per column', () => {
    expect(codes('matrix', row('prod pilot none'), scene)).toEqual([]);
    expect(codes('matrix', row('prod pilot'), scene)).toEqual(['SCENE_LEVEL_INVALID']);
    expect(codes('matrix', row('prod pilot none test'), scene)).toEqual(['SCENE_LEVEL_INVALID']);
    expect(codes('matrix', row('prod live none'), scene)).toEqual(['SCENE_LEVEL_INVALID']);
    expect(codes('matrix', row(null), scene)).toEqual(['SCENE_LEVEL_INVALID']);
  });

  it('checks the words alone when the scene names no column', () => {
    expect(codes('matrix', row('prod test'), {})).toEqual([]);
    expect(codes('matrix', row('prod live'), {})).toEqual(['SCENE_LEVEL_INVALID']);
  });
});

describe('writing rules, as warnings', () => {
  const warning = (kind: SceneKind, items: ItemRecord[]) =>
    lintScene(kind, items).filter((found) => found.severity === 'warning');

  it('flags a second emphasis, and names both', () => {
    const issue = warning(
      'cards',
      many(3, (i) => ({ emphasis: i < 2 })),
    )[0];
    expect(issue).toMatchObject({ code: 'SCENE_EMPHASIS_MANY', items: ['Item 1', 'Item 2'] });
    expect(
      warning(
        'cards',
        many(3, (i) => ({ emphasis: i === 0 })),
      ),
    ).toEqual([]);
  });

  it('counts emphasis per group in bars: the same series is put forward in every period', () => {
    const period = (note: string, emphasis: boolean[]) =>
      emphasis.map((on, i) => item({ label: `Bar ${i + 1}`, note, value: '1', emphasis: on }));
    const perGroup = [...period('2025', [true, false]), ...period('2026', [true, false])];
    expect(warning('bars', perGroup)).toEqual([]);

    const twoInOne = [...period('2025', [true, true]), ...period('2026', [true, false])];
    expect(warning('bars', twoInOne)[0]).toMatchObject({
      code: 'SCENE_EMPHASIS_MANY',
      items: ['Bar 1', 'Bar 2'],
    });
  });

  it('counts the whole scene when the bars carry no group note', () => {
    const bars = many(3, (i) => ({ value: '1', emphasis: i < 2 }));
    expect(warning('bars', bars)[0].code).toBe('SCENE_EMPHASIS_MANY');
  });

  it('lets a name of four words through and flags a label that is a sentence', () => {
    expect(
      warning(
        'cards',
        many(2, () => ({ label: 'Explore The Vault x' })),
      ),
    ).toEqual([]);
    const issue = warning(
      'cards',
      many(2, () => ({ label: 'Only one protocol is safe' })),
    )[0];
    expect(issue).toMatchObject({ code: 'SCENE_LABEL_LONG' });
  });

  it('flags a note of two sentences and not a decimal, an abbreviation or a question', () => {
    const issue = warning(
      'cards',
      many(2, () => ({ note: 'It runs. Then it stops.' })),
    )[0];
    expect(issue.code).toBe('SCENE_NOTE_LONG');
    expect(
      warning(
        'cards',
        many(2, () => ({ note: 'Radis à 2,78 € le kilo, soit 12.5 % de moins' })),
      ),
    ).toEqual([]);
    expect(
      warning(
        'cards',
        many(2, () => ({ note: 'Is it open? yes, since the 3.1 release.' })),
      ),
    ).toEqual([]);
  });

  it('keeps errors and warnings apart', () => {
    const found = lintScene('cards', [
      item({ icon: 'nope', emphasis: true }),
      item({ emphasis: true }),
    ]);
    expect(found.map((issue) => [issue.code, issue.severity])).toEqual([
      ['SCENE_ICON_UNKNOWN', 'error'],
      ['SCENE_EMPHASIS_MANY', 'warning'],
    ]);
  });
});

describe('attributes the scene does not read', () => {
  const ignored = (kind: SceneKind, items: ItemRecord[]) =>
    lintScene(kind, items).filter((issue) => issue.code === 'SCENE_ATTRIBUTE_IGNORED');

  it('names the attribute and the item, as a warning', () => {
    const [issue] = ignored('matrix', [
      item({ label: 'Row', level: 'prod', note: 'never shown', icon: 'target' }),
    ]);
    expect(issue.severity).toBe('warning');
    expect(issue.items).toEqual(['Row · note', 'Row · icon']);
  });

  it.each<[SceneKind, Partial<ItemRecord>]>([
    ['steps', { icon: 'target' }],
    ['ranges', { emphasis: true }],
    ['cards', { value: '3' }],
    ['bars', { icon: 'cloud' }],
    ['flow', { from: '1' }],
  ])('%s drops %j', (kind, fields) => {
    const rows = [item({ ...fields, value: kind === 'bars' ? '1' : (fields.value ?? null) })];
    expect(ignored(kind, rows)).toHaveLength(1);
  });

  it('is quiet about the attributes the scene reads', () => {
    expect(
      ignored('cards', [item({ icon: 'target', note: 'n', tag: 't', emphasis: true })]),
    ).toEqual([]);
    expect(ignored('ranges', [item({ note: 'n', tag: 't', from: '1', to: '2' })])).toEqual([]);
  });
});

describe('lanes', () => {
  const lanes = many(2, () => ({ icon: 'code' }));

  it('reports nothing for a well-written one, defaults and bounds included', () => {
    expect(codes('lanes', lanes)).toEqual([]);
    expect(codes('lanes', lanes, { passed: '0', blocked: '8' })).toEqual([]);
    expect(codes('lanes', lanes, { passed: '', blocked: null })).toEqual([]);
  });

  it.each([
    ['three'],
    ['-1'],
    ['9'],
    ['2.5'],
  ])('names a token count of %j and says the default was drawn', (bad) => {
    const issue = lintScene('lanes', lanes, { passed: '3', blocked: bad })[0];
    expect(issue).toMatchObject({
      code: 'SCENE_VALUE_INVALID',
      severity: 'error',
      items: ['blocked'],
    });
    expect(issue.message).toMatch(/default/);
  });

  it('names both counts when both are wrong', () => {
    const issue = lintScene('lanes', lanes, { passed: 'a', blocked: 'b' })[0];
    expect(issue.items).toEqual(['passed', 'blocked']);
  });

  it('wants two to five lanes', () => {
    expect(codes('lanes', many(1))).toContain('SCENE_TOO_FEW_ITEMS');
    expect(codes('lanes', many(6))).toContain('SCENE_ITEMS_DROPPED');
    expect(codes('lanes', many(5))).toEqual([]);
  });

  it('flags what a lane does not read: a value, a level, an emphasis', () => {
    const issue = lintScene('lanes', [
      item({ value: '1', emphasis: true }),
      item({ label: 'B', level: 'prod' }),
    ]).find((found) => found.code === 'SCENE_ATTRIBUTE_IGNORED');
    expect(issue?.items).toEqual(['MCP · value', 'MCP · emphasis', 'B · level']);
  });
});

describe('units', () => {
  const panel = (value: string | null, over: Partial<ItemRecord> = {}) =>
    item({ label: 'People', value, ...over });
  const grid = (...values: (string | null)[]) => values.map((value) => panel(value));
  const issues = (items: ItemRecord[], scene = {}) => lintScene('units', items, scene);

  it('reports nothing for a well-written one, the default total included', () => {
    expect(issues(grid('200', '0'), { total: '200' })).toEqual([]);
    expect(issues(grid('40'))).toEqual([]);
    expect(issues(grid('360'), { total: '360', columns: '24' })).toEqual([]);
  });

  it.each([['0'], ['401'], ['2.5'], ['many'], ['-5']])('names a total of %j', (total) => {
    const issue = issues(grid('3'), { total })[0];
    expect(issue).toMatchObject({
      code: 'SCENE_VALUE_INVALID',
      severity: 'error',
      items: ['total'],
    });
  });

  it('names columns that are not a whole number from 1 to 40', () => {
    expect(issues(grid('3'), { columns: '41' })[0]?.items).toEqual(['columns']);
    expect(issues(grid('3'), { columns: 'wide' })[0]?.items).toEqual(['columns']);
  });

  it.each([
    [null],
    [''],
    ['ten'],
    ['101'],
    ['-1'],
    ['3.5'],
  ])('names a panel whose value is %j, against a total of 100', (value) => {
    const issue = issues([panel('50'), panel(value, { label: 'Odd' })], { total: '100' })[0];
    expect(issue).toMatchObject({ code: 'SCENE_VALUE_INVALID', items: ['Odd'] });
  });

  it('accepts a panel with nothing lit, which is the point of a switched-off grid', () => {
    expect(issues(grid('200', '0'), { total: '200' })).toEqual([]);
  });

  it('refuses cells too small to count: 400 of them in three panels at 40 columns', () => {
    const dense = issues(grid('10', '20', '30'), { total: '400', columns: '40' });
    expect(dense.map((issue) => issue.code)).toContain('SCENE_GRID_TOO_DENSE');
    expect(dense.find((issue) => issue.code === 'SCENE_GRID_TOO_DENSE')?.items[0]).toMatch(
      /400 cells/,
    );
  });

  it('does not call a grid dense when the cells are readable', () => {
    expect(issues(grid('10', '20'), { total: '400' }).map((issue) => issue.code)).not.toContain(
      'SCENE_GRID_TOO_DENSE',
    );
  });

  it('wants one to three panels', () => {
    expect(codes('units', [])).toContain('SCENE_TOO_FEW_ITEMS');
    expect(
      codes(
        'units',
        many(4, () => ({ value: '1' })),
        { total: '10' },
      ),
    ).toContain('SCENE_ITEMS_DROPPED');
  });

  it('flags what a grid does not read: a tag, a level, a from', () => {
    const found = issues([panel('1', { tag: 'x', from: '2' })], { total: '10' }).find(
      (issue) => issue.code === 'SCENE_ATTRIBUTE_IGNORED',
    );
    expect(found?.items).toEqual(['People · tag', 'People · from']);
  });
});

describe('bars: a scale and groups that say what the picture says', () => {
  const bar = (note: string, value = '10') => item({ label: 'B', note, value });

  it('flags a value past max, which the bar cannot show at its size', () => {
    const found = lintScene('bars', [bar('', '760'), bar('', '90')], { max: '500' }).find(
      (issue) => issue.code === 'SCENE_VALUE_CLIPPED',
    );
    expect(found).toMatchObject({ severity: 'error', items: ['B'] });
  });

  it.each([
    {},
    { max: '10' },
    { max: 'ten' },
  ])('flags a negative value on explicit or automatic scales: %j', (scene) => {
    expect(codes('bars', [bar('', '-3'), bar('', '8')], scene)).toContain('SCENE_VALUE_CLIPPED');
  });

  it('is quiet when every value is inside the scale, and with no max at all', () => {
    expect(codes('bars', [bar('', '9'), bar('', '10')], { max: '10' })).not.toContain(
      'SCENE_VALUE_CLIPPED',
    );
    expect(codes('bars', [bar('', '760'), bar('', '90')])).not.toContain('SCENE_VALUE_CLIPPED');
  });

  it.each([['abc'], ['0'], ['-5']])('flags max="%s" as unusable', (max) => {
    const found = lintScene('bars', [bar('', '1'), bar('', '2')], { max }).find(
      (issue) => issue.code === 'SCENE_ATTRIBUTE_INVALID',
    );
    expect(found?.items).toEqual(['max']);
  });

  it('flags a height that is not a positive number', () => {
    const found = lintScene('bars', [bar('', '1'), bar('', '2')], { height: 'tall' }).find(
      (issue) => issue.code === 'SCENE_ATTRIBUTE_INVALID',
    );
    expect(found?.items).toEqual(['height']);
  });

  it('flags a note that comes back after another, which splits its group', () => {
    const quarters = [bar('2025'), bar('2026'), bar('2025'), bar('2026')];
    const found = lintScene('bars', quarters).find((issue) => issue.code === 'SCENE_GROUP_SPLIT');
    expect(found).toMatchObject({ severity: 'warning', items: ['2025', '2026'] });
  });

  it('is quiet when a note keeps its items together, or there is no note', () => {
    expect(codes('bars', [bar('Q1'), bar('Q1'), bar('Q2'), bar('Q2')])).not.toContain(
      'SCENE_GROUP_SPLIT',
    );
    expect(codes('bars', [bar(''), bar(''), bar('')])).not.toContain('SCENE_GROUP_SPLIT');
  });
});

describe('ranges: a scale the rows fit', () => {
  const row = (from: string, to: string) => item({ label: 'R', from, to });

  it('flags a bound past the scale', () => {
    const found = lintScene('ranges', [row('0', '14')], { scale: '12' }).find(
      (issue) => issue.code === 'SCENE_VALUE_CLIPPED',
    );
    expect(found).toMatchObject({ severity: 'error', items: ['R'] });
  });

  it.each([
    {},
    { scale: '12' },
    { scale: 'ten' },
  ])('flags negative bounds on explicit or automatic scales: %j', (scene) => {
    expect(codes('ranges', [row('-3', '2')], scene)).toContain('SCENE_VALUE_CLIPPED');
    expect(codes('ranges', [row('', '-3')], scene)).toContain('SCENE_VALUE_CLIPPED');
  });

  it('flags a scale that is not a positive number', () => {
    const found = lintScene('ranges', [row('0', '3')], { scale: 'ten' }).find(
      (issue) => issue.code === 'SCENE_ATTRIBUTE_INVALID',
    );
    expect(found?.items).toEqual(['scale']);
  });

  it('is quiet for bounds inside the scale, and with no scale written', () => {
    expect(codes('ranges', [row('0', '12')], { scale: '12' })).not.toContain('SCENE_VALUE_CLIPPED');
    expect(codes('ranges', [row('0', '99')])).not.toContain('SCENE_VALUE_CLIPPED');
  });
});

describe('overflowIssue', () => {
  it('names each field and its measure, so the fix is the field’s', () => {
    const issue = overflowIssue('bars', [
      { item: 'Before', field: 'figure', text: '760 ms', measured: 248, budget: 232, size: 39 },
      { item: 'After', field: 'label', text: 'A very long label' },
    ]);
    expect(issue).toMatchObject({ code: 'SCENE_TEXT_TOO_LONG', severity: 'error' });
    expect(issue?.items).toEqual(['Before · figure', 'After · label']);
    expect(issue?.message).toMatch(/Before · figure needs 248 of 232 units/);
    expect(issue?.fields).toHaveLength(2);
  });

  it('is nothing when nothing overflowed', () => {
    expect(overflowIssue('cards', [])).toBeNull();
  });
});

describe('heightIssue', () => {
  it('is quiet for a drawing a slide holds, the limit included', () => {
    expect(heightIssue('steps', 608, 4)).toBeNull();
    expect(heightIssue('matrix', MAX_SCENE_HEIGHT, 3)).toBeNull();
  });

  it('names the scene, the item count and the height of one that is too tall', () => {
    const issue = heightIssue('matrix', 1136, 6);
    expect(issue).toMatchObject({ code: 'SCENE_TOO_TALL', severity: 'error' });
    expect(issue?.items).toEqual(['6 items, 1136 units tall']);
    expect(issue?.message).toMatch(/matrix/);
    expect(issue?.message).toMatch(/split the slide/);
  });

  it('says "1 item" in the singular', () => {
    expect(heightIssue('units', 900, 1)?.items).toEqual(['1 item, 900 units tall']);
  });
});
