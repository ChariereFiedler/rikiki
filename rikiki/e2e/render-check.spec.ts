import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// `render` and `check` are what an agent uses instead of eyes. They drive a
// real browser, so they live here rather than in the node suite.
//
// Every deck below is written into a temporary directory outside the
// repository, with the runtime copied beside it by `rikiki init`: what these
// tests exercise is the deck a consumer would have, not a repo fixture.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');

let workDir: string;
let runtimeDir: string;

test.beforeAll(() => {
  // One `init` for the whole file · copying the runtime per test would spend
  // more time on file I/O than on the browser.
  workDir = mkdtempSync(join(tmpdir(), 'rikiki looks '));
  execFileSync(process.execPath, [CLI, 'init', 'base.html'], { cwd: workDir, stdio: 'ignore' });
  runtimeDir = join(workDir, 'rikiki');
  expect(existsSync(join(runtimeDir, 'dist/index.js'))).toBe(true);
});

test.afterAll(() => rmSync(workDir, { recursive: true, force: true }));

/** Write a deck into its own directory next to the shared runtime. */
function deck(name: string, body: string): string {
  const file = join(workDir, `${name}.html`);
  writeFileSync(
    file,
    `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<script type="module" src="rikiki/dist/index.js"></script>
</head><body>
<deck-root>
${body}
</deck-root>
</body></html>`,
  );
  return file;
}

