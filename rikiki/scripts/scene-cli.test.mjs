import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BRIEF_SCHEMA, RELATIONS } from '../bin/lib/scene-brief.mjs';

// `rikiki scene` as a caller meets it: what it prints, what it writes and the
// exit code it leaves. No browser here · `--measure` draws in Chromium and is
// exercised by e2e/scene-cli.spec.ts.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');

/** One brief per relation the tests rely on · every figure invented. */
const BRIEFS = {
  'compare-size': {
    schema: BRIEF_SCHEMA,
    claim: 'The cache cuts the build by two thirds',
    relation: 'compare-size',
    items: [
      { label: 'No cache', value: 42 },
      { label: 'Local cache', value: 23 },
      { label: 'Shared cache', value: 14 },
    ],
    unit: 'min',
    focus: 'Shared cache',
    source: { text: 'Invented figures', nature: 'illustration' },
  },
  parallel: {
    schema: BRIEF_SCHEMA,
    claim: 'Three ways out of the legacy stack',
    relation: 'parallel',
    items: [
      { label: 'Rewrite', note: 'start again on a new base' },
      { label: 'Strangle', note: 'replace one route at a time' },
      { label: 'Freeze', note: 'keep it running, add nothing' },
    ],
    focus: 'Strangle',
    source: { text: 'Team notes', nature: 'illustration' },
  },
  'before-after': {
    schema: BRIEF_SCHEMA,
    claim: 'Twice as many stay after the change',
    relation: 'before-after',
    before: { label: 'Before', value: 12, of: 50 },
    after: { label: 'After', value: 31, of: 50 },
    focus: 'After',
    source: { text: 'Invented figures', nature: 'illustration' },
  },
  converge: {
    schema: BRIEF_SCHEMA,
    claim: 'Three signals feed one alert',
    relation: 'converge',
    inputs: [{ label: 'Logs' }, { label: 'Metrics' }, { label: 'Traces' }],
    hub: { label: 'Correlator' },
    outcomes: [{ label: 'One alert' }],
    focus: 'Correlator',
    source: { text: 'Invented example', nature: 'illustration' },
  },
};

/** A brief the planner can only answer with a scene taller than the slide. */
const TOO_TALL = {
  schema: BRIEF_SCHEMA,
  claim: 'Who runs it where',
  relation: 'position-2d',
  columns: ['EU', 'US'],
  rows: ['A', 'B', 'C', 'D', 'E', 'F'].map((label) => ({ label, levels: ['prod', 'none'] })),
  source: { text: 'Invented', nature: 'illustration' },
};

let dir;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rikiki scene cli '));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** Run the CLI in the temp directory · never from the repo root. */
function cli(...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8' });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status ?? 1 };
}

function writeBrief(name, brief) {
  writeFileSync(join(dir, name), JSON.stringify(brief, null, 2));
  return name;
}

describe('the example briefs are briefs', () => {
  it.each(Object.keys(BRIEFS))('%s is a relation the planner knows', (relation) => {
    expect(Object.hasOwn(RELATIONS, relation)).toBe(true);
    expect(BRIEFS[relation].relation).toBe(relation);
  });
});

describe('scene · the command answers for itself', () => {
  it('is listed in the help', () => {
    const help = cli('--help').stdout;
    for (const sub of ['plan', 'compile', 'budgets']) expect(help).toContain(`rikiki scene ${sub}`);
  });

  it('names its sub-commands when given none, or one it does not have', () => {
    for (const run of [cli('scene'), cli('scene', 'draw')]) {
      expect(run.status).toBe(2);
      expect(run.stderr).toMatch(/one of plan, compile, budgets/);
    }
  });

  it('refuses an unknown flag as a bad call, without a stack', () => {
    const run = cli('scene', 'plan', writeBrief('b.json', BRIEFS.parallel), '--bogus');
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/--bogus/);
    expect(run.stderr).not.toMatch(/ {4}at /);
  });
});

