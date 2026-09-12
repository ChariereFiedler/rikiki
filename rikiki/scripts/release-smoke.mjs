// Exercise the installed artifact, never the repository CLI or its node_modules.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportDir = join(pkgDir, 'test-results/release');
mkdirSync(reportDir, { recursive: true });
const workspace = mkdtempSync(join(tmpdir(), 'rikiki consumer '));
const report = { workspace, status: 'running', commands: [] };
function run(command, args, cwd = workspace, expected = 0) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 64 * 1024 * 1024,
  });
  report.commands.push({ command, args, status: result.status });
  assert.equal(
    result.status,
    expected,
    `${command} ${args.join(' ')}\n${result.error ?? ''}\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}
try {
  const packed = JSON.parse(
    run('npm', ['pack', '--json', '--pack-destination', workspace], pkgDir),
  )[0];
  assert(!packed.files.some((f) => /\.test\./.test(f.path)), 'no tests in published tarball');
  const archive = join(workspace, packed.filename);
  report.sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex');
  report.package = `${packed.name}@${packed.version}`;
  report.files = packed.entryCount;
  writeFileSync(join(workspace, 'package.json'), '{"private":true}');
  run('npm', ['install', '--no-audit', '--no-fund', '--omit=optional', archive]);
  const cli = join(workspace, 'node_modules/rikiki-deck/bin/rikiki.mjs');
  // npm drops a `bin` entry it considers invalid at publish time; the link is
  // the proof that `npx rikiki` will resolve for a consumer.
  assert(existsSync(join(workspace, 'node_modules/.bin/rikiki')), 'npm linked the rikiki bin');
  const invoke = (...args) => run(process.execPath, [cli, ...args]);
  invoke('init', 'talk.html');
  invoke('skills');
  for (const name of ['rikiki-deck', 'rikiki-theme', 'rikiki-debug'])
    assert(existsSync(join(workspace, `.claude/skills/${name}/SKILL.md`)));
  const source = readFileSync(join(workspace, 'talk.html'), 'utf8');
  assert(source.includes('rikiki/dist/index.js'));
  assert(!existsSync(join(workspace, 'node_modules/rolldown')));
  assert(!existsSync(join(workspace, 'node_modules/playwright')));
  const failed = spawnSync(process.execPath, [cli, 'bundle', 'talk.html', 'missing.html'], {
    cwd: workspace,
    encoding: 'utf8',
  });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /rolldown/);
  assert(!existsSync(join(workspace, 'missing.html')));
  const failedRender = spawnSync(process.execPath, [cli, 'render', 'talk.html'], {
    cwd: workspace,
    encoding: 'utf8',
  });
  assert.notEqual(failedRender.status, 0);
  assert.match(failedRender.stderr, /playwright/);
  const lock = JSON.parse(readFileSync(join(pkgDir, 'package-lock.json')));
  const version = (name) => lock.packages[`node_modules/${name}`].version;
  run('npm', [
    'install',
    '--no-audit',
    '--no-fund',
    `rolldown@${version('rolldown')}`,
    `playwright@${version('playwright')}`,
  ]);
  const body = source.match(/<deck-root\b[^>]*>([\s\S]*?)<\/deck-root>/)[1];
  writeFileSync(join(workspace, 'slides.html'), body);
  writeFileSync(
    join(workspace, 'deck.config.json'),
    JSON.stringify({ title: 'Installed package', slides: ['slides.html'] }),
  );
  invoke('assemble', 'deck.config.json', 'assembled.html');
  const checked = JSON.parse(invoke('check', 'assembled.html', '--json'));
  assert.equal(checked.summary.error, 0);
  assert.equal(checked.slideCount, 3);
  invoke('render', 'assembled.html', '--out', 'shots', '--steps');
  const manifest = JSON.parse(readFileSync(join(workspace, 'shots/manifest.json')));
  assert.equal(manifest.slideCount, 3);
  invoke('bundle', 'assembled.html', 'standalone.html');
  invoke('export', 'assembled.html', '--output', 'talk.pdf');
  assert.match(run('pdfinfo', ['talk.pdf']), /Pages:\s+3/);
  const { chromium } = await import(
    pathToFileURL(join(workspace, 'node_modules/playwright/index.mjs'))
  );
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const url = pathToFileURL(join(workspace, 'standalone.html')).href;
    const requests = [],
      errors = [];
    page.on('request', (r) => {
      if (r.url() !== url) requests.push(r.url());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('deck-root > [active]').waitFor();
    assert.equal(
      await page
        .locator('deck-root > deck-cover, deck-root > deck-feature, deck-root > deck-takeaway')
        .count(),
      3,
    );
    assert.deepEqual(requests, []);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
  report.status = 'passed';
  rmSync(workspace, { recursive: true, force: true });
} catch (error) {
  report.status = 'failed';
  report.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  writeFileSync(join(reportDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
