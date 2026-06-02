# Rikiki — Presenter fix · Animations · Multi-deck · Docs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix presenter-mode slide styling, add a per-element "click stages" animation plugin, add Vite-based multi-deck assembly from partials, and ship LLM-readable docs plus a deck-authoring skill.

**Architecture:** Rikiki is Lit Web Components built by esbuild into a **flat** `dist/`. Plugins are opt-in and patch component prototypes at runtime (`src/plugins/shiki.ts` is the template). The step system lives in `deck-root.ts` (`_maxSteps`/`_applyStep`). We extend these mechanisms without changing the zero-build consumer contract.

**Tech Stack:** TypeScript, Lit 3, esbuild (build.mjs), Vite + vite-plugin-singlefile (bundle.mjs), Playwright MCP for visual verification.

**Verification note:** This repo has **no unit-test framework** (per spec, we do not introduce one). Each task's verification is: `npm run typecheck`, `npm run build`, and — where behavior is visual — a Playwright MCP screenshot served over `python3 -m http.server`. "Test" steps below mean these checks, not a unit runner.

---

## File Structure

| File | Responsibility | Chantier |
|------|----------------|----------|
| `src/runtime/deck-root.ts` (modify) | Export `RIKIKI_BUNDLE_URL`; no behavior change to nav | 1 |
| `src/runtime/deck-presenter.ts` (modify) | Robust bundle URL, activate cloned slide, clip iframe, responsive grid | 1 |
| `src/plugins/click-stages.ts` (create) | `installClickStages()` — per-element reveal animations | 2 |
| `build/vite-deck.mjs` (create) | Assemble one deck HTML from `deck.config` partials | 3 |
| `decks/example/deck.config.js` + `parts/*` (create) | Reference multi-deck input for verification | 3 |
| `package.json` (modify) | `deck` npm script | 3 |
| `docs/llms/rikiki-reference.md` (create) | Exhaustive LLM-ingestible component/attribute reference | 4 |
| `.claude/skills/rikiki-deck/SKILL.md` (create) | Deck-authoring skill | 4 |

---

# CHANTIER 1 — Fix presenter mode styles

### Task 1.1: Export the rikiki bundle URL from deck-root

**Why:** The presenter iframe must load the full rikiki component set. Today it guesses the URL from the theme href via a fragile regex. `deck-root.js` sits next to `index.js` in the flat `dist/`, so `import.meta.url` gives us a reliable anchor.

**Files:**
- Modify: `src/runtime/deck-root.ts` (after the imports, before `type Slide`)

- [ ] **Step 1: Add the exported constant**

In `src/runtime/deck-root.ts`, immediately after the `import` block (after line 10), add:

```ts
/**
 * Absolute URL of the full rikiki bundle (`index.js`), derived from this
 * module's own URL. The built `dist/` is flat, so `deck-root.js` and
 * `index.js` are siblings — this resolves correctly whether the deck is
 * served locally or from a CDN. Consumed by the presenter window to load
 * rikiki inside its slide-mirror iframes.
 */
export const RIKIKI_BUNDLE_URL = new URL('./index.js', import.meta.url).href;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/runtime/deck-root.ts
git commit -m "feat(rikiki): expose RIKIKI_BUNDLE_URL from deck-root runtime"
```

---

### Task 1.2: Carry the bundle URL into PresenterState and use it in wrapFrame

**Files:**
- Modify: `src/runtime/deck-presenter.ts`

- [ ] **Step 1: Import the bundle URL and extend PresenterState**

At the top of `src/runtime/deck-presenter.ts`, change the import on line 22 from:

```ts
import type { DeckRoot } from './deck-root.js';
```

to:

```ts
import { RIKIKI_BUNDLE_URL, type DeckRoot } from './deck-root.js';
```

In the `PresenterState` interface (lines 26–37), add a `bundleHref` field after `themeHref`:

```ts
  // Tokens.css URL so the popup looks like the deck
  themeHref: string;
  // Absolute URL of the rikiki bundle so iframes can upgrade <deck-*> elements
  bundleHref: string;
```