function cli(args: string[]): { stdout: string; stderr: string; status: number } {
  // spawnSync, not execFileSync: the latter only hands back stderr when the
  // command fails, and half of what these commands say is said on success.
  const run = spawnSync(process.execPath, [CLI, ...args], {
    cwd: workDir,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return { stdout: run.stdout ?? '', stderr: run.stderr ?? '', status: run.status ?? 1 };
}

const report = (name: string) => {
  const run = cli(['check', `${name}.html`, '--json']);
  return { ...run, json: JSON.parse(run.stdout) };
};
// The pixel pass is not needed for a DOM/geometry assertion, and it is the
// slowest thing `check` does.
const reportFast = (name: string) => {
  const run = cli(['check', `${name}.html`, '--json', '--no-visual']);
  return { ...run, json: JSON.parse(run.stdout) };
};
const codes = (r: { json: any }) => r.json.diagnostics.map((d: any) => d.code);

test.describe('render', () => {
  test('writes one picture per slide, a gallery and a manifest that ties them together', () => {
    deck(
      'three',
      `<deck-cover id="intro"><h1>Un</h1></deck-cover>
       <deck-feature id="milieu"><h1 slot="title">Deux</h1><p>Corps</p></deck-feature>
       <deck-takeaway><h1>Trois</h1></deck-takeaway>`,
    );
    const run = cli(['render', 'three.html', '--out', 'shots']);
    expect(run.status, run.stderr).toBe(0);

    const manifest = JSON.parse(readFileSync(join(workDir, 'shots/manifest.json'), 'utf8'));
    expect(manifest.schema).toBe(1);
    expect(manifest.captured).toBe(3);
    expect(manifest.canvas).toEqual({ width: 1920, height: 1080 });
    expect(manifest.shots.map((s: any) => s.id)).toEqual(['intro', 'milieu', null]);
    expect(manifest.shots.map((s: any) => s.title)).toEqual(['Un', 'Deux', 'Trois']);

    // Every file the manifest names is a file that exists · the manifest is
    // the contract between what was seen and what can be edited.
    for (const shot of manifest.shots) {
      expect(existsSync(join(workDir, 'shots', shot.file)), shot.file).toBe(true);
    }
    const gallery = readFileSync(join(workDir, 'shots/index.html'), 'utf8');
    for (const shot of manifest.shots) expect(gallery).toContain(shot.file);
  });

  test('renders only the slides asked for, by number or by id', () => {
    deck(
      'pick',
      `<deck-cover id="a"><h1>A</h1></deck-cover>
       <deck-feature id="b"><h1 slot="title">B</h1></deck-feature>
       <deck-takeaway id="c"><h1>C</h1></deck-takeaway>`,
    );
    const run = cli(['render', 'pick.html', '--out', 'picked', '--slides', 'c,1']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'picked/manifest.json'), 'utf8'));
    // Deck order, not argument order · a gallery reads like the talk.
    expect(manifest.shots.map((s: any) => s.id)).toEqual(['a', 'c']);
    expect(manifest.slideCount).toBe(3);
  });

  test('names the slides it has when the selection matches none', () => {
    deck('pick2', `<deck-cover id="a"><h1>A</h1></deck-cover>`);
    const run = cli(['render', 'pick2.html', '--out', 'nope', '--slides', 'zzz']);
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/no slide matches "zzz"/);
    expect(run.stderr).toMatch(/this deck has: 1 \(a\)/);
    expect(run.stderr, 'an expected error must not print a stack').not.toMatch(/ {4}at /);
  });

  test('captures each revealed state under --steps, and says which state it caught', () => {
    deck(
      'steps',
      `<deck-feature id="reveal" steps="2">
         <h1 slot="title">Reveals</h1>
         <p data-step-block="1">First</p>
         <p data-step-block="2">Second</p>
       </deck-feature>`,
    );
    const plain = cli(['render', 'steps.html', '--out', 'plain']);
    expect(plain.status, plain.stderr).toBe(0);
    const first = JSON.parse(readFileSync(join(workDir, 'plain/manifest.json'), 'utf8'));
    expect(first.captured).toBe(1);
    expect(first.stepsCaptured).toBe(false);
    // The opening state of a stepped slide is the emptiest one it has · a
    // reader of the manifest must not mistake it for the whole slide.
    expect(plain.stderr).toMatch(/--steps/);

    const stepped = cli(['render', 'steps.html', '--out', 'stepped', '--steps']);
    expect(stepped.status, stepped.stderr).toBe(0);
    const all = JSON.parse(readFileSync(join(workDir, 'stepped/manifest.json'), 'utf8'));
    expect(all.stepsCaptured).toBe(true);
    expect(all.shots.map((s: any) => s.step)).toEqual([0, 1, 2]);
    expect(all.shots.map((s: any) => s.file)).toEqual([
      '01-reveal.png',
      '01-reveal-s1.png',
      '01-reveal-s2.png',
    ]);
  });

  test('turns a hostile slide id into one harmless file name', () => {
    deck('unsafe', `<deck-cover id="../../etc/passwd"><h1>Nope</h1></deck-cover>`);
    const run = cli(['render', 'unsafe.html', '--out', 'safe']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'safe/manifest.json'), 'utf8'));
    const [shot] = manifest.shots;
    expect(shot.file).not.toContain('/');
    expect(shot.file).not.toContain('..');
    expect(existsSync(join(workDir, 'safe', shot.file))).toBe(true);
    // The id is still reported as written · sanitising the file name must not
    // rewrite the deck's own vocabulary.
    expect(shot.id).toBe('../../etc/passwd');
  });

  test('renders at the size it is told, and refuses a size that is not one', () => {
    deck('sized', `<deck-cover><h1>Small</h1></deck-cover>`);
    const run = cli(['render', 'sized.html', '--out', 'small', '--width', '800', '--height', '450']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'small/manifest.json'), 'utf8'));
    expect(manifest.canvas).toEqual({ width: 800, height: 450 });

    const bad = cli(['render', 'sized.html', '--out', 'bad', '--width', 'wide']);
    expect(bad.status).toBe(1);
    expect(bad.stderr).toMatch(/positive whole number of pixels/);
  });

  test('refuses to photograph a deck that never showed a slide', () => {
    writeFileSync(join(workDir, 'dead.html'), '<!doctype html><html><body><p>no deck</p></body></html>');
    const run = cli(['render', 'dead.html', '--out', 'dead']);
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/never showed a slide/);
    expect(run.stderr).toMatch(/rikiki check/);
  });
});

