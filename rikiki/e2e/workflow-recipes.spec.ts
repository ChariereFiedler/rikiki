import { spawnSync } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// The workflow guide tells an agent to copy these blocks. A recipe that does
// not render is worse than no recipe: the reader trusts it, pastes it, and
// debugs our documentation instead of writing their talk.
//
// So every HTML block in the guide is assembled into a real deck and measured
// with `rikiki check`, which is the same command the guide tells the reader to
// run. If a component is renamed, this fails before the docs go stale.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');
const GUIDE = join(PKG_DIR, 'docs/llms/rikiki-workflow.md');

/** The fenced html blocks of the guide, with the heading they sit under. */
function recipeBlocks(): { name: string; html: string }[] {
  const markdown = readFileSync(GUIDE, 'utf8');
  const blocks: { name: string; html: string }[] = [];
  let heading = 'preamble';
  for (const line of markdown.split('\n')) {
    const title = line.match(/^### (.+)$/);
    if (title) heading = title[1];
  }
  // Walk again, this time pairing each fence with the heading above it.
  heading = 'preamble';
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const title = lines[i].match(/^### (.+)$/);
    if (title) {
      heading = title[1];
      continue;
    }
    if (lines[i].trim() !== '```html') continue;
    const body: string[] = [];
    for (i++; i < lines.length && lines[i].trim() !== '```'; i++) body.push(lines[i]);
    blocks.push({ name: heading, html: body.join('\n') });
  }
  return blocks;
}

let workDir: string;

test.beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rikiki recipes '));
  // --with-mermaid: one recipe draws a diagram, and a deck missing its runtime
  // would fail for a reason that has nothing to do with the recipe.
  execFileSync(process.execPath, [CLI, 'init', 'base.html', '--with-mermaid'], {
    cwd: workDir,
    stdio: 'ignore',
  });
});

test.afterAll(() => rmSync(workDir, { recursive: true, force: true }));

const blocks = recipeBlocks();

test('the guide actually carries the nine recipes it promises', () => {
  const named = new Set(blocks.map((b) => b.name));
  expect(named.size, `found: ${[...named].join(' | ')}`).toBeGreaterThanOrEqual(9);
  expect(blocks.length).toBeGreaterThanOrEqual(9);
});

for (const [index, block] of blocks.entries()) {
  test(`recipe · ${block.name}`, () => {
    const file = `recipe-${index}.html`;
    writeFileSync(
      join(workDir, file),
      `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<script src="rikiki/dist/vendor/mermaid.min.js"></script>
<script type="module" src="rikiki/dist/index.js"></script>
</head><body>
<deck-root>
${block.html}
</deck-root>
</body></html>`,
    );

    // --no-visual: a recipe is one slide shown alone, so its vertical balance
    // says nothing · what is under test is that the markup is correct.
    const run = spawnSync(process.execPath, [CLI, 'check', file, '--json', '--no-visual'], {
      cwd: workDir,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    const report = JSON.parse(run.stdout);
    const complaints = report.diagnostics.map(
      (d: any) => `${d.code}${d.element ? ` at ${d.element}` : ''} · ${d.message}`,
    );
    expect(complaints, `${block.name}\n${complaints.join('\n')}`).toEqual([]);
    expect(report.slideCount, 'a recipe renders at least one slide').toBeGreaterThan(0);
  });
}