- [ ] **Step 2: Populate bundleHref in readState**

In `readState` (lines 57–64), add `bundleHref` to the returned object:

```ts
  return {
    current: current + 1,
    total: slides.length,
    slideHtml: slide?.outerHTML ?? '',
    nextHtml: next?.outerHTML ?? null,
    notes,
    themeHref,
    bundleHref: RIKIKI_BUNDLE_URL,
  };
```

- [ ] **Step 3: Replace the fragile regex in the popup's wrapFrame**

In `PRESENTER_HTML`, replace the `wrapFrame` function (lines 183–193) with one that uses the passed `bundleHref`, activates the slide, and drops the `!important` hack:

```js
  function wrapFrame(slideHtml) {
    const themeHref  = ${JSON.stringify(initial.themeHref)};
    const bundleHref = ${JSON.stringify(initial.bundleHref)};
    const themeLink  = themeHref ? '<link rel="stylesheet" href="' + themeHref + '">' : '';
    // Mark the cloned slide [active] so its real component CSS applies
    // (:host([active]){display:flex}) instead of forcing display via !important.
    const activeSlide = slideHtml.replace(/^(\\s*<deck-[a-z-]+)/i, '$1 active');
    return '<!doctype html><html><head><meta charset="UTF-8">' + themeLink +
      '<script type="module" src="' + bundleHref + '"><' + '/script>' +
      '<style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#0f1422}' +
      'deck-root{position:absolute;inset:0}</style>' +
      '</head><body><deck-root>' + activeSlide + '</deck-root></body></html>';
  }
```

Note: `deck-root` does its own `firstUpdated` scan and sets `[active]` on the first slide anyway, but pre-marking guarantees correct paint before the bundle finishes loading, and removes reliance on the `!important` override.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: esbuild completes, `dist/deck-presenter.js` and `dist/deck-root.js` regenerated, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/runtime/deck-presenter.ts dist/
git commit -m "fix(rikiki): presenter iframes load rikiki via reliable bundle URL"
```

---

### Task 1.3: Clip iframe corners and make the presenter grid responsive

**Files:**
- Modify: `src/runtime/deck-presenter.ts` (the `<style>` block, lines 78–130)

- [ ] **Step 1: Update the panel/body/grid CSS**

In the `<style>` block of `PRESENTER_HTML`, replace the `.grid` rule (lines 80–88) and the `.panel .body` / `.panel iframe` rules (lines 105–106) with:

```css
  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr auto;
    gap: clamp(8px, 1.5vw, 16px);
    padding: clamp(8px, 1.5vw, 16px);
    height: 100vh;
    box-sizing: border-box;
  }
  @media (max-width: 1000px) {
    .grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr auto auto; }
  }