test.describe('check', () => {
  test('passes a sound deck, and says what it did not look at', () => {
    // Enough content that the slide fills its canvas · a headline over one
    // sentence is reported by the visual pass, and rightly so.
    deck(
      'sound',
      `<deck-cover id="intro"><h1>Titre</h1></deck-cover>
       <deck-feature id="body" spread="center"><h1 slot="title">Corps</h1>
         <deck-callout type="info">Une première phrase, qui porte le propos de la slide.</deck-callout>
         <deck-callout type="ok">Une deuxième, qui l'appuie avec un fait.</deck-callout>
         <deck-callout type="warn">Une troisième, qui nuance ce que les deux premières affirment.</deck-callout>
       </deck-feature>`,
    );
    const r = report('sound');
    expect(r.status).toBe(0);
    expect(r.json.summary).toEqual({ error: 0, warning: 0 });
    expect(r.json.slideCount).toBe(2);
    // Silence about a check that never ran would read as a clean bill.
    expect(r.json.notChecked.join(' ')).toMatch(/accessibility/);
  });

  test('names a misspelled element, where it is, and why nothing shows', () => {
    deck('typo', `<deck-feature id="detail"><h1 slot="title">T</h1><deck-callot>lost</deck-callot></deck-feature>`);
    const r = report('typo');
    expect(r.status).toBe(1);
    expect(codes(r)).toContain('UNKNOWN_ELEMENT');
    const found = r.json.diagnostics.find((d: any) => d.code === 'UNKNOWN_ELEMENT');
    expect(found.severity).toBe('error');
    expect(found.element).toContain('deck-feature#detail');
    expect(found.message).toContain('deck-callot');
  });

  test('measures clipped content and points inside the shadow tree', () => {
    const lines = Array.from({ length: 40 }, (_, i) => `<p>Ligne ${i} d'un contenu trop long.</p>`).join('');
    deck('over', `<deck-feature id="trop"><h1 slot="title">Trop</h1>${lines}</deck-feature>`);
    const r = report('over');
    expect(r.status).toBe(1);
    const clipped = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_CLIPPED');
    expect(clipped.slide).toBe(1);
    expect(clipped.slideId).toBe('trop');
    expect(clipped.measurement.clippedPx).toBeGreaterThan(100);
    expect(clipped.element, 'the clipping box is inside the layout').toContain('::shadow');
    expect(clipped.suggestion).toMatch(/deck-notes|split/);
  });

  test('reports a missing resource once, with its status', () => {
    writeFileSync(
      join(workDir, 'missing.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<script type="module" src="rikiki/dist/index.js"></script>
</head><body><deck-root>
<deck-photo id="pic"><img src="absent.png" alt="gone"></deck-photo>
</deck-root></body></html>`,
    );
    const r = report('missing');
    expect(r.status).toBe(1);
    const missing = r.json.diagnostics.filter((d: any) => d.code === 'RESOURCE_MISSING');
    expect(missing, 'one file, one diagnostic').toHaveLength(1);
    expect(missing[0].url).toMatch(/absent\.png$/);
    expect(missing[0].httpStatus).toBe(404);
  });

  test('blames the runtime once, instead of every element it did not define', () => {
    writeFileSync(
      join(workDir, 'noruntime.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<script type="module" src="rikiki/dist/nope.js"></script>
</head><body><deck-root>
<deck-cover><h1>A</h1></deck-cover><deck-feature><h1>B</h1></deck-feature>
</deck-root></body></html>`,
    );
    const r = report('noruntime');
    expect(r.status).toBe(1);
    expect(codes(r)).toContain('RUNTIME_NOT_LOADED');
    expect(codes(r).filter((c: string) => c === 'UNKNOWN_ELEMENT'), 'the cause is stated once').toHaveLength(0);
    // Layout numbers from an unstyled page would be real and meaningless.
    expect(codes(r)).not.toContain('SLIDE_DENSE');
    expect(r.json.notChecked.join(' ')).toMatch(/runtime never ran/);
  });

  test('warns about duplicate ids, which break a targeted edit', () => {
    deck('dupes', `<deck-cover id="same"><h1>A</h1></deck-cover><deck-takeaway id="same"><h1>B</h1></deck-takeaway>`);
    const r = report('dupes');
    const dupe = r.json.diagnostics.find((d: any) => d.code === 'DUPLICATE_SLIDE_ID');
    expect(dupe.severity).toBe('warning');
    expect(dupe.message).toContain('same');
    // Warnings alone leave the exit code at 0 · they are not blockers.
    expect(r.status).toBe(0);
  });

  test('reads the deck file for network dependencies a bundle would have to inline', () => {
    writeFileSync(
      join(workDir, 'cdn.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
<script type="module" src="rikiki/dist/index.js"></script>
</head><body><deck-root><deck-cover><h1>A</h1></deck-cover></deck-root></body></html>`,
    );
    const r = report('cdn');
    const external = r.json.diagnostics.find((d: any) => d.code === 'EXTERNAL_DEPENDENCY');
    expect(external.severity).toBe('warning');
    expect(external.message).toContain('fonts.googleapis.com');
    expect(external.suggestion).toMatch(/bundle/);
  });

  test('in --json mode stdout is the report and nothing else, even when the deck is broken', () => {
    writeFileSync(
      join(workDir, 'broken.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<script type="module" src="rikiki/dist/gone.js"></script>
</head><body><deck-root><deck-cover><h1>A</h1></deck-cover></deck-root></body></html>`,
    );
    const run = cli(['check', 'broken.html', '--json']);
    expect(run.status).toBe(1);
    expect(() => JSON.parse(run.stdout), 'stdout must parse as JSON on its own').not.toThrow();
    expect(run.stdout.trimStart().startsWith('{')).toBe(true);
  });

  test('separates a deck it could not read (2) from a deck with defects (1)', () => {
    // An agent branches on this: 1 means "fix the deck", 2 means "fix the call".
    const run = cli(['check', 'absent.html']);
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/input not found/);
    expect(run.stderr).not.toMatch(/ {4}at /);
  });
});

test.describe('what the report says about itself', () => {
  test('reads a two-line title as one line of words', () => {
    // textContent joins across a <br>, which turned "Click<br>stages" into
    // "Clickstages" in a manifest whose whole job is to name a slide.
    deck('broken-title', `<deck-section id="chap"><h1>Click<br>stages</h1></deck-section>`);
    const run = cli(['render', 'broken-title.html', '--out', 'titled']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'titled/manifest.json'), 'utf8'));
    expect(manifest.shots[0].title).toBe('Click stages');
  });

  test('does not call a clipped slide merely dense', () => {
    // Both findings have the same cause · saying "nothing is cut yet" under a
    // line that just counted the cut pixels contradicts it.
    const lines = Array.from({ length: 40 }, (_, i) => `<p>Ligne ${i}.</p>`).join('');
    deck('both', `<deck-feature id="full"><h1 slot="title">Full</h1>${lines}</deck-feature>`);
    const r = report('both');
    expect(codes(r)).toContain('CONTENT_CLIPPED');
    expect(codes(r)).not.toContain('SLIDE_DENSE');
  });
});