describe('scene plan', () => {
  it.each(
    Object.keys(BRIEFS),
  )('plans a %s brief, and exits 0 when a candidate fits', (relation) => {
    const run = cli('scene', 'plan', writeBrief('brief.json', BRIEFS[relation]));
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout, 'the human report is on stderr').toBe('');
    expect(run.stderr).toContain(`scene plan · ${relation}`);
    expect(run.stderr).toContain(`claim · ${BRIEFS[relation].claim}`);
    expect(run.stderr).toMatch(/candidate \S+ · \S+ · fits/);
    expect(run.stderr).toMatch(/imports deck-scene-/);
  });

  it('says what each candidate left out, and when two argue different things', () => {
    const parallel = cli('scene', 'plan', writeBrief('p.json', BRIEFS.parallel));
    expect(parallel.stderr).toMatch(/rejected steps · /);
    const beforeAfter = cli('scene', 'plan', writeBrief('ba.json', BRIEFS['before-after']));
    expect(beforeAfter.stderr).toMatch(/candidate units-row · composition · fits/);
    expect(beforeAfter.stderr).toMatch(/candidate bars-stack · bars · fits/);
    expect(beforeAfter.stderr).toMatch(/ambiguous · /);
  });

  it('prints an issue with its code and severity, and exits 1 when nothing fits', () => {
    const run = cli('scene', 'plan', writeBrief('tall.json', TOO_TALL));
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/does not fit/);
    expect(run.stderr).toMatch(/SCENE_TOO_TALL \(error, predicted\)/);
  });

  it('lists every error of an invalid brief by path, exits 2 and writes nothing', () => {
    const brief = {
      ...BRIEFS['compare-size'],
      claim: '',
      items: [{ label: 'Alone', value: 'many' }],
    };
    const run = cli('scene', 'plan', writeBrief('bad.json', brief), '--out', 'plan');
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/the brief is not valid/);
    expect(run.stderr).toMatch(/error · claim · is required/);
    expect(run.stderr).toMatch(/error · items · holds 1, the shape draws 2 to 8/);
    expect(run.stderr).toMatch(/error · items\[0\]\.value · must be a number/);
    expect(existsSync(join(dir, 'plan')), 'an invalid brief must not leave a plan').toBe(false);
  });

  it('refuses a brief that is missing or not JSON as a bad call', () => {
    expect(cli('scene', 'plan', 'nope.json').status).toBe(2);
    expect(cli('scene', 'plan').stderr).toMatch(/missing <brief\.json>/);
    writeFileSync(join(dir, 'broken.json'), '{ "schema": ');
    const run = cli('scene', 'plan', 'broken.json');
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/is not JSON/);
  });

  it('--json writes the plan to stdout and nothing else', () => {
    const run = cli('scene', 'plan', writeBrief('brief.json', BRIEFS.converge), '--json');
    expect(run.status, run.stderr).toBe(0);
    const plan = JSON.parse(run.stdout);
    expect(plan.ok).toBe(true);
    expect(plan.relation).toBe('converge');
    expect(plan.candidates[0]).toMatchObject({ id: 'flow', form: 'flow', fits: true });
    expect(plan.candidates[0].html).toMatch(/^<deck-scene-flow>/);
  });

  it('--json still answers in JSON when the brief is invalid', () => {
    const run = cli('scene', 'plan', writeBrief('bad.json', { schema: BRIEF_SCHEMA }), '--json');
    expect(run.status).toBe(2);
    const plan = JSON.parse(run.stdout);
    expect(plan.ok).toBe(false);
    expect(plan.errors.map((e) => e.path)).toEqual(expect.arrayContaining(['claim', 'relation']));
  });

  it('--out writes the plan and one fragment per candidate', () => {
    const run = cli(
      'scene',
      'plan',
      writeBrief('brief.json', BRIEFS['before-after']),
      '--out',
      'plan',
    );
    expect(run.status, run.stderr).toBe(0);
    const out = join(dir, 'plan');
    expect(readdirSync(out).sort()).toEqual([
      'bars-stack.html',
      'candidates.json',
      'units-row.html',
    ]);
    const plan = JSON.parse(readFileSync(join(out, 'candidates.json'), 'utf8'));
    expect(plan.candidates.map((c) => c.id)).toEqual(['units-row', 'bars-stack']);
    const fragment = readFileSync(join(out, 'units-row.html'), 'utf8');
    expect(fragment.trim()).toBe(plan.candidates[0].html);
    expect(fragment).toMatch(/^<deck-scene layout="row" link="arrow">/);
  });

  it('refuses a theme it cannot draw in', () => {
    const run = cli('scene', 'plan', writeBrief('b.json', BRIEFS.parallel), '--theme', 'neon');
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/--theme is one of rikiki, siliceum/);
  });
});