```

And replace lines 105–106:

```css
  .panel .body { flex: 1; min-height: 0; padding: 16px; overflow: hidden; border-radius: 8px; }
  .panel iframe { width: 100%; height: 100%; border: 0; background: #0f1422; display: block; }
```

(Moving `border-radius` + `overflow:hidden` to `.body` clips the iframe corners; the iframe background matches the popup chrome to avoid a white flash.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Visual verification with Playwright**

Serve and screenshot the presenter popup:

```bash
cd <repo>/rikiki && python3 -m http.server 7799 &
```

Using Playwright MCP:
1. `browser_navigate` to `http://localhost:7799/starter.html`
2. `browser_press_key` `p` (opens presenter — it's a popup window; use `browser_tabs` to list/select it)
3. `browser_take_screenshot` of the presenter tab.

Expected: the "Current" and "Next" panels show the slide **fully styled** (cover layout with brand/title, not raw unstyled HTML), corners are rounded/clipped, no white flash. Kill the server when done (`kill %1`).

If the slide still renders unstyled, STOP and use superpowers:systematic-debugging — check the iframe's network tab (`browser_network_requests`) for a failed bundle load and confirm `bundleHref` resolved to a real URL.

- [ ] **Step 4: Commit**

```bash
git add src/runtime/deck-presenter.ts dist/
git commit -m "fix(rikiki): clip presenter iframe corners + responsive presenter grid"
```

---

# CHANTIER 2 — Animations plugin "click stages"

### Task 2.1: Create the click-stages plugin

**Why:** Slidev-style per-element reveals. Mirrors `installShiki()`: opt-in, patches the `deck-root` prototype's step methods, injects CSS into the deck-root shadow root. State is derived purely from the slide's `step` so it serializes into presenter iframes.

**Files:**
- Create: `src/plugins/click-stages.ts`

- [ ] **Step 1: Write the plugin**

Create `src/plugins/click-stages.ts`:

```ts
// ════════════════════════════════════════════════════════════════
// Per-element "click stages" · Slidev-style v-click for rikiki.
// NOT in the core bundle · opt-in like the Shiki plugin.
//
// Usage in a deck:
//   <script type="module">
//     import { installClickStages } from './rikiki/dist/click-stages.js';
//     installClickStages();
//   </script>
//
// Then annotate any element inside a slide:
//   <p data-click>appears on the next click</p>
//   <p data-click="2">appears at step 2</p>
//   <p data-click-hide>visible first, hidden on the next click</p>
//   <p data-click data-anim="slide-up">reveal sliding up</p>
//
//   data-anim · fade (default) | slide-up | slide-left | scale
//
// The plugin patches deck-root so its step counter (the dots at the
// bottom) accounts for [data-click] elements, and so stepping toggles
// their visibility. Respects prefers-reduced-motion.
// ════════════════════════════════════════════════════════════════

interface DeckRootProto {
  _maxSteps(): number;
  _applyStep(): void;
  current: number;
  step: number;
  // slides is private on the class; typed loosely here for the patch.
  slides?: HTMLElement[];
}

const REVEAL_ATTR = 'data-click';
const HIDE_ATTR = 'data-click-hide';

/** Highest explicit step referenced by [data-click]/[data-click-hide] in a slide,
 *  plus an implicit +1 per bare (value-less) attribute, mirroring Slidev's
 *  auto-incrementing click counter. Returns the number of extra steps the slide
 *  needs beyond what deck-root already counts. */
function clickStepCount(slide: HTMLElement): number {
  let auto = 0;
  let maxExplicit = 0;
  const els = slide.querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}]`);
  els.forEach((el) => {
    const raw = el.getAttribute(REVEAL_ATTR) ?? el.getAttribute(HIDE_ATTR) ?? '';
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) maxExplicit = Math.max(maxExplicit, n);
    else auto += 1;
  });
  return Math.max(maxExplicit, auto);
}

/** Resolve the click step each annotated element belongs to. Bare attributes
 *  get sequential steps in document order; explicit numbers are honored. */