test.describe('an attribute a component does not read', () => {
  test('is reported, with what the element does accept', () => {
    // deck-stat takes `num` and its words as content. Writing label="…" on it
    // loses the label with no error anywhere · the slide simply renders without
    // it, which is how three recipes in the authoring guide shipped wrong.
    deck('stray', `<deck-feature id="s"><h1 slot="title">T</h1>
      <deck-stat value="9" label="files">body</deck-stat></deck-feature>`);
    const r = report('stray');
    const strays = r.json.diagnostics.filter((d: any) => d.code === 'UNKNOWN_ATTRIBUTE');
    expect(strays.map((d: any) => d.message).join(' ')).toContain('label');
    expect(strays[0].severity).toBe('warning');
    expect(strays[0].measurement.accepts).toContain('num');
    expect(strays[0].element).toContain('deck-stat');
  });

  test('is not reported when the attribute only styles the element', () => {
    // `compact` on deck-mermaid changes nothing in JavaScript · it exists as
    // `:host([compact])` in the shadow styles. Reading only observedAttributes
    // called it stray and cried wolf on three decks in this repository.
    deck('styled', `<deck-feature id="c"><h1 slot="title">T</h1>
      <deck-code lang="ts" hero>const a = 1;</deck-code></deck-feature>`);
    const r = report('styled');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'UNKNOWN_ATTRIBUTE')).toEqual([]);
  });

  test('measures the size of the author\'s text, not the component chrome', () => {
    // A cover's meta labels are sized by the theme. Telling an author to fix a
    // span they never wrote is noise, and it fired on three shipped decks.
    deck('chrome', `<deck-cover id="c" speaker="Alex" duration="5 min"><h1>Titre</h1></deck-cover>`);
    const r = report('chrome');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'TEXT_TOO_SMALL')).toEqual([]);
    expect(r.json.notChecked.join(' ')).toMatch(/chrome/);
  });
});

