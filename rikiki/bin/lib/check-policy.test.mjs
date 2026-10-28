import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { configFiles, loadCheckConfig, sectionProblems } from './check-config.mjs';
import {
  applyPolicy,
  buildPolicy,
  decide,
  exceptionFindings,
  globPattern,
  optionFindings,
  readExceptions,
  resolveOverrides,
  selectionFindings,
} from './check-policy.mjs';
import { BUILTIN_RULES, RESERVED_NAMESPACES, isAlwaysOn, nameOf } from './check-registry.mjs';
import { isWithin } from './element-path.mjs';

// ════════════════════════════════════════════════════════════════
// A deck's check policy · which findings it keeps, at which severity, where,
// and what the policy itself gets wrong. Pure: no browser.
// ════════════════════════════════════════════════════════════════

const layer = (check, file = '/repo/rikiki.config.json') => ({ file, check });
const policyOf = (check, cli = {}) => buildPolicy({ layers: check ? [layer(check)] : [], cli });
const known = BUILTIN_RULES.map((r) => r.code);

/** Three slides · a cover, a feature tagged as an annex, a feature with a drawing. */
const OUTLINE = [
  { index: 1, id: 'intro', tag: 'deck-cover', tags: [], path: 'deck-root > deck-cover#intro', steps: 0 },
  { index: 2, id: 'annexe-1', tag: 'deck-feature', tags: ['annexe'], path: 'deck-root > deck-feature#annexe-1', steps: 0 },
  { index: 3, id: 'flux', tag: 'deck-feature', tags: [], path: 'deck-root > deck-feature#flux', steps: 0 },
];
const resolveSlides = (selector) => {
  const map = { '2': [2], 'annexe-1': [2], '2-3': [2, 3], intro: [1] };
  return map[selector] ?? null;
};
const placed = (policy, { elementPaths = {}, carriers = [] } = {}) => ({
  outline: OUTLINE,
  overrides: resolveOverrides(policy, { outline: OUTLINE, resolveSlides, elementPaths }),
  exceptions: readExceptions(carriers, OUTLINE),
});
const finding = (code, severity, extra = {}) => ({ code, severity, message: code, ...extra });