function assignSteps(slide: HTMLElement): Array<{ el: HTMLElement; step: number; hide: boolean }> {
  let cursor = 0;
  const out: Array<{ el: HTMLElement; step: number; hide: boolean }> = [];
  slide.querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}]`).forEach((el) => {
    const hide = el.hasAttribute(HIDE_ATTR);
    const raw = el.getAttribute(hide ? HIDE_ATTR : REVEAL_ATTR) ?? '';
    const explicit = parseInt(raw, 10);
    const step = Number.isFinite(explicit) && explicit > 0 ? explicit : ++cursor;
    out.push({ el, step, hide });
  });
  return out;
}

const PREP = new WeakSet<HTMLElement>();

/** Set the initial hidden/visible state + transition on each annotated element. */
function prepare(el: HTMLElement, hide: boolean): void {
  if (PREP.has(el)) return;
  PREP.add(el);
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.style.transition = reduce ? 'opacity 0.01s linear' : 'opacity 0.32s ease, transform 0.32s cubic-bezier(0.22,1,0.36,1)';
  el.style.willChange = 'opacity, transform';
  // hide-on-click elements start visible; reveal elements start hidden.
  setVisible(el, hide);
}

function animOffset(el: HTMLElement): string {
  switch (el.getAttribute('data-anim')) {
    case 'slide-up':   return 'translateY(16px)';
    case 'slide-left': return 'translateX(16px)';
    case 'scale':      return 'scale(0.92)';
    default:           return 'none'; // fade
  }
}

function setVisible(el: HTMLElement, visible: boolean): void {
  el.style.opacity = visible ? '1' : '0';
  el.style.transform = visible ? 'none' : animOffset(el);
  el.style.pointerEvents = visible ? '' : 'none';
}

export function installClickStages(): void {
  const ctor = customElements.get('deck-root') as (typeof HTMLElement & { prototype: DeckRootProto }) | undefined;
  if (!ctor) {
    console.warn('[rikiki/click-stages] <deck-root> is not defined yet · import rikiki first');
    return;
  }
  const proto = ctor.prototype;
  if ((proto as unknown as { _clickStagesInstalled?: boolean })._clickStagesInstalled) return;
  (proto as unknown as { _clickStagesInstalled?: boolean })._clickStagesInstalled = true;

  const origMax = proto._maxSteps;
  proto._maxSteps = function (this: DeckRootProto): number {
    const base = origMax.call(this);
    const slide = this.slides?.[this.current];
    const clicks = slide ? clickStepCount(slide) : 0;
    return Math.max(base, clicks);
  };

  const origApply = proto._applyStep;
  proto._applyStep = function (this: DeckRootProto): void {
    origApply.call(this);
    const slide = this.slides?.[this.current];
    if (!slide) return;
    assignSteps(slide).forEach(({ el, step, hide }) => {
      prepare(el, hide);
      // reveal: visible once we've reached its step. hide: hidden once reached.
      const reached = this.step >= step;
      setVisible(el, hide ? !reached : reached);
    });
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (If TS complains that `slides` is private on `DeckRoot`, that's fine — we type the prototype loosely via `DeckRootProto`; the plugin file does not import the class type.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `dist/click-stages.js` produced (flattened from `src/plugins/`).

- [ ] **Step 4: Commit**

```bash
git add src/plugins/click-stages.ts dist/
git commit -m "feat(rikiki): click-stages plugin for per-element reveal animations"
```

---

### Task 2.2: Verify click-stages in a real deck

**Files:**
- Create (temporary, do not commit): `/tmp/rikiki-clicks.html`

- [ ] **Step 1: Write a probe deck**

Create `/tmp/rikiki-clicks.html`:

```html
<!doctype html><html><head><meta charset="UTF-8">
<link rel="stylesheet" href="http://localhost:7799/tokens.css">
<script type="module" src="http://localhost:7799/dist/index.js"></script>
<script type="module">
  import { installClickStages } from 'http://localhost:7799/dist/click-stages.js';
  installClickStages();
</script>
</head><body>
<deck-root>
  <deck-feature eyebrow="Demo">
    <h1 slot="title">Click stages</h1>
    <p data-click data-anim="slide-up">First reveal</p>
    <p data-click data-anim="slide-left">Second reveal</p>
    <p data-click="3" data-anim="scale">Third (explicit)</p>
  </deck-feature>
</deck-root>
</body></html>
```

- [ ] **Step 2: Serve + drive with Playwright**

```bash
cd <repo>/rikiki && python3 -m http.server 7799 &
```

Playwright MCP:
1. `browser_navigate` to `http://localhost:7799/../../../tmp/rikiki-clicks.html` — if the path is awkward, instead copy the probe into the repo root as `__clicks.html` (gitignored / deleted after) and load `http://localhost:7799/__clicks.html`.
2. `browser_take_screenshot` (step 0 — only the title visible).
3. `browser_press_key` `ArrowRight`, screenshot (first paragraph now visible).
4. Repeat twice more; confirm each paragraph appears in order and the bottom step-dots show 3 steps.

Expected: paragraphs reveal one per click with their animation; step dots reflect 3 steps. Kill server (`kill %1`), remove the probe file.