test.describe('graph geometry', () => {
  test('reports a node that leaves the graph canvas', () => {
    deck('graph-out', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-out"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="outside" at="1,50" boxed label="A node with a useful long label"></deck-node>
          <deck-node id="inside" at="75,50" boxed label="Inside"></deck-node>
          <deck-edge from="outside" to="inside"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-out');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_OUT_OF_BOUNDS');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.slideId).toBe('graph-out');
    expect(found.measurement.overflowPx).toBeGreaterThan(4);
    expect(found.element).toContain('deck-node#outside');
  });

  test('reports a straight edge that crosses an unrelated node', () => {
    deck('graph-cross', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-cross"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="a" at="15,50" boxed label="A"></deck-node>
          <deck-node id="blocker" at="50,50" boxed label="Blocked"></deck-node>
          <deck-node id="c" at="85,50" boxed label="C"></deck-node>
          <deck-edge from="a" to="c" label="request"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-cross');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_EDGE_CROSSES_NODE');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.measurement.obstructingNode).toContain('deck-node#blocker');
    expect(found.element).toContain('deck-edge');
  });

  test('reports an edge that only clips a corner of an unrelated node', () => {
    // The reported regression, at the coordinates it was reported at: the
    // t4 to t5 edge runs along the bottom-right corner of t3, close enough
    // that a 4px stroke paints over it. The old check compared a zero width
    // centre-to-centre segment against the node box shrunk by 2px, and so
    // said nothing at all about a crossing visible from the back of a room.
    //
    // The boxes are pinned rather than grown from a label and a note: the
    // whole point is a near-tangent, and a near-tangent that drifts with font
    // metrics is a flaky test. 288x202 is what the reported nodes measured.
    const box = 'style="width:288px;height:202px"';
    deck('graph-corner', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-corner"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="t3" at="55,24" boxed label="Identify" ${box}></deck-node>
          <deck-node id="t4" at="80,24" boxed label="Query" ${box}></deck-node>
          <deck-node id="t5" at="16,76" boxed label="Confront" ${box}></deck-node>
          <deck-edge from="t4" to="t5"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-corner');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_EDGE_CROSSES_NODE');
    expect(found, r.stdout).toBeTruthy();
    expect(found.measurement.obstructingNode).toContain('deck-node#t3');
    expect(found.measurement.from).toBe('t4');
    expect(found.measurement.to).toBe('t5');
  });

  test('reports two nodes painted on top of each other', () => {
    deck('graph-overlap', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-overlap"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="near" at="50,50" boxed label="A source nobody can read"></deck-node>
          <deck-node id="over" at="52,50" boxed label="Because of this one"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-overlap');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_OVERLAPS_NODE');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.slideId).toBe('graph-overlap');
    expect(found.message).toContain('"near"');
    expect(found.message).toContain('"over"');
    expect(found.measurement.overlapPx.x).toBeGreaterThan(4);
    expect(found.measurement.overlapPx.y).toBeGreaterThan(4);
  });

  test('leaves two nodes that merely sit side by side', () => {
    deck('graph-apart', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-apart"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="left" at="20,50" boxed label="Left"></deck-node>
          <deck-node id="right" at="80,50" boxed label="Right"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-apart');
    expect(r.json.diagnostics.map((d: any) => d.code), r.stdout).not.toContain(
      'GRAPH_NODE_OVERLAPS_NODE',
    );
  });
});

