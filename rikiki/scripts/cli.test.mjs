import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanExternal } from '../bin/lib/scan-external.mjs';

// The CLI as a consumer meets it: exit codes, refusals, and the paths that
// `init`'s own suite and the Playwright bundle/print suites do not cover.
//
// What lives elsewhere, on purpose:
//   · the source deck and its assets      → scripts/init-source.test.mjs
//   · assembling partials                 → scripts/assemble.test.mjs
//   · a bundle that fetches nothing, and  → e2e/bundle.spec.ts
//     the offline render of one
//   · a real PDF, page by page            → e2e/print.spec.ts

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');
const NO_ROLLDOWN = join(PKG_DIR, 'scripts/fixtures/block-rolldown.mjs');

let dir;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rikiki cli '));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** Run the CLI in the temp directory · never from the repo root. */
function cli(...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8' });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status ?? 1 };
}

/** Same, with rolldown made unresolvable · what a fresh install looks like. */
function cliWithoutRolldown(...args) {
  const r = spawnSync(process.execPath, ['--import', NO_ROLLDOWN, CLI, ...args], {
    cwd: dir,
    encoding: 'utf8',
  });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status ?? 1 };
}

describe('the CLI answers for itself', () => {
  it.each([['--help'], ['-h'], ['help']])('%s prints usage on stdout and succeeds', (flag) => {
    const run = cli(flag);
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/rikiki init/);
    expect(run.stdout).toMatch(/rikiki assemble/);
  });

  it('prints usage when called with nothing at all', () => {
    const run = cli();
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/rikiki bundle/);
  });

  it('names an unknown command and exits non-zero', () => {
    const run = cli('summarise');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/unknown command: summarise/);
  });

  it('documents every command it accepts', () => {
    // A command the help does not mention is a command nobody finds.
    const help = cli('--help').stdout;
    for (const command of ['init', 'assemble', 'bundle', 'export', 'skills']) {
      expect(help, `help omits \`${command}\``).toMatch(new RegExp(`rikiki ${command}\\b`));
    }
  });
});