- [ ] **Step 3: No commit** (verification only).

---

# CHANTIER 3 — Multi-deck assembly via Vite

### Task 3.1: Create the deck assembler

**Why:** Build one deck HTML from an ordered list of partial files (`.html` slide fragments and `.md` files). Output is a normal rikiki deck that also feeds `bundle.mjs`.

**Files:**
- Create: `build/vite-deck.mjs`
- Create: `decks/example/deck.config.js`
- Create: `decks/example/parts/cover.html`, `decks/example/parts/intro.md`, `decks/example/parts/closing.html`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Write the assembler**

Create `build/vite-deck.mjs`:

```js
#!/usr/bin/env node
// rikiki/build/vite-deck.mjs · assemble one deck HTML from partials.
//
//   node build/vite-deck.mjs decks/example/deck.config.js
//   node build/vite-deck.mjs decks/example/deck.config.js dist-decks/example.html
//
// deck.config.{js,json} shape:
//   export default {
//     title: 'My talk',
//     theme: 'tokens.css',            // href, relative to the OUTPUT file
//     bundle: 'dist/index.js',        // rikiki bundle href, relative to OUTPUT
//     transition: 'slide',            // optional <deck-root transition="...">
//     slides: ['parts/cover.html', 'parts/intro.md', 'parts/closing.html'],
//   };
//
// .html partials are inlined verbatim (one or more <deck-*> elements).
// .md partials are wrapped into a <deck-feature><deck-md>…</deck-md></deck-feature>
// slide so plain Markdown files become slides with zero ceremony.

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('usage: node build/vite-deck.mjs <deck.config.{js,json}> [output.html]');
  process.exit(1);
}

const configPath = resolve(process.cwd(), args[0]);
if (!existsSync(configPath) || !statSync(configPath).isFile()) {
  console.error('vite-deck · config not found: ' + configPath);
  process.exit(1);
}
const configDir = dirname(configPath);

async function loadConfig(p) {
  if (extname(p) === '.json') return JSON.parse(readFileSync(p, 'utf8'));
  const mod = await import(pathToFileURL(p).href);
  return mod.default ?? mod;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPartial(absPath) {
  const body = readFileSync(absPath, 'utf8');
  if (extname(absPath) === '.md') {
    // Wrap markdown into a slide. <deck-md> deindents + parses at runtime,
    // so we keep the raw markdown but escape HTML-special chars defensively
    // only for the rare `<` that is not intended as markup. Markdown authors
    // expect raw text, so we inline verbatim inside the element.
    return '<deck-feature>\n<deck-md>\n' + body.trimEnd() + '\n</deck-md>\n</deck-feature>';
  }
  return body.trimEnd();
}

const config = await loadConfig(configPath);
if (!Array.isArray(config.slides) || config.slides.length === 0) {
  console.error('vite-deck · config.slides must be a non-empty array');
  process.exit(1);
}

const outputPath = args[1]
  ? resolve(process.cwd(), args[1])
  : resolve(configDir, (config.title || 'deck').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html');

const slidesHtml = config.slides.map((rel) => {
  const abs = resolve(configDir, rel);
  if (!existsSync(abs)) {
    console.error('vite-deck · partial not found: ' + abs);
    process.exit(1);
  }
  return renderPartial(abs);
}).join('\n\n');

const themeHref  = config.theme  ?? 'tokens.css';
const bundleHref = config.bundle ?? 'dist/index.js';
const transitionAttr = config.transition ? ` transition="${config.transition}"` : '';

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(config.title ?? 'Rikiki deck')}</title>
<link rel="stylesheet" href="${themeHref}">
<script type="module" src="${bundleHref}"></script>
</head>
<body>
<deck-root${transitionAttr}>
${slidesHtml}
</deck-root>
</body>
</html>
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, doc);
console.error('vite-deck · wrote ' + relative(process.cwd(), outputPath) + ' · ' + config.slides.length + ' partial(s)');
```