test.describe('check --steps', () => {
  test('measures every revealed state, and reports a defect that only shows once stepped through', () => {
    // deck-graph's own `reveal` only dims and highlights nodes as the deck
    // steps through them · it never conceals or moves one (emphasis, not
    // concealment). To get a defect that is genuinely absent from the
    // opening state and present only once revealed, this rule hooks the
    // `[active]` attribute deck-graph already toggles at the matching step
    // and moves the third node off its canvas right when it lights up.
    deck(
      'graph-steps',
      `<script type="module" src="rikiki/dist/deck-graph.js"></script>
       <style>deck-node#c[active] { --nx: 500% !important; }</style>
       <deck-feature id="graph-steps"><h1 slot="title">Graph</h1>
         <deck-graph reveal>
           <deck-node id="a" at="20,50" boxed label="A"></deck-node>
           <deck-node id="b" at="50,50" boxed label="B"></deck-node>
           <deck-node id="c" at="80,50" boxed label="C"></deck-node>
         </deck-graph>
       </deck-feature>`,
    );

    const plain = reportFast('graph-steps');
    expect(codes(plain), plain.stdout).not.toContain('GRAPH_NODE_OUT_OF_BOUNDS');
    expect(plain.json.notChecked.join(' ')).toMatch(/revealed steps/);

    const run = cli(['check', 'graph-steps.html', '--json', '--no-visual', '--steps']);
    const stepped = { ...run, json: JSON.parse(run.stdout) };
    const found = stepped.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_OUT_OF_BOUNDS');
    expect(found, stepped.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.state).toBeGreaterThan(0);
    // Four states of one slide · the opening one plus each of the three the
    // graph declares for itself.
    expect(stepped.json.statesInspected).toBe(4);
    // The generic "only the opening state" line would now be false · the
    // pixel-specific one takes its place since the visual pass never walks
    // the steps.
    expect(stepped.json.notChecked.join(' ')).not.toMatch(/revealed steps · only the opening/);
  });

  test('collapses a defect seen at several states down to its first occurrence', () => {
    // A duplicate id lives on the slide itself, unrelated to any step · every
    // state re-measures it, and the report must still say it once.
    deck(
      'dedupe-steps',
      `<deck-feature id="a" steps="1"><h1 slot="title">A</h1><p data-step-block="1">x</p></deck-feature>
       <deck-takeaway id="a"><h1>B</h1></deck-takeaway>`,
    );
    const run = cli(['check', 'dedupe-steps.html', '--json', '--no-visual', '--steps']);
    const stepped = { ...run, json: JSON.parse(run.stdout) };
    const dupes = stepped.json.diagnostics.filter((d: any) => d.code === 'DUPLICATE_SLIDE_ID');
    expect(dupes, stepped.stdout).toHaveLength(1);
    expect(dupes[0].state).toBe(0);
  });
});