describe('init · the shapes it can write', () => {
  it('writes a self-contained file under --standalone', () => {
    const run = cli('init', '--standalone', 'solo.html', '--title', 'Solo');
    expect(run.status, run.stderr).toBe(0);
    const html = readFileSync(join(dir, 'solo.html'), 'utf8');
    // Self-contained means nothing left to fetch. Grepping for a path would
    // trip over the same path quoted inside an inlined CSS comment · the
    // scanner reads the references the browser would actually follow.
    const external = scanExternal(html)
      .map((h) => h.ref)
      .filter((ref) => ref !== './index.js');
    expect(external, `still fetches: ${external.join(', ')}`).toEqual([]);
    expect(html.length).toBeGreaterThan(100_000);
    expect(existsSync(join(dir, 'rikiki')), 'a standalone deck needs no runtime beside it').toBe(
      false,
    );
  });

  it('refuses --standalone without rolldown, and writes nothing', () => {
    const run = cliWithoutRolldown('init', '--standalone', 'solo.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/npm i -D rolldown/);
    expect(existsSync(join(dir, 'solo.html')), 'a failed init must not leave a half deck').toBe(
      false,
    );
  });

  it('writes a source deck with no rolldown in sight', () => {
    // The whole point of the default mode: the first gesture costs one install.
    const run = cliWithoutRolldown('init', 'talk.html');
    expect(run.status, run.stderr).toBe(0);
    expect(existsSync(join(dir, 'rikiki/dist/index.js'))).toBe(true);
  });

  it('carries the heavy plugins only when asked', () => {
    expect(cli('init', 'plain.html').status).toBe(0);
    expect(existsSync(join(dir, 'rikiki/dist/vendor/mermaid.min.js'))).toBe(false);

    expect(cli('init', 'diagram.html', '--with-mermaid').status).toBe(0);
    expect(existsSync(join(dir, 'rikiki/dist/vendor/mermaid.min.js'))).toBe(true);
    const html = readFileSync(join(dir, 'diagram.html'), 'utf8');
    expect(html).toContain('rikiki/dist/vendor/mermaid.min.js');
    expect(html, 'the mermaid starter shows a diagram').toContain('<deck-mermaid>');
  });

  it('activates Shiki from the deck it writes', () => {
    expect(cli('init', 'code.html', '--with-shiki').status).toBe(0);
    const html = readFileSync(join(dir, 'code.html'), 'utf8');
    expect(html).toContain('rikiki/dist/vendor/shiki.js');
    expect(html).toContain('installShiki');
    expect(existsSync(join(dir, 'rikiki/dist/vendor/shiki.js'))).toBe(true);
  });

  it('writes to stdout on `-`, and copies nothing', () => {
    const run = cli('init', '-');
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('<deck-root>');
    expect(existsSync(join(dir, 'rikiki'))).toBe(false);
    // Silence would leave the reader with a deck whose runtime is missing.
    expect(run.stderr).toMatch(/runtime/);
  });

  it('--force replaces the deck, and leaves the runtime usable', () => {
    expect(cli('init', 'talk.html', '--title', 'First').status).toBe(0);
    const run = cli('init', 'talk.html', '--title', 'Second', '--force');
    expect(run.status, run.stderr).toBe(0);
    expect(readFileSync(join(dir, 'talk.html'), 'utf8')).toContain('<title>Second</title>');
    expect(existsSync(join(dir, 'rikiki/dist/index.js'))).toBe(true);
  });

  it('drops the fonts under --no-fonts instead of inlining them', () => {
    // Only the siliceum theme carries font files · the default theme has none,
    // so the flag has nothing to remove there.
    const withFonts = cli('init', '--standalone', 'a.html', '--theme', 'siliceum');
    const without = cli('init', '--standalone', 'b.html', '--theme', 'siliceum', '--no-fonts');
    expect(withFonts.status, withFonts.stderr).toBe(0);
    expect(without.status, without.stderr).toBe(0);

    const heavy = readFileSync(join(dir, 'a.html'), 'utf8');
    const light = readFileSync(join(dir, 'b.html'), 'utf8');
    expect(heavy).toMatch(/data:font\/woff2;base64/);
    expect(light).not.toMatch(/data:font\/woff2;base64/);
    expect(light.length).toBeLessThan(heavy.length / 2);
  });

  it('leaves no @font-face rule pointing at nothing', () => {
    // `src: none` is not valid CSS · a dropped font must drop its whole rule,
    // not leave a declaration the browser has to throw away.
    cli('init', '--standalone', 'b.html', '--theme', 'siliceum', '--no-fonts');
    const light = readFileSync(join(dir, 'b.html'), 'utf8');
    expect(light).not.toMatch(/src:\s*none/);
  });
});

describe('bundle · what it refuses', () => {
  it('reports a missing input instead of writing one', () => {
    const run = cli('bundle', 'nope.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/input not found/);
  });

  it('asks for the deck when given no argument', () => {
    const run = cli('bundle');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/missing <deck\.html>/);
  });

  it('names rolldown and exits non-zero when it is absent', () => {
    writeFileSync(
      join(dir, 'deck.html'),
      `<script type="module">console.log("bundle fixture")</script><deck-root><deck-takeaway/></deck-root>`,
    );
    const run = cliWithoutRolldown('bundle', 'deck.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/npm i -D rolldown/);
    expect(run.stderr, 'an expected error must not print a stack').not.toMatch(/ {4}at /);
  });
});

describe('export · what it refuses', () => {
  it('reports a missing input', () => {
    const run = cli('export', 'nope.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/input not found/);
  });

  it('asks for the deck when given no argument', () => {
    const run = cli('export');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/missing <deck\.html>/);
  });

  it('refuses a directory as politely as a missing file', () => {
    mkdirSync(join(dir, 'somewhere'));
    const run = cli('export', 'somewhere');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/input not found/);
  });
});

describe('skills · installing the agent instructions', () => {
  const SHIPPED = [
    'rikiki-deck',
    'rikiki-theme',
    'rikiki-debug',
    'rikiki-illustrate',
    'rikiki-scenes',
  ];

  it('installs the three shipped skills where an agent looks for them', () => {
    const run = cli('skills');
    expect(run.status, run.stderr).toBe(0);
    for (const name of SHIPPED) {
      expect(existsSync(join(dir, '.claude/skills', name, 'SKILL.md')), `${name} missing`).toBe(
        true,
      );
    }
  });

  it('installs only the three meant for a consumer', () => {
    // rikiki-component and rikiki-visual-design need the TypeScript sources ·
    // shipping them to a consumer would teach gestures they cannot perform.
    cli('skills');
    const { readdirSync } = require('node:fs');
    expect(readdirSync(join(dir, '.claude/skills')).sort()).toEqual([...SHIPPED].sort());
  });

  it('keeps an edited skill unless told otherwise', () => {
    cli('skills');
    const edited = join(dir, '.claude/skills/rikiki-deck/SKILL.md');
    writeFileSync(edited, 'my own notes');

    const second = cli('skills');
    expect(second.stderr).toMatch(/already exists · use --force/);
    expect(readFileSync(edited, 'utf8'), 'a second run must not overwrite').toBe('my own notes');

    expect(cli('skills', '--force').status).toBe(0);
    expect(readFileSync(edited, 'utf8')).toMatch(/rikiki/);
  });

  it('installs into an explicit directory', () => {
    const run = cli('skills', '--dir', 'agent/skills');
    expect(run.status, run.stderr).toBe(0);
    expect(existsSync(join(dir, 'agent/skills/rikiki-theme/SKILL.md'))).toBe(true);
  });
});

describe('intent · from a sentence to a skeleton, with no model', () => {
  const INTENTS = [
    'cause',
    'barrier',
    'bottleneck',
    'accumulate',
    'transform',
    'feedback',
    'scale',
    'contain',
    'parallel',
    'propagate',
    'threshold',
    'tradeoff',
    'drift',
    'compare',
    'partition',
    'merge',
  ];

  it('lists the sixteen intents, every one compiled, with what it looks like', () => {
    const run = cli('intent', '--list');
    expect(run.status, run.stderr).toBe(0);
    const rows = run.stdout
      .split('\n')
      .filter((line) => /^ {2}[a-z]+ +(flow|structure|quantity|time|decision) /.test(line));
    expect(rows.map((row) => row.trim().split(/\s+/)[0])).toEqual(INTENTS);
    expect(run.stdout).not.toMatch(/planned/);
  });

  it.each(
    INTENTS,
  )('prints the exact skeleton of %s, its roles and what the check rejects', (name) => {
    const run = cli('intent', name);
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toContain(`<deck-diagram intent="${name}">`);
    expect(run.stdout).toMatch(/role="/);
    expect(run.stdout).toMatch(/INT_[A-Z_]+ · /);
    // Pasteable as it is: one comment, then the diagram, and no coordinate in it.
    expect(run.stdout.trim()).toMatch(/^<!--[\s\S]*-->\n<deck-diagram[\s\S]*<\/deck-diagram>$/);
    expect(run.stdout).not.toMatch(/\b(x|y|width|height|style)="/);
  });

  it('picks the closest intent from a sentence, the same one every time', () => {
    const sentence = 'Six dossiers arrivent, la validation en traite deux : les autres attendent';
    const first = cli('intent', sentence);
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toContain('<deck-diagram intent="bottleneck">');
    expect(first.stdout).toMatch(/picked from the sentence: "attend"/);
    expect(cli('intent', sentence).stdout).toBe(first.stdout);
    expect(cli('intent', 'Le', 'STOP', 'coupe', 'tous', 'les', 'appels').stdout).toContain(
      'intent="barrier"',
    );
  });

  it('finds the intents of the third lot from their sentence', () => {
    for (const [sentence, name] of [
      ['La boucle s’auto-alimente', 'feedback'],
      ['Au-delà de 80 %, tout bascule', 'threshold'],
      ['Plus rapide, au prix de la fraîcheur', 'tradeoff'],
      ['Trois canaux convergent vers une file', 'merge'],
    ]) {
      const run = cli('intent', sentence);
      expect(run.status, run.stderr).toBe(0);
      expect(run.stdout).toContain(`<deck-diagram intent="${name}">`);
    }
  });

  it('says what an intent composes with, and why the others are refused', () => {
    expect(cli('intent', 'threshold').stdout).toMatch(
      /composes with: also="cause", also="accumulate"/,
    );
    expect(cli('intent', 'scale').stdout).toMatch(/composes with nothing/);
    expect(cli('intent', 'scale').stdout).toMatch(/INT_COMPOSE_INVALID · only cause/);
  });

  it('refuses a sentence it cannot read, and nothing at all', () => {
    for (const args of [['Bonjour à tous'], []]) {
      const run = cli('intent', ...args);
      expect(run.status, args.join(' ')).toBe(1);
      expect(run.stdout).toBe('');
      expect(run.stderr).toMatch(
        /cause, barrier, bottleneck, accumulate, transform, feedback|--list/,
      );
    }
  });

  it('proposes the closest recipes when no intent fits a story, with exit code 3', () => {
    const run = cli('intent', 'Comment on évite le rapport en double ?');
    expect(run.status).toBe(3);
    expect(run.stdout).toBe('');
    expect(run.stderr).toMatch(/no intent found[\s\S]*rikiki recipe race-lock/);
    expect(cli('intent', 'Le STOP coupe tous les appels').stdout).toMatch(
      /recipes near it, told as a story: lanes-gate/,
    );
  });
});

describe('rikiki recipe', () => {
  const RECIPES = [
    'incident-band',
    'lanes-gate',
    'probe-stations',
    'wiring',
    'switch-over',
    'race-lock',
    'filter-records',
    'version-lanes',
    'escalation-runbook',
    'pulse-threshold',
    'scope-rings',
    'data-replay',
  ];

  it('lists the twelve recipes, their model and their tempo', () => {
    const run = cli('recipe', '--list');
    expect(run.status, run.stderr).toBe(0);
    for (const name of RECIPES) expect(run.stdout).toContain(name);
    expect(run.stdout).toMatch(/M15 +incident/);
    expect(run.stdout).toMatch(/12 recipes/);
  });

  it.each(
    RECIPES,
  )('prints the brief, the sequence, the pitfalls and the skeleton of %s', (name) => {
    const run = cli('recipe', name);
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toMatch(/the brief first/);
    expect(run.stdout).toMatch(/the sequence it plays/);
    expect(run.stdout).toMatch(/pitfalls:/);
    expect(run.stdout).toMatch(/\{\{claim\}\}/);
    expect(run.stdout.trim()).toMatch(/^<!--[\s\S]*-->\n<deck-feature[\s\S]*<\/deck-feature>$/);
    expect(run.stdout).not.toMatch(/\b(x|y|width|height|style)="/);
  });

  it('picks the closest recipe from a sentence, the same every time', () => {
    const first = cli('recipe', 'Tout est vert, et 19 h sans un lead');
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toMatch(/recipe · incident-band · M15/);
    expect(first.stdout).toMatch(/picked from the sentence: "h sans"/);
    expect(cli('recipe', 'Tout est vert, et 19 h sans un lead').stdout).toBe(first.stdout);
    expect(cli('recipe', 'M24').stdout).toMatch(/recipe · escalation-runbook/);
  });

  it('fills a brief, and refuses one that is empty, generic or vague', () => {
    const brief = JSON.parse(cli('recipe', 'race-lock', '--brief').stdout);
    writeFileSync(join(dir, 'brief.json'), JSON.stringify(brief));
    const filled = cli('recipe', 'race-lock', '--fill', 'brief.json');
    expect(filled.status, filled.stderr).toBe(0);
    expect(filled.stdout).toBe(cli('recipe', 'race-lock', '--example').stdout);
    expect(filled.stdout).toContain(`label="${brief.target}"`);

    writeFileSync(
      join(dir, 'vague.json'),
      JSON.stringify({ ...brief, target: 'client', proof: '' }),
    );
    const vague = cli('recipe', 'race-lock', '--fill', 'vague.json');
    expect(vague.status).toBe(1);
    expect(vague.stdout).toBe('');
    expect(vague.stderr).toMatch(/target · "client" says nothing/);
    expect(vague.stderr).toMatch(/proof · empty/);
  });

  it('refuses an unknown recipe, a sentence it cannot read, and a missing brief', () => {
    expect(cli('recipe', 'fan-chart', '--example').stderr).toMatch(/unknown recipe "fan-chart"/);
    const none = cli('recipe', 'Bonjour à tous');
    expect(none.status).toBe(1);
    expect(none.stderr).toMatch(/no recipe found[\s\S]*incident-band/);
    expect(cli('recipe').status).toBe(1);
    expect(cli('recipe', 'wiring', '--fill', 'absent.json').stderr).toMatch(/brief not found/);
  });
});
