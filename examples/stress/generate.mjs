#!/usr/bin/env node
// Stress-test generator · produces a Rikiki deck with N slides cycling
// through every layout, with code, cards, stats and section breaks.
//
//   node generate.mjs           # 400 slides (default)
//   node generate.mjs 800       # custom count
//   node generate.mjs 200 src.html

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const N = parseInt(process.argv[2] || '400', 10);
const OUT = process.argv[3] || resolve(__dirname, 'source.html');

// Six recurring slide kinds · sprinkled to keep the deck visually varied.
const kinds = ['feature-code', 'feature-cards', 'split', 'stat', 'callout', 'feature-text'];
const tones = ['yellow', 'orange', 'green', 'red'];
const stats = ['mango', 'helico', 'lime', 'ember', 'orchid'];

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rikiki · stress test · ${N} slides</title>
<link rel="stylesheet" href="../../rikiki/themes/rikiki.css">
<script type="module" src="../../rikiki/dist/index.js"></script>
</head>
<body>

<deck-root transition="slide">

  <deck-cover brand="rikiki · stress" speaker="Perf test" company="Local" duration="watch the FPS" runtime="${N} slides">
    <h1>${N} slides · <span class="accent">one bundle</span>.</h1>
    <p class="sub">Press <kbd>End</kbd> to jump to the last slide. Watch memory, GC pauses, and the overview render time.</p>
  </deck-cover>
`;

const tail = `
  <deck-takeaway kicker="End of test">
    <deck-punch size="display">Survived <span class="accent">${N}</span> slides.</deck-punch>
    <p class="caption on-dark">Check DevTools · memory snapshot, scripting time, layout time. The numbers tell the story.</p>
  </deck-takeaway>

</deck-root>

</body>
</html>
`;

function chapter(num) {
  const pad = String(num).padStart(2, '0');
  return `
  <deck-section num="${pad}">
    <h1>Chapter ${num}</h1>
  </deck-section>
`;
}

function featureCode(i) {
  return `
  <deck-feature eyebrow="Slide ${i}">
    <h1 slot="title">Function definition #${i}</h1>
    <p slot="lead" class="lead">A snippet of TypeScript with a few keywords and string literals.</p>
    <deck-code lang="ts" hero>
const item${i} = (n: number): string =&gt; \`#${i} · \${n}\`;
const out${i} = item${i}(${i * 7 % 13});
console.log(out${i});
    </deck-code>
  </deck-feature>
`;
}

function featureCards(i) {
  return `
  <deck-feature-cards eyebrow="Cards ${i}">
    <h1 slot="title">Three options · slide ${i}</h1>
    <p slot="lead" class="lead">Same recipe, different status tints.</p>
    <deck-code lang="ts" hero>
type Option${i} = 'a' | 'b' | 'c';
const pick${i} = (o: Option${i}): number =&gt; o === 'a' ? 1 : o === 'b' ? 2 : 3;
    </deck-code>
    <deck-card slot="left" color="${tones[i % tones.length]}"><h3>Left ${i}</h3><p>A short justification line.</p></deck-card>
    <deck-card slot="right" color="${tones[(i + 1) % tones.length]}"><h3>Right ${i}</h3><p>A counter-example line.</p></deck-card>
  </deck-feature-cards>
`;
}

function split(i) {
  return `
  <deck-split cols="1-1">
    <h1 slot="title">Before · after #${i}</h1>
    <p slot="lead" class="lead">Two columns side by side.</p>
    <deck-card slot="left" color="red"><h3>Before</h3><p>State at iteration ${i - 1}.</p></deck-card>
    <deck-card slot="right" color="green"><h3>After</h3><p>State at iteration ${i}.</p></deck-card>
  </deck-split>
`;
}

function stat(i) {
  const n = (i * 31) % 999;
  return `
  <deck-feature eyebrow="Numbers ${i}">
    <h1 slot="title">A metric · slide ${i}</h1>
    <deck-stack gap="3">
      <deck-stat num="${String(n).padStart(2, '0')}" tone="${stats[i % stats.length]}">
        <h3 slot="claim">Throughput</h3>
        Requests per second under a slide-flip workload.
      </deck-stat>
      <deck-stat num="${(i * 13) % 99}" tone="${stats[(i + 2) % stats.length]}">
        <h3 slot="claim">Latency p99</h3>
        Milliseconds from keypress to active-attribute flip.
      </deck-stat>
    </deck-stack>
  </deck-feature>
`;
}

function callout(i) {
  const types = ['info', 'warn', 'danger', 'ok'];
  return `
  <deck-feature eyebrow="Tip ${i}">
    <h1 slot="title">Heads-up #${i}</h1>
    <deck-callout type="${types[i % types.length]}">
      <strong>Note ${i} ·</strong> a callout boxed at slide ${i}. The framework keeps redrawing under load.
    </deck-callout>
  </deck-feature>
`;
}

function featureText(i) {
  return `
  <deck-feature eyebrow="Slide ${i}">
    <h1 slot="title">Plain text slide ${i}</h1>
    <p slot="lead" class="lead">A simple feature slide with body copy and no code.</p>
    <deck-md>
This is paragraph **${i}** of a long deck. The markdown component does
its own parse on connect, so we get to measure the parsing cost across
${N} slides. *Italics*, \`inline code\`, lists ·

- one
- two
- three
    </deck-md>
  </deck-feature>
`;
}

function makeSlide(i) {
  switch (kinds[i % kinds.length]) {
    case 'feature-code':  return featureCode(i);
    case 'feature-cards': return featureCards(i);
    case 'split':         return split(i);
    case 'stat':          return stat(i);
    case 'callout':       return callout(i);
    case 'feature-text':  return featureText(i);
  }
}

let body = head;
const CHAPTER_SIZE = 20;
let nextChapter = 1;
for (let i = 1; i <= N; i++) {
  if (i === 1 || (i - 1) % CHAPTER_SIZE === 0) {
    body += chapter(nextChapter++);
  }
  body += makeSlide(i);
}
body += tail;

writeFileSync(OUT, body);
console.error(`stress · wrote ${OUT} · ${(body.length / 1024).toFixed(1)} KB · ${N} slides`);