describe('the registry', () => {
  it('knows every family of rule, each code once, and names it both ways', () => {
    expect(new Set(known).size).toBe(known.length);
    for (const code of ['TEXT_TOO_SMALL', 'ILL_OFF_CENTRE', 'ILL_REPEATED_LOOK', 'ILL_GENERIC', 'ILL_FLAT_PAINT', 'ILL_MODEL_REPEAT', 'SCENE_TEXT_TOO_LONG', 'DG_NO_FIT', 'INT_FEEDBACK_OPEN', 'QUALITY_VISUAL_EVIDENCE', 'NARRATIVE_CALL_TO_ACTION', 'SLIDE_TOP_HEAVY'])
      expect(known).toContain(code);
    expect(nameOf('TEXT_TOO_SMALL')).toBe('text-too-small');
  });

  it('knows every code the check writes by itself · a new one added there and not here fails', () => {
    const here = new URL('.', import.meta.url);
    const sources = ['check.mjs', 'check-plugins.mjs', 'check-policy.mjs', 'quality.mjs', 'narrative.mjs'];
    const written = sources.flatMap((file) => [
      ...readFileSync(new URL(file, here), 'utf8').matchAll(/(?:diagnostic\(|failure\([^,]+,\s*|code:\s*|finding\()\s*'([A-Z][A-Z0-9]*_[A-Z0-9_]+)'/g),
    ].map((m) => m[1]));
    expect(written.length).toBeGreaterThan(30);
    expect([...new Set(written)].filter((code) => !known.includes(code))).toEqual([]);
  });

  it('keeps the findings about the run always on, and reserves their families and the built-in ones', () => {
    expect(isAlwaysOn('PAGE_ERROR')).toBe(true);
    expect(isAlwaysOn('CHECK_ANYTHING')).toBe(true);
    expect(isAlwaysOn('TEXT_TOO_SMALL')).toBe(false);
    for (const family of ['TEXT', 'ILL', 'DG', 'CHECK', 'CONTENT']) expect(RESERVED_NAMESPACES).toContain(family);
  });
});

describe('a rule list', () => {
  it('reads a name, a code and a glob alike', () => {
    expect(globPattern('text-too-small').test('TEXT_TOO_SMALL')).toBe(true);
    expect(globPattern('ILL_*').test('ILL_WORDY')).toBe(true);
    expect(globPattern('ill-*').test('ILLUSTRATION')).toBe(false);
    expect(globPattern('svg-text-*').test('SVG_TEXT_ESCAPES')).toBe(true);
  });

  it('drops one rule and keeps the others · the list applies on what is inherited', () => {
    const policy = policyOf({ checks: '-text-last-line-orphan' });
    expect(decide(policy, 'TEXT_LAST_LINE_ORPHAN', 'warning').kept).toBe(false);
    expect(decide(policy, 'CONTENT_CLIPPED', 'error').kept).toBe(true);
  });

  it('drops everything with -*, then takes back what it names, in order', () => {
    const policy = policyOf({ checks: '-*,content-*' });
    expect(decide(policy, 'CONTENT_CLIPPED', 'error').kept).toBe(true);
    expect(decide(policy, 'TEXT_TOO_SMALL', 'warning').kept).toBe(false);
  });

  it('lets the command line speak after the files', () => {
    const policy = policyOf({ checks: '-ill-*' }, { checks: 'ill-escape' });
    expect(decide(policy, 'ILL_ESCAPE', 'error').kept).toBe(true);
    expect(decide(policy, 'ILL_WORDY', 'warning').kept).toBe(false);
  });

  it('lets the command line take back a rule a file turned off by its severity · layer by layer', () => {
    const parent = layer({ severity: { 'text-too-small': 'off' } }, '/repo/rikiki.config.json');
    const policy = buildPolicy({ layers: [parent], cli: { checks: 'text-too-small' } });
    expect(decide(policy, 'TEXT_TOO_SMALL', 'warning').kept).toBe(true);
    // And a nearer file's checks over an outer file's severity, the same way.
    const nearer = buildPolicy({ layers: [parent, layer({ checks: 'text-too-small' }, '/repo/q3/rikiki.config.json')] });
    expect(decide(nearer, 'TEXT_TOO_SMALL', 'warning').kept).toBe(true);
    // Within one layer, severity still speaks after checks.
    expect(decide(policyOf({ checks: 'text-too-small', severity: { 'text-too-small': 'off' } }), 'TEXT_TOO_SMALL', 'warning').kept).toBe(false);
  });

  it('refuses a malformed name, from the command line before any browser', () => {
    expect(() => policyOf(undefined, { checks: 'text too small' })).toThrow(/not a rule name/);
    expect(() => policyOf(undefined, { severity: { 'a b': 'error' } })).toThrow(/not a rule name/);
  });
});

describe('severity', () => {
  it('raises, lowers and silences a rule', () => {
    const policy = policyOf({ severity: { 'ill-wordy': 'error', 'content-clipped': 'warning', 'slide-dense': 'off' } });
    expect(decide(policy, 'ILL_WORDY', 'warning').severity).toBe('error');
    expect(decide(policy, 'CONTENT_CLIPPED', 'error').severity).toBe('warning');
    expect(decide(policy, 'SLIDE_DENSE', 'warning').kept).toBe(false);
  });

  it('raises a warning to an error last (warningsAsErrors), and says so', () => {
    const policy = policyOf({ warningsAsErrors: 'svg-text-*' });
    expect(decide(policy, 'SVG_TEXT_OVERLAP', 'warning')).toMatchObject({ kept: true, severity: 'error', promoted: true });
    expect(decide(policy, 'TEXT_TOO_SMALL', 'warning').severity).toBe('warning');
  });

  it('reads warningsAsErrors in order, the last match deciding · an exclusion holds', () => {
    const cli = policyOf(undefined, { warningsAsErrors: '*,-text-too-small' });
    expect(decide(cli, 'TEXT_TOO_SMALL', 'warning')).toEqual({ kept: true, severity: 'warning' });
    expect(decide(cli, 'SLIDE_DENSE', 'warning').promoted).toBe(true);
    // A nearer file takes back what an outer one promoted.
    const inherited = buildPolicy({
      layers: [layer({ warningsAsErrors: '*' }), layer({ warningsAsErrors: '-slide-dense' }, '/repo/q3/rikiki.config.json')],
    });
    expect(decide(inherited, 'SLIDE_DENSE', 'warning').severity).toBe('warning');
    expect(decide(inherited, 'TEXT_TOO_SMALL', 'warning').severity).toBe('error');
  });

  it('never hides a finding about the run, whatever is written', () => {
    const policy = policyOf({ checks: '-*', severity: { 'page-error': 'off' } });
    expect(decide(policy, 'PAGE_ERROR', 'error')).toEqual({ kept: true, severity: 'error' });
    expect(decide(policy, 'CHECK_CONFIG_INVALID', 'error').kept).toBe(true);
  });
});

describe('overrides · slides, kinds, tags, elements', () => {
  const overrides = [
    { slides: 'annexe-1', checks: '-text-too-small', reason: 'annexe lue en PDF' },
    { kinds: ['deck-cover'], severity: { 'slide-dense': 'off' } },
    { tags: ['annexe'], severity: { 'content-clipped': 'warning' } },
    { elements: '.legal', checks: '-text-too-small', reason: 'mentions légales' },
  ];
  const policy = policyOf({ overrides });
  const where = placed(policy, { elementPaths: { '.legal': ['deck-root > deck-feature#flux > p.legal'] } });
  const run = (diagnostics) => applyPolicy(diagnostics, policy, where);

  it('silences a rule on the slides it names, by id, and nowhere else', () => {
    const { kept, suppressed } = run([finding('TEXT_TOO_SMALL', 'warning', { slide: 2 }), finding('TEXT_TOO_SMALL', 'warning', { slide: 3 })]);
    expect(kept.map((d) => d.slide)).toEqual([3]);
    expect(suppressed[0].suppressedBy).toEqual({ kind: 'override', source: '/repo/rikiki.config.json#check.overrides[0]', reason: 'annexe lue en PDF' });
  });

  it('matches a kind of slide, a tag, and an element and what it holds', () => {
    const { kept, suppressed } = run([
      finding('SLIDE_DENSE', 'warning', { slide: 1 }),
      finding('CONTENT_CLIPPED', 'error', { slide: 2 }),
      finding('TEXT_TOO_SMALL', 'warning', { slide: 3, element: 'deck-root > deck-feature#flux > p.legal > span' }),
      finding('TEXT_TOO_SMALL', 'warning', { slide: 3, element: 'deck-root > deck-feature#flux > p.legalese' }),
    ]);
    expect(suppressed.map((d) => d.code)).toEqual(['SLIDE_DENSE', 'TEXT_TOO_SMALL']);
    expect(kept.find((d) => d.code === 'CONTENT_CLIPPED').severity).toBe('warning');
    expect(kept.find((d) => d.code === 'TEXT_TOO_SMALL').element).toMatch(/legalese/);
  });

  it('places a finding with no slide by the slide its element stands in', () => {
    const { suppressed } = run([finding('TEXT_TOO_SMALL', 'warning', { element: 'deck-root > deck-feature#annexe-1 > p' })]);
    expect(suppressed).toHaveLength(1);
  });

  it('says the slides an override covers, and one that names a slide the deck lacks', () => {
    const lost = placed(policyOf({ overrides: [{ slides: 'nowhere', checks: '-slide-dense' }] }));
    expect(where.overrides[0].slides).toEqual([2]);
    expect(where.overrides[2].slides).toEqual([2]);
    expect(lost.overrides[0].unknownSlides).toBe('nowhere');
    expect(lost.overrides[0].slides).toEqual([]);
  });
});

describe('exceptions written on the deck', () => {
  const carriers = [
    { path: 'deck-root > deck-feature#flux', off: 'slide-dense ill-*', reason: 'grille contractuelle', isSlide: true },
    { path: 'deck-root > deck-feature#annexe-1 > deck-diagram', off: 'content-clipped', reason: 'capture live' },
    { path: 'deck-root > deck-cover#intro', off: 'slide-dense', reason: '', isSlide: true },
  ];

  it('silences warnings under the element that writes them, with its reason', () => {
    const policy = policyOf(null);
    const where = placed(policy, { carriers });
    const { kept, suppressed } = applyPolicy(
      [
        finding('SLIDE_DENSE', 'warning', { slide: 3 }),
        finding('ILL_WORDY', 'warning', { slide: 3, element: 'deck-root > deck-feature#flux > deck-diagram ::shadow svg' }),
        finding('SLIDE_DENSE', 'warning', { slide: 1 }),
      ],
      policy,
      where,
    );
    expect(suppressed.map((d) => d.code)).toEqual(['SLIDE_DENSE', 'ILL_WORDY']);
    expect(suppressed[0].suppressedBy).toEqual({ kind: 'inline', source: 'deck-root > deck-feature#flux', reason: 'grille contractuelle' });
    // No reason, no exception.
    expect(kept.map((d) => d.slide)).toEqual([1]);
  });

  it('cannot silence an error unless the deck allows it, and keeps it, counted as refused', () => {
    const strict = policyOf(null);
    const where = placed(strict, { carriers });
    const errorFinding = finding('CONTENT_CLIPPED', 'error', { slide: 2, element: 'deck-root > deck-feature#annexe-1 > deck-diagram' });
    expect(applyPolicy([errorFinding], strict, where).kept).toHaveLength(1);
    expect(where.exceptions[1].refused).toBe(1);
    const all = policyOf({ inline: 'all' });
    expect(applyPolicy([errorFinding], all, placed(all, { carriers })).suppressed).toHaveLength(1);
    const none = policyOf(undefined, { inline: 'none' });
    expect(applyPolicy([finding('SLIDE_DENSE', 'warning', { slide: 3 })], none, placed(none, { carriers })).kept).toHaveLength(1);
  });

  it('says an exception with no reason, an unknown rule, one that silenced nothing, and one refused', () => {
    const policy = policyOf(null);
    const where = placed(policy, {
      carriers: [...carriers, { path: 'deck-root > deck-feature#flux > p', off: 'text-too-smal *', reason: 'typo' }],
    });
    applyPolicy([finding('CONTENT_CLIPPED', 'error', { slide: 2, element: 'deck-root > deck-feature#annexe-1 > deck-diagram' })], policy, where);
    const coverage = { all: [1, 2, 3], inspected: [1, 2, 3], steps: true, visual: true, slideSteps: {}, visualCodes: ['SLIDE_TOP_HEAVY'], unloaded: [] };
    const codes = exceptionFindings(where.exceptions, policy, { known, coverage }).map((f) => `${f.code} ${f.measurement?.rule ?? ''}`.trim());
    expect(codes).toEqual(
      expect.arrayContaining([
        'CHECK_SUPPRESSION_UNUSED slide-dense',
        'CHECK_SUPPRESSION_UNUSED ill-*',
        'CHECK_SUPPRESSION_REFUSED',
        'CHECK_SUPPRESSION_UNJUSTIFIED',
        'CHECK_SUPPRESSION_UNKNOWN text-too-smal',
        'CHECK_SUPPRESSION_UNKNOWN',
      ]),
    );
  });

  it('does not call unused an exception whose finding was not looked for', () => {
    const policy = policyOf(null);
    const where = placed(policy, { carriers: [carriers[0]] });
    const partial = { all: [1, 2, 3], inspected: [1, 2], steps: true, visual: true, slideSteps: {}, visualCodes: [], unloaded: [] };
    expect(exceptionFindings(where.exceptions, policy, { known, coverage: partial })).toEqual([]);
    const opening = { ...partial, inspected: [1, 2, 3], steps: false, slideSteps: { 3: 2 } };
    expect(exceptionFindings(where.exceptions, policy, { known, coverage: opening })).toEqual([]);
  });
});

describe('what the policy itself gets wrong', () => {
  it('says a name that names no rule, and one that names only findings about the run', () => {
    const policy = policyOf({ checks: '-text-too-smal', severity: { 'page-error': 'off' } });
    const found = selectionFindings(policy, { known });
    expect(found.map((f) => f.code)).toEqual(['CHECK_SELECTION_UNMATCHED', 'CHECK_SELECTION_IGNORED']);
    expect(found[0].measurement.rule).toBe('text-too-smal');
  });

  it('stays quiet on the rules of a plugin that did not load · its own failure says so', () => {
    const policy = policyOf({ checks: '-speak-*' });
    expect(selectionFindings(policy, { known, pending: ['SPEAK'] })).toEqual([]);
  });

  it('says an option no plugin rule reads, and not one whose plugin did not load', () => {
    const policy = policyOf({ options: { 'speak-too-many-words.max': 40, 'SPEAK_TOO_MANY_WORD.max': 40, 'text-too-small.max': 1 } });
    expect(optionFindings(policy, { readers: ['SPEAK_TOO_MANY_WORDS'] }).map((f) => f.measurement.option)).toEqual([
      'SPEAK_TOO_MANY_WORD.max',
      'text-too-small.max',
    ]);
    expect(optionFindings(policy, { readers: [], pending: ['SPEAK'] }).map((f) => f.measurement.rule)).toEqual(['TEXT_TOO_SMALL']);
  });
});

describe('the config files', () => {
  let root;
  afterEach(() => root && rmSync(root, { recursive: true, force: true }));

  const tree = (files) => {
    root = mkdtempSync(join(tmpdir(), 'rikiki-policy-'));
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), typeof content === 'string' ? content : JSON.stringify(content));
    }
    return root;
  };

  it('reads every section from the deck up, outermost first, and stops at root: true and at .git', () => {
    const base = tree({
      'outside/rikiki.config.json': { check: { checks: '-slide-dense' } },
      'outside/repo/.git/HEAD': 'ref',
      'outside/repo/rikiki.config.json': { check: { checks: '-ill-*' } },
      'outside/repo/talks/rikiki.config.json': { check: { root: true, checks: '-text-*' } },
      'outside/repo/talks/q3/rikiki.config.json': { plugins: [], check: { severity: { 'ill-wordy': 'error' } } },
      'outside/repo/talks/q3/deck.html': '',
    });
    const deck = join(base, 'outside/repo/talks/q3/deck.html');
    expect(configFiles(deck).map((f) => f.slice(base.length))).toEqual([
      '/outside/repo/talks/rikiki.config.json',
      '/outside/repo/talks/q3/rikiki.config.json',
    ]);
    const other = join(base, 'outside/repo/other/deck.html');
    mkdirSync(join(base, 'outside/repo/other'));
    expect(configFiles(other).map((f) => f.slice(base.length))).toEqual(['/outside/repo/rikiki.config.json']);
  });

  it('never reads the home folder on the way up · only by --config', () => {
    const base = tree({
      'home/rikiki.config.json': { check: { checks: '-*' } },
      'home/presentations/rikiki.config.json': { check: { checks: '-slide-dense' } },
      'home/presentations/deck.html': '',
    });
    const previous = process.env.HOME;
    process.env.HOME = join(base, 'home');
    try {
      const deck = join(base, 'home/presentations/deck.html');
      expect(configFiles(deck).map((f) => f.slice(base.length))).toEqual(['/home/presentations/rikiki.config.json']);
      expect(configFiles(deck, join(base, 'home/rikiki.config.json'))).toEqual([join(base, 'home/rikiki.config.json')]);
    } finally {
      process.env.HOME = previous;
    }
  });

  it('says a section it cannot read, with its file and its key, and keeps the others', () => {
    const base = tree({
      '.git/HEAD': 'ref',
      'rikiki.config.json': { check: { checks: '-slide-dense' } },
      'q3/rikiki.config.json': { check: { severity: { 'ill-wordy': 'loud' }, overrides: [{ checks: '-x' }] } },
      'q3/deck.html': '',
    });
    const { layers, diagnostics } = loadCheckConfig(join(base, 'q3/deck.html'));
    expect(layers).toHaveLength(1);
    expect(diagnostics[0].code).toBe('CHECK_CONFIG_INVALID');
    expect(diagnostics[0].measurement.problems.join(' ')).toMatch(/ill-wordy must be one of error, warning, off.*matches nothing in particular/);
  });

  it('reads --config alone, and says when it is not there', () => {
    const base = tree({ 'rikiki.config.json': { check: { checks: '-slide-dense' } }, 'deck.html': '' });
    expect(loadCheckConfig(join(base, 'deck.html'), join(base, 'missing.json')).diagnostics[0].measurement.problems).toEqual([
      'the file named by --config does not exist',
    ]);
  });

  it('refuses a threshold written on an override, and an unknown key', () => {
    expect(sectionProblems({ overrides: [{ slides: '2', limits: { minTextPx: 12 }, checks: '-x' }], colour: 'red' }).join(' ')).toMatch(
      /colour is not a key.*thresholds apply to the whole deck/,
    );
  });
});

describe('an element path', () => {
  it('holds what is under it, its shadow tree included, and not a sibling that shares a prefix', () => {
    expect(isWithin('deck-root > div:nth-of-type(1) > p', 'deck-root > div:nth-of-type(1)')).toBe(true);
    expect(isWithin('deck-root > div:nth-of-type(10)', 'deck-root > div:nth-of-type(1)')).toBe(false);
    expect(isWithin('deck-root > deck-diagram ::shadow svg', 'deck-root > deck-diagram')).toBe(true);
    expect(isWithin(undefined, 'deck-root')).toBe(false);
  });
});