(Note: the assembler is pure Node — Vite is not needed to *concatenate*. The "vite" in the name signals it produces a deck that flows into the existing Vite-based `bundle.mjs` for single-file export. This keeps the toolchain coherent without adding a redundant Vite pass.)

- [ ] **Step 2: Create the example deck partials**

Create `decks/example/parts/cover.html`:

```html
<deck-cover brand="rikiki · multi-deck" speaker="You" duration="~10 min" audience="Team">
  <h1>Assembled <span class="accent">deck</span></h1>
  <p class="sub">Built from partials via deck.config.js</p>
</deck-cover>
```

Create `decks/example/parts/intro.md`:

```markdown
## Why partials

Split a long talk into small files. **Reuse** slides across decks.
Assemble at build time — zero added runtime weight.

- one fragment per file
- ordered by `deck.config.js`
- `.md` files become slides automatically
```

Create `decks/example/parts/closing.html`:

```html
<deck-takeaway>
  <h1>Ship it</h1>
  <p>One config, many partials, one deck.</p>
</deck-takeaway>
```

- [ ] **Step 3: Create the config**

Create `decks/example/deck.config.js`:

```js
export default {
  title: 'Multi-deck example',
  // Output sits in decks/example/, so rikiki lives three levels up.
  theme: '../../tokens.css',
  bundle: '../../dist/index.js',
  transition: 'slide',
  slides: [
    'parts/cover.html',
    'parts/intro.md',
    'parts/closing.html',
  ],
};
```

- [ ] **Step 4: Add npm scripts**

In `package.json`, add to `"scripts"`:

```json
    "deck": "node build/vite-deck.mjs",
    "deck:example": "node build/vite-deck.mjs decks/example/deck.config.js"
```

- [ ] **Step 5: Run the assembler**

Run: `npm run deck:example`
Expected: prints `vite-deck · wrote decks/example/multi-deck-example.html · 3 partial(s)`.

- [ ] **Step 6: Visual verification**

```bash
cd <repo>/rikiki && python3 -m http.server 7799 &
```

Playwright MCP: `browser_navigate` to `http://localhost:7799/decks/example/multi-deck-example.html`, `browser_take_screenshot`. Press `ArrowRight` twice, screenshot each. Expected: cover slide → markdown intro slide → takeaway slide, all styled. Kill server.

- [ ] **Step 7: Verify it bundles**

Run: `node bundle.mjs decks/example/multi-deck-example.html /tmp/example.bundle.html`
Expected: writes the single-file bundle, prints size. (Confirms multi-deck output feeds the existing bundler.)

- [ ] **Step 8: Commit**

```bash
git add build/vite-deck.mjs decks/ package.json
git commit -m "feat(rikiki): multi-deck assembly from partials via deck.config"
```

---

# CHANTIER 4 — LLM docs + skill

### Task 4.1: Write the LLM reference doc

**Why:** A single, exhaustive, self-consistent reference an LLM can ingest to author valid decks. Must reflect chantiers 1–3.

**Files:**
- Create: `docs/llms/rikiki-reference.md`

- [ ] **Step 1: Gather the authoritative component list**

Run: `ls src/atoms src/molecules src/layouts src/runtime` and open each component file's header comment (lines 1–20) for its tag, attributes, and slots. Cross-check tokens in `themes/rikiki.css`.

- [ ] **Step 2: Write the reference**

Create `docs/llms/rikiki-reference.md` with these sections (use the real attributes/slots read in Step 1 — do not invent):