test('text is measured inside the elements that re-render the author\'s words', () => {
  // Slotted content stays in the light DOM and is measured there. deck-md and
  // deck-code are different: they rebuild the author's own text into their
  // shadow tree, and skipping shadow trees wholesale made a code block
  // invisible to the size check.
  deck(
    'shadowtext',
    `<deck-feature id="code"><h1 slot="title">T</h1>
       <deck-code lang="ts" style="font-size:6px">const a = 1;</deck-code>
     </deck-feature>`,
  );
  const r = report('shadowtext');
  const where = r.json.diagnostics
    .filter((d: any) => d.code === 'TEXT_TOO_SMALL')
    .map((d: any) => d.element)
    .join(' ');
  expect(where, 'the code block is measured').toMatch(/deck-code ::shadow/);
  // deck-md is walked for the same reason, but it sets its own type size, so
  // an author cannot shrink it from the outside · nothing to assert there.
});

test.describe('content no slot takes', () => {
  test('is an error, naming the slots the parent does offer', () => {
    // deck-feature-cards is a slide layout, not a block: putting cards in it
    // from inside another layout drops all three and leaves the slide blank,
    // with nothing in the report to say so.
    deck(
      'lost',
      `<deck-feature id="host"><h1 slot="title">T</h1>
         <deck-feature-cards>
           <deck-card slot="a">un</deck-card>
         </deck-feature-cards>
       </deck-feature>`,
    );
    const r = report('lost');
    expect(r.status).toBe(1);
    const lost = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_NOT_RENDERED');
    expect(lost.severity).toBe('error');
    expect(lost.element).toContain('deck-card');
    expect(lost.measurement.wantedSlot).toBe('a');
    expect(lost.measurement.slotsOffered).toContain('left');
    expect(lost.suggestion).toMatch(/slot/);
  });

  test('does not fire on notes, which are for the presenter and never shown', () => {
    deck('notes', `<deck-feature id="n"><h1 slot="title">T</h1><p>corps</p>
      <deck-notes>ce que je dirai</deck-notes></deck-feature>`);
    const r = report('notes');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'CONTENT_NOT_RENDERED')).toEqual([]);
  });
});

test.describe('painted box geometry', () => {
  test('reports content that spills past its box and over the slide below it', () => {
    // Two cards in a grid row fixed too short for their paragraph, followed
    // by a callout: this is the reported defect verbatim. The slide itself
    // has room to spare below, so nothing clips · the last sentence of each
    // card paints past its own box and over the callout, and only comparing
    // painted rects catches it.
    const para =
      "Une phrase assez longue pour remplir la carte. Une deuxieme phrase qui pousse le texte encore plus bas dans la carte. Une troisieme phrase qui continue d'allonger le paragraphe pour forcer un debordement bien visible au-dela de la bordure de la carte, vers le bas.";
    deck(
      'spill',
      `<deck-feature id="clash"><h1 slot="title">Deux options</h1>
         <deck-grid cols="2" rows="140px">
           <deck-card id="a" color="yellow"><h3>Option A</h3><p>${para}</p></deck-card>
           <deck-card id="b" color="green"><h3>Option B</h3><p>${para}</p></deck-card>
         </deck-grid>
         <deck-callout type="info">Ce texte de synthese doit rester lisible meme si les cartes au-dessus debordent un peu trop bas.</deck-callout>
       </deck-feature>`,
    );
    const r = reportFast('spill');
    expect(codes(r), r.stdout).not.toContain('CONTENT_CLIPPED');

    const escape = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_ESCAPES_BOX');
    expect(escape, r.stdout).toBeTruthy();
    expect(escape.severity).toBe('error');
    expect(escape.slideId).toBe('clash');
    expect(escape.element).toContain('deck-card');
    expect(escape.measurement.escapePx).toBeGreaterThan(4);

    const overlap = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_OVERLAPS_SIBLING');
    expect(overlap, r.stdout).toBeTruthy();
    expect(overlap.severity).toBe('error');
    expect(overlap.slideId).toBe('clash');
    expect(overlap.measurement.overlapPx.x).toBeGreaterThan(8);
    expect(overlap.measurement.overlapPx.y).toBeGreaterThan(8);
  });

  test('leaves a well-sized slide alone', () => {
    deck(
      'wellsized',
      `<deck-feature id="ok"><h1 slot="title">Deux options</h1>
         <deck-grid cols="2">
           <deck-card id="a" color="yellow"><h3>Option A</h3><p>Une phrase courte.</p></deck-card>
           <deck-card id="b" color="green"><h3>Option B</h3><p>Une autre phrase courte.</p></deck-card>
         </deck-grid>
         <deck-callout type="info">Une synthese courte.</deck-callout>
       </deck-feature>`,
    );
    const r = reportFast('wellsized');
    expect(codes(r), r.stdout).not.toContain('CONTENT_ESCAPES_BOX');
    expect(codes(r), r.stdout).not.toContain('CONTENT_OVERLAPS_SIBLING');
  });

  test('does not flag an <em> sitting inside its own <h1>', () => {
    // An inline mark inside a heading paints a rect that differs from the
    // heading's own by sub-pixel line-box rounding, and is well under the
    // 40x20 painted-box floor besides · neither should ever read as an
    // escape or an overlap.
    deck('em-title', `<deck-cover id="em"><h1>Un <em>mot</em> important</h1></deck-cover>`);
    const r = reportFast('em-title');
    expect(codes(r), r.stdout).not.toContain('CONTENT_ESCAPES_BOX');
    expect(codes(r), r.stdout).not.toContain('CONTENT_OVERLAPS_SIBLING');
  });
});