describe('scene compile', () => {
  it('writes the slide, headed by the modules it needs', () => {
    const run = cli(
      'scene',
      'compile',
      writeBrief('brief.json', BRIEFS['compare-size']),
      '--candidate',
      'bars',
    );
    expect(run.status, run.stderr).toBe(0);
    const [header] = run.stdout.split('-->');
    expect(header).toMatch(/^<!-- rikiki scene · candidate bars/);
    expect(header).toContain('<script type="module" src="dist/deck-scene-bars.js"></script>');
    expect(run.stdout).toContain('<h1 slot="title">The cache cuts the build by two thirds</h1>');
    expect(run.stdout).toMatch(/<deck-scene-bars unit="min">/);
    expect(run.stdout).toContain('<deck-source>Invented figures</deck-source>');
    expect(run.stdout.trim().endsWith('</deck-feature>')).toBe(true);
  });

  it('writes to a file with --out', () => {
    const brief = writeBrief('brief.json', BRIEFS.parallel);
    const run = cli('scene', 'compile', brief, '--candidate', 'cards', '--out', 'slide.html');
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toBe('');
    expect(readFileSync(join(dir, 'slide.html'), 'utf8')).toMatch(/<deck-scene-cards>/);
  });

  it('names the candidates it has when asked for one it does not', () => {
    const brief = writeBrief('brief.json', BRIEFS['before-after']);
    const unknown = cli('scene', 'compile', brief, '--candidate', 'pie');
    expect(unknown.status).toBe(2);
    expect(unknown.stderr).toMatch(
      /no candidate "pie" in this plan · one of units-row, bars-stack/,
    );
    expect(unknown.stdout).toBe('');
    const missing = cli('scene', 'compile', brief);
    expect(missing.status).toBe(2);
    expect(missing.stderr).toMatch(/compile needs --candidate, one of units-row, bars-stack/);
  });

  it('refuses an invalid brief before choosing anything', () => {
    const run = cli('scene', 'compile', writeBrief('bad.json', {}), '--candidate', 'cards');
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/the brief is not valid/);
  });
});

describe('scene budgets', () => {
  it('prints the narrowest clean width and the characters per field', () => {
    const run = cli('scene', 'budgets', 'cards');
    expect(run.status, run.stderr).toBe(0);
    expect(run.stderr).toContain('scene budgets · cards at 1600 units');
    expect(run.stderr).toContain('draws cleanly from 469 units');
    expect(run.stderr).toMatch(/items\s+label\s+note\s+tag/);
  });

  it('--json gives one row per number of items the shape draws', () => {
    const run = cli('scene', 'budgets', 'cards', '--width', '752', '--json');
    expect(run.status, run.stderr).toBe(0);
    const budgets = JSON.parse(run.stdout);
    expect(budgets).toMatchObject({
      kind: 'cards',
      width: 752,
      minWidth: 469,
      fields: ['label', 'note', 'tag'],
    });
    expect(budgets.counts.map((row) => row.count)).toEqual([2, 3, 4, 5]);
    // Fewer cards share the width among fewer · each holds at least as much.
    const labels = budgets.counts.map((row) => row.chars.label);
    expect(labels).toEqual([...labels].sort((a, b) => b - a));
  });

  it('counts a flow by its sources, its hub and its outcomes', () => {
    const budgets = JSON.parse(cli('scene', 'budgets', 'flow', '--json').stdout);
    expect(budgets.counts.map((row) => row.count)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('says when the width asked for is under the clean one', () => {
    const run = cli('scene', 'budgets', 'matrix', '--width', '752');
    expect(run.status).toBe(0);
    expect(run.stderr).toMatch(/note · under 1000 units a matrix can draw wrong/);
  });

  it('names the shapes it knows when given one it does not, or none', () => {
    const unknown = cli('scene', 'budgets', 'pie');
    expect(unknown.status).toBe(2);
    expect(unknown.stderr).toMatch(
      /unknown shape "pie" · one of cards, steps, flow, bars, matrix, ranges, lanes, units/,
    );
    expect(cli('scene', 'budgets').stderr).toMatch(/budgets needs a shape/);
  });

  it('refuses a width that is not a width', () => {
    const run = cli('scene', 'budgets', 'bars', '--width', 'wide');
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/--width must be a positive whole number of drawing units/);
  });
});