1. **What rikiki is** — Lit Web Components, zero-build consumer, `<deck-root>` wraps `deck-*` slides; load order is theme CSS then `dist/index.js`.
2. **Minimal deck** — copy the head + `<deck-root>` skeleton from `starter.html`.
3. **Navigation & hash** — keys (←/→/↑/↓, Space, Home/End, O, P, ?, B/W), hash format `#slide`, `#slide.step`, `#chap.slide` / `#chap.slidesStep`.
4. **Layouts** — table: tag · purpose · key attributes · slots. Cover `deck-cover, deck-section, deck-feature, deck-split, deck-feature-cards, deck-photo, deck-takeaway`.
5. **Molecules** — `deck-callout, deck-card, deck-md, deck-mermaid, deck-stat, deck-metric, deck-tier-list, deck-step-list, deck-shortcut, deck-stack, deck-grid`.
6. **Atoms** — `deck-badge, deck-kicker, deck-punch, deck-code` (incl. `lang`, `hero`, `nested`, `step-groups`).
7. **Steps & animations** — `steps` attribute, `[data-step-block="N"]`, `deck-code[step-groups]`, and the **click-stages plugin**: `data-click`, `data-click="N"`, `data-click-hide`, `data-anim="fade|slide-up|slide-left|scale"`, install snippet.
8. **Presenter mode** — `P` opens speaker window; `<deck-notes>` holds notes.
9. **Multi-deck** — `deck.config.js` shape, `.html`/`.md` partials, `npm run deck <config>`.
10. **Theming tokens** — the `--rik-*` semantic layer (surface/text/status/accent/space/radius/font/motion); how to override at `:root` or per-component.
11. **Bundling** — `node bundle.mjs <deck.html>` for single-file export, `--no-fonts`.
12. **Authoring rules for LLMs** — always set `slot=` where a layout defines named slots; keep one focal idea per slide; prefer `deck-md` for prose; never nest `deck-root`.

- [ ] **Step 3: Self-consistency check**

Re-read the doc against `src/index.ts` (the canonical component list) and `themes/rikiki.css` (the canonical token list). Every tag and token named must exist. Fix mismatches inline.

- [ ] **Step 4: Commit**

```bash
git add docs/llms/rikiki-reference.md
git commit -m "docs(rikiki): LLM-ingestible component + authoring reference"
```

---

### Task 4.2: Create the deck-authoring skill

**Files:**
- Create: `.claude/skills/rikiki-deck/SKILL.md`

- [ ] **Step 1: Write the skill**

Create `.claude/skills/rikiki-deck/SKILL.md`:

```markdown
---
name: rikiki-deck
description: Use when creating or editing a rikiki presentation deck (HTML decks using <deck-root> and deck-* Web Components), assembling multi-file decks, adding click-stage animations, or bundling a deck to a single file. Triggers on "rikiki deck", "create a slide deck", "rikiki slides", "presentation deck".
---

# Authoring rikiki decks

Rikiki is a Lit Web Components presentation framework. Decks are plain HTML:
a theme stylesheet + `dist/index.js`, then a `<deck-root>` wrapping `deck-*`
slide elements. No build step is required to author or run a deck.

## Before you start

Read the full component + attribute reference:
`docs/llms/rikiki-reference.md` (in the rikiki repo). It is the source of
truth for every tag, attribute, slot, and design token. Do not invent tags or
attributes — use only what the reference lists.

## Workflow

1. **Skeleton** — start from the head + `<deck-root>` shape in `starter.html`.
2. **Pick layouts per slide** — one focal idea each. `deck-cover` to open,
   `deck-section` for chapters, `deck-feature`/`deck-split` for content,
   `deck-takeaway` to close. Respect named `slot=` attributes.
3. **Prose** — put Markdown inside `<deck-md>`. Code inside `<deck-code lang="…">`.
4. **Reveals** — for step-by-step builds use `data-click` (install the
   click-stages plugin) or `deck-code[step-groups]`.
5. **Speaker notes** — add `<deck-notes>` inside a slide; press `P` to present.
6. **Multi-file decks** — split slides into `parts/*.html` / `*.md`, list them
   in `deck.config.js`, run `npm run deck decks/<name>/deck.config.js`.
7. **Share** — `node bundle.mjs <deck>.html` produces one self-contained file.

## Verify

Serve with `python3 -m http.server` and open the deck; click through every
slide and every step. Confirm slides are styled and reveals fire in order.

## Rules

- Never nest `<deck-root>`.
- Load theme CSS before `dist/index.js`.
- Use semantic `--rik-*` tokens for any color/spacing override, at `:root`.
- Keep one idea per slide; move detail into speaker notes.
```

- [ ] **Step 2: Sanity-check the frontmatter**

Run: `head -5 .claude/skills/rikiki-deck/SKILL.md`
Expected: valid YAML frontmatter with `name` and `description`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/rikiki-deck/SKILL.md
git commit -m "docs(rikiki): deck-authoring skill pointing at the LLM reference"
```

---

# CHANTIER 5 — Fix broken demo buttons on the landing page (DONE)

Added after the user reported the "démos" slide buttons no longer working.
Investigated with systematic-debugging (live reproduction via `astro dev` +
Playwright). **Two distinct root causes found and fixed; both verified live.**

> Note on repo layout: `rikiki/` and `site/` are subdirectories of a single
> monorepo rooted at `<repo>` (no submodule).
> One commit covers both files.

### Bug A — "Next slide" button dead (site)

**Root cause:** `site/src/components/LiveDemo.astro` dispatches a synthetic
`KeyboardEvent` with `key` taken verbatim from `data-key="Space"`. Rikiki's
`deck-root._onKey` matches the spacebar as `e.key === ' '` (the space char),
not `"Space"` (which is `KeyboardEvent.code`). So Next never advanced, while
the autoplay path (which sends `' '`) worked — a confusing asymmetry.

**Evidence:** dispatching `{key:'Space'}` → hash unchanged; `{key:' '}` →
hash advances. Previous/Overview/Shortcuts buttons (`ArrowLeft`/`o`/`?`) all
matched and worked.

**Fix (applied):** normalize the logical name in `sendKey` —
`const key = name === 'Space' ? ' ' : name;`. Verified: Next now advances
(#8 → #9).

### Bug B — `SecurityError` spam from srcdoc preview decks (rikiki)

**Root cause:** the landing page embeds 7 `LayoutPreview` + 1 `ThemeSwap`
decks via iframe `srcdoc`. On every navigation, `deck-root._writeHash` calls
`history.replaceState(null,'','#n')`, which throws `SecurityError` in an
`about:srcdoc` document (opaque origin can't replaceState to a real URL).
Autoplay made it fire continuously (39+ console errors and climbing).

**Fix (applied):** wrap the `replaceState` call in `try/catch` in
`src/runtime/deck-root.ts:_writeHash` (the slide already updated visually;
deep-linking is simply unavailable in srcdoc embeds). Rebuilt `dist/`.
Verified: srcdoc iframes run the wrapped `_writeHash`; **0 console errors**
after a clean reload (was 39+).

### Files touched (Chantier 5)
- `site/src/components/LiveDemo.astro` — key normalization
- `rikiki/src/runtime/deck-root.ts` — `_writeHash` try/catch
- `rikiki/dist/*` — rebuilt

---

## Final verification

- [ ] `npm run typecheck` — PASS
- [ ] `npm run build` — PASS, flat `dist/` regenerated including `click-stages.js`
- [ ] `npm run deck:example` — assembles the example deck
- [ ] Playwright screenshots from Tasks 1.3, 2.2, 3.6 confirm: presenter slides styled, click stages reveal in order, multi-deck renders.
- [ ] All commits made; working tree clean.

## Self-review notes (author)

- **Spec coverage:** Chantier 1 → Tasks 1.1–1.3; Chantier 2 → 2.1–2.2; Chantier 3 → 3.1; Chantier 4 → 4.1–4.2. All four covered.
- **Shared-file ordering:** `deck-root.ts` touched only in 1.1 (additive export) before 2.1 patches its prototype at runtime — no conflict. `package.json` touched only in 3.1. `index.ts` is **not** modified (plugins stay opt-in, never imported by core) — confirmed against `src/index.ts`.
- **Types:** `RIKIKI_BUNDLE_URL` (1.1) consumed in 1.2; `installClickStages` patches `_maxSteps`/`_applyStep` which exist in `deck-root.ts:397,487`; `slides` is private but accessed via loose `DeckRootProto` typing — documented in Task 2.1 Step 2.