test.describe('the visual pass', () => {
  test('reports a slide whose content sits in the top with a dead band below', () => {
    // Measured on the pixels, not on the DOM: a box can be the right size and
    // the slide still read as unfinished. This is the defect a room notices
    // first, and the one the DOM cannot see.
    deck(
      'topheavy',
      `<deck-feature id="haut"><h1 slot="title">Un titre qui prend le haut</h1>
         <p>Une phrase, et rien d'autre.</p>
       </deck-feature>`,
    );
    const r = report('topheavy');
    const found = r.json.diagnostics.find((d: any) => d.code === 'SLIDE_TOP_HEAVY');
    expect(found, 'the imbalance is reported').toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.slideId).toBe('haut');
    expect(found.measurement.emptyBandBelow).toBeGreaterThan(0.3);
    expect(found.suggestion).toMatch(/spread/);
    expect(r.json.visualMeasured).toBe(true);
  });

  test('leaves a slide alone when its content earns the space', () => {
    // The imbalance is reported, never the amount of empty space on its own:
    // a slide whose ink reaches down the canvas is left alone whatever remains.
    deck(
      'filled',
      `<deck-feature id="plein" spread="center"><h1 slot="title">Plein</h1>
         <deck-callout type="info">Une première phrase, qui porte le propos de la slide.</deck-callout>
         <deck-callout type="ok">Une deuxième, qui l'appuie avec un fait mesuré.</deck-callout>
         <deck-callout type="warn">Une troisième, qui nuance ce que les deux premières affirment.</deck-callout>
       </deck-feature>`,
    );
    const r = report('filled');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'SLIDE_TOP_HEAVY')).toEqual([]);
  });

  test('says so when the pixels were not measured', () => {
    // A deck that never rendered cannot be measured · the report must not let
    // that silence read as a clean visual bill.
    writeFileSync(
      join(workDir, 'novisual.html'),
      `<!doctype html><html lang="fr"><head><meta charset="UTF-8">
<script type="module" src="rikiki/dist/absent.js"></script>
</head><body><deck-root><deck-cover><h1>A</h1></deck-cover></deck-root></body></html>`,
    );
    const r = report('novisual');
    expect(r.json.visualMeasured).toBe(false);
    expect(r.json.notChecked.join(' ')).toMatch(/pixels/);
  });
});
