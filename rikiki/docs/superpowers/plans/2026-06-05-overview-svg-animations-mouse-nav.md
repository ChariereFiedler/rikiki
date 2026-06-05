# Overview×SVG fix · click-stages v2 · Mouse navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix SVG rendering in overview thumbnails, extend the click-stages plugin (timing, auto stages, stagger, View-Transitions morph), and add default-on configurable mouse navigation.

**Architecture:** Three sequential chantiers per the approved spec (`docs/superpowers/specs/2026-06-05-overview-svg-animations-mouse-nav-design.md`). Chantier 1 replaces the overview's raw `cloneNode` with a snapshot pipeline (mermaid SVG serialization + ID namespacing + dimension freeze). Chantier 2 extends `src/plugins/click-stages.ts` (still one opt-in plugin, backward compatible) and adds a one-line skip-guard to `deck-transition.ts`. Chantier 3 adds a `mouse-nav` attribute and four mechanisms to `deck-root.ts`.

**Tech Stack:** Lit 3, TypeScript, esbuild (`node build.mjs`), no test framework — verification is `npx tsc --noEmit` + `node build.mjs` + Playwright MCP passes on fixture decks under `decks/tests/`.

**Conventions for every task:**
- Run commands from `<repo>/rikiki/`.
- `dist/` is committed in this repo: every commit that touches `src/` also includes the rebuilt `dist/` (`node build.mjs` regenerates it; `build-standalone.mjs` only at the final task).
- Browser verification: serve with `python3 -m http.server 8765` (background) from the rikiki directory, then drive `http://localhost:8765/decks/tests/<fixture>.html` with the Playwright MCP tools.
- Commit messages follow repo style (`fix(rikiki): …`, `feat(rikiki): …`), never mention AI/Claude.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/molecules/deck-mermaid.ts` | Modify | Expose `renderedSvg` + `whenRendered` for the overview |
| `src/runtime/deck-overview.ts` | Modify | `snapshotSlide()` pipeline: mermaid snapshots, ID namespacing, dimension freeze, async lazy build |
| `src/plugins/click-stages.ts` | Modify (large) | v2: timing attrs, new presets, auto stages, stagger, morph via View Transitions |
| `src/runtime/deck-transition.ts` | Modify (1 guard) | Skip classic transition when a morph view-transition runs |
| `src/runtime/deck-root.ts` | Modify | `mouse-nav` attribute, click/wheel/aux navigation, chevron UI |
| `src/runtime/deck-help.ts` | Modify | Mouse shortcuts section |
| `decks/tests/overview-svg.html` | Create | Fixture: inline SVG (gradient+marker) + mermaid slides |
| `decks/tests/stages.html` | Create | Fixture: timing/auto/stagger/morph choreographies |
| `decks/tests/mouse-nav.html` | Create | Fixture: mouse navigation, default + opt-out |
| `README.md`, `docs/llms/rikiki-reference.md`, `.claude/skills/rikiki-deck/SKILL.md` | Modify | Document everything |
| `package.json` | Modify | `0.2.0` → `0.3.0` |

---

# Chantier 1 — Overview × SVG

## Task 1: deck-mermaid · expose rendered SVG

**Files:**
- Modify: `src/molecules/deck-mermaid.ts`

- [x] **Step 1: Add the render promise and the two accessors**

In `src/molecules/deck-mermaid.ts`, replace the property block (lines ~75-77):

```ts
  @property({ type: Boolean, reflect: true }) rendered = false;
  @state() private _svg = '';
  private _source = '';
  private _renderPromise: Promise<void> | null = null;

  /** Rendered SVG markup · '' until the async render completes. Lets the
   *  overview build static thumbnails without reaching into this shadow root. */
  get renderedSvg(): string { return this._svg; }

  /** Resolves when the current render attempt settles (success or error). */
  get whenRendered(): Promise<void> { return this._renderPromise ?? Promise.resolve(); }
```

And in `connectedCallback()`, replace the final line `this._render();` with:

```ts
    this._renderPromise = this._render();
```

- [x] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && node build.mjs`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/molecules/deck-mermaid.ts dist
git commit -m "feat(rikiki): deck-mermaid exposes renderedSvg + whenRendered for overview snapshots"
```

## Task 2: deck-overview · snapshot pipeline

**Files:**
- Modify: `src/runtime/deck-overview.ts`

- [x] **Step 1: Add the snapshot helpers**

In `src/runtime/deck-overview.ts`, insert after `slideSearchText()` (line ~264):

```ts
interface MermaidLike extends HTMLElement {
  renderedSvg?: string;
  whenRendered?: Promise<void>;
}

/** Attributes whose value may carry url(#id) references. */
const URL_REF_ATTRS = [
  'fill', 'stroke', 'clip-path', 'mask', 'filter',
  'marker-start', 'marker-mid', 'marker-end', 'style',
];

/** Suffix every [id] inside root and rewrite url(#…) / href="#…" references
 *  so multiple clones can coexist in one shadow tree without collisions. */
function namespaceIds(root: HTMLElement, suffix: string): void {
  const renames = new Map<string, string>();
  root.querySelectorAll('[id]').forEach((el) => {
    renames.set(el.id, el.id + suffix);
    el.id = el.id + suffix;
  });
  if (renames.size === 0) return;
  const rewriteUrls = (value: string): string =>
    value.replace(/url\(['"]?#([^'")]+)['"]?\)/g, (m, id: string) =>
      renames.has(id) ? `url(#${renames.get(id)})` : m);
  root.querySelectorAll('*').forEach((el) => {
    for (const attr of URL_REF_ATTRS) {
      const v = el.getAttribute(attr);
      if (v && v.includes('url(')) el.setAttribute(attr, rewriteUrls(v));
    }
    for (const attr of ['href', 'xlink:href']) {
      const v = el.getAttribute(attr);
      if (v && v.startsWith('#') && renames.has(v.slice(1))) {
        el.setAttribute(attr, '#' + renames.get(v.slice(1)));
      }
    }
  });
}

/** Freeze light-DOM SVG dimensions from the live slide so SVGs without
 *  intrinsic size don't fall back to 300×150 in the thumbnail. Runs BEFORE
 *  mermaid replacement so live/clone <svg> lists stay index-aligned. */
function freezeSvgSizes(live: Slide, clone: HTMLElement): void {
  const liveSvgs = live.querySelectorAll('svg');
  clone.querySelectorAll('svg').forEach((svg, i) => {
    const rect = liveSvgs[i]?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      svg.setAttribute('width', String(Math.round(rect.width)));
      svg.setAttribute('height', String(Math.round(rect.height)));
      svg.style.maxWidth = '100%';
    } else if (svg.hasAttribute('viewBox') && !svg.hasAttribute('width')) {
      // Never-measured slide · derive a size from the viewBox aspect.
      const vb = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
      if (vb.length === 4 && vb[2]! > 0) {
        svg.setAttribute('width', String(vb[2]));
        svg.setAttribute('height', String(vb[3]));
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      }
    }
  });
}

/** Replace each cloned <deck-mermaid> (empty Lit state) with a static <div>
 *  containing the SVG serialized from the live component's shadow root. */
function snapshotMermaids(live: Slide, clone: HTMLElement): void {
  const liveM = live.querySelectorAll<MermaidLike>('deck-mermaid');
  clone.querySelectorAll('deck-mermaid').forEach((c, i) => {
    const src = liveM[i];
    const snap = document.createElement('div');
    snap.className = 'ov-mermaid-snap';
    snap.innerHTML = src?.renderedSvg ?? '';
    const rect = src?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      snap.style.width = rect.width + 'px';
      snap.style.height = rect.height + 'px';
    }
    c.replaceWith(snap);
  });
}

/** Thumbnail-safe clone of a slide · static mermaid, namespaced IDs,
 *  frozen SVG dimensions. */
function snapshotSlide(slide: Slide, idx: number): HTMLElement {
  const clone = slide.cloneNode(true) as HTMLElement;
  clone.setAttribute('active', '');
  freezeSvgSizes(slide, clone);
  snapshotMermaids(slide, clone);
  namespaceIds(clone, `-ov${idx}`);
  return clone;
}

/** Build a cell's thumbnail · awaits in-flight mermaid renders first so the
 *  snapshot serializes real SVG even for never-visited slides. */
async function buildThumb(cell: HTMLElement, src: Slide): Promise<void> {
  const pending = Array.from(src.querySelectorAll<MermaidLike>('deck-mermaid'))
    .map((m) => m.whenRendered)
    .filter((p): p is Promise<void> => !!p);
  if (pending.length) await Promise.all(pending).catch(() => undefined);
  const thumb = document.createElement('div');
  thumb.className = 'ov-thumb';
  thumb.appendChild(snapshotSlide(src, Number(cell.dataset['idx'])));
  cell.insertBefore(thumb, cell.firstChild);
  cell.dataset['loaded'] = '1';
  delete cell.dataset['building'];
}
```

- [x] **Step 2: Rewire the lazy observer**

Replace the existing `lazyObserver` callback body (the `const lazyObserver = new IntersectionObserver(…)` block, lines ~353-372) with:

```ts
  const lazyObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const cell = e.target as HTMLElement;
        if (cell.dataset['loaded'] || cell.dataset['building']) continue;
        const src = lazyLoad.get(cell);
        if (!src) continue;
        cell.dataset['building'] = '1';
        lazyObserver.unobserve(cell);
        void buildThumb(cell, src);
      }
    },
    { root: null, rootMargin: '300px 0px', threshold: 0 }
  );
```

(The shimmer CSS keys on `:not([data-loaded])`, so cells keep shimmering until the async snapshot lands — no CSS change needed for that.)

- [x] **Step 3: Add the snapshot CSS**

In the `STYLES` constant, after the `.ov-thumb > *` rule (line ~220), add:

```css
  :host([overview]) .ov-mermaid-snap {
    display: flex; align-items: center; justify-content: center;
    background: var(--rik-code__bg);
    border: 1px solid var(--rik-code__border);
    border-radius: var(--rik-radius-md);
    padding: var(--rik-space-4);
    overflow: hidden; min-width: 0;
  }
  :host([overview]) .ov-mermaid-snap svg {
    width: 100% !important; height: auto !important;
    max-width: 100% !important; max-height: 60vh;
  }
```

- [x] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && node build.mjs`
Expected: no errors.

- [x] **Step 5: Commit**

```bash
git add src/runtime/deck-overview.ts dist
git commit -m "fix(rikiki): overview thumbnails snapshot SVG · namespaced ids, static mermaid, frozen sizes"
```

## Task 3: Chantier 1 fixture + browser verification

**Files:**
- Create: `decks/tests/overview-svg.html`

- [x] **Step 1: Create the fixture**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>overview × svg fixture</title>
  <link rel="stylesheet" href="../../themes/rikiki.css">
  <script type="module" src="../../dist/index.js"></script>
</head>
<body>
  <deck-root>
    <deck-cover><h1>Overview SVG fixture</h1></deck-cover>

    <deck-feature>
      <h1>Inline SVG · gradient + marker</h1>
      <svg viewBox="0 0 400 120" width="400" height="120">
        <defs>
          <linearGradient id="grad"><stop offset="0" stop-color="#e0531f"/><stop offset="1" stop-color="#2a2520"/></linearGradient>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#e0531f"/>
          </marker>
        </defs>
        <rect x="10" y="10" width="180" height="100" fill="url(#grad)" rx="8"/>
        <line x1="200" y1="60" x2="380" y2="60" stroke="#e0531f" stroke-width="3" marker-end="url(#arrow)"/>
      </svg>
    </deck-feature>

    <deck-feature>
      <h1>Mermaid · visited</h1>
      <deck-mermaid>
        graph LR
        a[Edit] --> b[Save] --> c[Reload]
      </deck-mermaid>
    </deck-feature>

    <deck-feature><h1>Filler 1</h1></deck-feature>
    <deck-feature><h1>Filler 2</h1></deck-feature>

    <deck-feature>
      <h1>Mermaid · never visited</h1>
      <deck-mermaid>
        graph TD
        x[Open] --> y{Rendered?}
        y -->|yes| z[Snapshot]
      </deck-mermaid>
    </deck-feature>
  </deck-root>
</body>
</html>
```

- [x] **Step 2: Serve + verify in the browser**

```bash
python3 -m http.server 8765   # run in background
```

With Playwright MCP, navigate to `http://localhost:8765/decks/tests/overview-svg.html`, then:
1. Press `o` immediately (without visiting any slide beyond the first).
2. Take a screenshot of the overview grid.

Expected:
- Thumbnail 2 shows the gradient-filled rect **and** the arrow with its head (marker resolved).
- Thumbnails 3 and 6 both show rendered mermaid diagrams with visible arrowheads — including slide 6 which was never visited.
- No blank/empty mermaid boxes, no 300×150-collapsed or overflowing SVG.
- In the DOM (`browser_evaluate`): `document.querySelector('deck-root').shadowRoot.querySelectorAll('#overview-grid [id$="-ov1"]').length > 0` confirms ID namespacing.

3. Click thumbnail 2 → overview closes, slide 2 renders normally (live slide untouched by the namespacing — it operated on clones only).

If anything fails: use superpowers:systematic-debugging before patching.

- [x] **Step 3: Commit**

```bash
git add decks/tests/overview-svg.html
git commit -m "test(rikiki): overview svg fixture deck"
```

---

# Chantier 2 — click-stages v2

## Task 4: Timing attributes + extended presets (incl. draw)

**Files:**
- Modify: `src/plugins/click-stages.ts`

- [x] **Step 1: Replace the prepare/anim helpers**

In `src/plugins/click-stages.ts`, replace `prepare()`, `animOffset()` and `setVisible()` (lines ~68-94) with:

```ts
const PREP = new WeakSet<HTMLElement>();

const EASES: Record<string, string> = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.5, 1.8, 0.3, 1)',
  'in-out': 'cubic-bezier(0.45, 0, 0.55, 1)',
};

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** data-anim-duration / data-anim-delay (ms) + data-anim-ease (preset or raw
 *  cubic-bezier). Reduced motion collapses to a near-instant transition. */
function timingOf(el: HTMLElement): { dur: number; delay: number; ease: string } {
  if (reducedMotion()) return { dur: 1, delay: 0, ease: 'linear' };
  const dur = parseInt(el.getAttribute('data-anim-duration') ?? '', 10) || 320;
  const delay = parseInt(el.getAttribute('data-anim-delay') ?? '', 10) || 0;
  const easeRaw = el.getAttribute('data-anim-ease') ?? 'out';
  return { dur, delay, ease: EASES[easeRaw] ?? easeRaw };
}

const DRAW_SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';

/** Stroked SVG shapes targeted by data-anim="draw" · the element itself or
 *  every shape underneath it. */
function drawTargets(el: HTMLElement): SVGGeometryElement[] {
  if (el instanceof SVGGeometryElement) return [el];
  return Array.from(el.querySelectorAll<SVGGeometryElement>(DRAW_SHAPES));
}

function prepareDraw(el: HTMLElement, transition: string): void {
  drawTargets(el).forEach((s) => {
    const len = s.getTotalLength?.() ?? 0;
    if (!len) return;
    s.style.strokeDasharray = String(len);
    s.style.transition = transition;
  });
}

function applyDraw(el: HTMLElement, visible: boolean): void {
  drawTargets(el).forEach((s) => {
    const len = s.getTotalLength?.() ?? 0;
    if (!len) return;
    s.style.strokeDashoffset = visible ? '0' : String(len);
  });
  el.style.pointerEvents = visible ? '' : 'none';
}

/** Set the initial hidden/visible state + transition on each annotated element. */
function prepare(el: HTMLElement, hide: boolean): void {
  if (PREP.has(el)) return;
  PREP.add(el);
  const { dur, delay, ease } = timingOf(el);
  const anim = el.getAttribute('data-anim');
  const props =
    anim === 'blur' ? ['opacity', 'transform', 'filter'] :
    anim === 'draw' ? ['stroke-dashoffset'] :
    ['opacity', 'transform'];
  const transition = props.map((p) => `${p} ${dur}ms ${ease} ${delay}ms`).join(', ');
  if (anim === 'draw') {
    prepareDraw(el, transition);
  } else {
    el.style.transition = transition;
    el.style.willChange = props.join(', ');
  }
  // hide-on-click elements start visible; reveal elements start hidden.
  setVisible(el, hide);
}

function animOffset(el: HTMLElement): string {
  switch (el.getAttribute('data-anim')) {
    case 'slide-up':    return 'translateY(16px)';
    case 'slide-down':  return 'translateY(-16px)';
    case 'slide-left':  return 'translateX(16px)';
    case 'slide-right': return 'translateX(-16px)';
    case 'scale':       return 'scale(0.92)';
    case 'flip-up':     return 'perspective(600px) rotateX(35deg)';
    default:            return 'none'; // fade · blur
  }
}

function setVisible(el: HTMLElement, visible: boolean): void {
  if (el.getAttribute('data-anim') === 'draw') { applyDraw(el, visible); return; }
  el.style.opacity = visible ? '1' : '0';
  el.style.transform = visible ? 'none' : animOffset(el);
  if (el.getAttribute('data-anim') === 'blur') el.style.filter = visible ? 'none' : 'blur(12px)';
  el.style.pointerEvents = visible ? '' : 'none';
}
```

Also update the plugin's header comment to document the new attributes:

```ts
//   data-anim · fade (default) | slide-up | slide-down | slide-left |
//               slide-right | scale | blur | flip-up | draw (SVG strokes)
//   data-anim-duration="600" · ms (default 320)
//   data-anim-delay="120"    · ms (default 0)
//   data-anim-ease="out|spring|in-out|cubic-bezier(…)" (default out)
```

- [x] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && node build.mjs`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/plugins/click-stages.ts dist
git commit -m "feat(rikiki): click-stages per-element timing + slide-down/right, blur, flip-up, draw presets"
```

## Task 5: Auto stages + stagger + click-children

**Files:**
- Modify: `src/plugins/click-stages.ts`

- [x] **Step 1: Replace the stage model**

Replace `clickStepCount()` and `assignSteps()` (and their comments) with:

```ts
const REVEAL_ATTR = 'data-click';
const HIDE_ATTR = 'data-click-hide';
const AUTO_ATTR = 'data-click-auto';
const STAGGER_ATTR = 'data-click-stagger';
const CHILDREN_ATTR = 'data-click-children';

interface StageEntry {
  el: HTMLElement;
  /** Click step this element belongs to · 0 = revealed on slide activation. */
  step: number;
  hide: boolean;
  /** ms after the step is reached before the state flips (auto chain / stagger). */
  delay: number;
}

const EXPANDED = new WeakSet<HTMLElement>();

/** Materialize data-click-children sugar · each direct child becomes a bare
 *  data-click, inheriting the container's data-anim* unless it overrides. */
function expandClickChildren(slide: HTMLElement): void {
  slide.querySelectorAll<HTMLElement>(`[${CHILDREN_ATTR}]`).forEach((box) => {
    if (EXPANDED.has(box)) return;
    EXPANDED.add(box);
    Array.from(box.children).forEach((child) => {
      const c = child as HTMLElement;
      if (!c.hasAttribute(REVEAL_ATTR)) c.setAttribute(REVEAL_ATTR, '');
      for (const a of ['data-anim', 'data-anim-duration', 'data-anim-delay', 'data-anim-ease']) {
        const v = box.getAttribute(a);
        if (v && !c.hasAttribute(a)) c.setAttribute(a, v);
      }
    });
  });
}

/** Extra steps the slide needs beyond what deck-root counts. Explicit numbers
 *  set a floor; each bare data-click / data-click-hide / stagger container
 *  auto-increments; data-click-auto consumes no click. */
function clickStepCount(slide: HTMLElement): number {
  expandClickChildren(slide);
  let auto = 0;
  let maxExplicit = 0;
  slide
    .querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}], [${STAGGER_ATTR}]`)
    .forEach((el) => {
      if (el.hasAttribute(STAGGER_ATTR)) { auto += 1; return; }
      const raw = el.getAttribute(REVEAL_ATTR) ?? el.getAttribute(HIDE_ATTR) ?? '';
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n > 0) maxExplicit = Math.max(maxExplicit, n);
      else auto += 1;
    });
  return Math.max(maxExplicit, auto);
}

/** Walk annotated elements in document order and resolve each one's stage. */
function collectEntries(slide: HTMLElement): StageEntry[] {
  expandClickChildren(slide);
  const out: StageEntry[] = [];
  let cursor = 0;     // last assigned click step
  let autoAccum = 0;  // chained data-click-auto delays since that step
  slide
    .querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}], [${AUTO_ATTR}], [${STAGGER_ATTR}]`)
    .forEach((el) => {
      if (el.hasAttribute(STAGGER_ATTR)) {
        // Container consumes one click · children cascade in.
        const gap = parseInt(el.getAttribute(STAGGER_ATTR) ?? '', 10) || 80;
        const step = ++cursor;
        autoAccum = 0;
        Array.from(el.children).forEach((child, i) => {
          out.push({ el: child as HTMLElement, step, hide: false, delay: i * gap });
        });
        return;
      }
      if (el.hasAttribute(AUTO_ATTR)) {
        // No click consumed · fires after the previous stage (or slide
        // activation when cursor is still 0). Consecutive autos chain.
        autoAccum += parseInt(el.getAttribute(AUTO_ATTR) ?? '', 10) || 0;
        out.push({ el, step: cursor, hide: false, delay: autoAccum });
        return;
      }
      const hide = el.hasAttribute(HIDE_ATTR);
      const raw = el.getAttribute(hide ? HIDE_ATTR : REVEAL_ATTR) ?? '';
      const explicit = parseInt(raw, 10);
      const isExplicit = Number.isFinite(explicit) && explicit > 0;
      const step = isExplicit ? explicit : ++cursor;
      if (!isExplicit) autoAccum = 0;
      out.push({ el, step, hide, delay: 0 });
    });
  return out;
}
```

- [x] **Step 2: Replace the `_applyStep` patch with the timer-aware version**

Replace the `proto._applyStep` override inside `installClickStages()` with:

```ts
  const TIMERS = new WeakMap<HTMLElement, number>();
  function cancelTimer(el: HTMLElement): void {
    const t = TIMERS.get(el);
    if (t !== undefined) { window.clearTimeout(t); TIMERS.delete(el); }
  }
  function scheduleVisible(el: HTMLElement, visible: boolean, delay: number): void {
    cancelTimer(el);
    TIMERS.set(el, window.setTimeout(() => {
      TIMERS.delete(el);
      setVisible(el, visible);
    }, delay));
  }

  // Previous (slide, step) per host · lets us tell "just reached this step"
  // (animate with delays) apart from "jumped past it" (settle immediately).
  const LAST = new WeakMap<object, { slide: number; step: number }>();

  const origApply = proto._applyStep;
  proto._applyStep = function (this: DeckRootProto): void {
    origApply.call(this);
    const slide = this.slides?.[this.current];
    if (!slide) return;
    const last = LAST.get(this);
    const prevStep = last && last.slide === this.current ? last.step : -1;
    LAST.set(this, { slide: this.current, step: this.step });

    collectEntries(slide).forEach(({ el, step, hide, delay }) => {
      prepare(el, hide);
      cancelTimer(el);
      const reached = this.step >= step;
      const target = hide ? !reached : reached;
      // Delays only play when we land exactly on the step coming from before
      // it · deep links and back-navigation settle instantly.
      const justReached = reached && this.step === step ? prevStep < step : false;
      const autoChain = reached && step === 0 && prevStep === -1; // slide entry
      if (delay > 0 && (justReached || autoChain)) {
        setVisible(el, hide);             // hold the pre-state…
        scheduleVisible(el, target, delay); // …then flip after the delay
      } else {
        setVisible(el, target);
      }
    });
  };
```

(`prevStep < step` is false when `prevStep === -1` only for `step === 0`; the
`autoChain` clause covers that slide-activation case for `data-click-auto`.)

- [x] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && node build.mjs`
Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/plugins/click-stages.ts dist
git commit -m "feat(rikiki): click-stages auto stages, group stagger, data-click-children sugar"
```

## Task 6: Morph via View Transitions

**Files:**
- Modify: `src/plugins/click-stages.ts`
- Modify: `src/runtime/deck-transition.ts`

- [x] **Step 1: Extend the DeckRootProto interface**

In `src/plugins/click-stages.ts`, add `_goTo` to the interface:

```ts
interface DeckRootProto {
  _maxSteps(): number;
  _applyStep(): void;
  _goTo(idx: number): void;
  current: number;
  step: number;
  // slides is private on the class; typed loosely here for the patch.
  slides?: HTMLElement[];
}

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};
```

- [x] **Step 2: Add the morph helpers (module level)**

```ts
const MORPH_ATTR = 'data-morph';
/** True while one of our view transitions is running · prevents nesting. */
let vtActive = false;

function morphGroups(root: HTMLElement): Map<string, HTMLElement[]> {
  const map = new Map<string, HTMLElement[]>();
  root.querySelectorAll<HTMLElement>(`[${MORPH_ATTR}]`).forEach((el) => {
    const key = el.getAttribute(MORPH_ATTR);
    if (!key) return;
    map.set(key, [...(map.get(key) ?? []), el]);
  });
  return map;
}

function matchedMorphKeys(a: HTMLElement, b: HTMLElement): string[] {
  const kb = morphGroups(b);
  return Array.from(morphGroups(a).keys()).filter((k) => kb.has(k));
}

const cssKey = (key: string): string => key.replace(/[^a-zA-Z0-9_-]/g, '_');

/** Give the visible element of each morph key a view-transition-name and
 *  'none' to the rest · duplicate names abort a view transition. Visibility
 *  comes from the entries model when provided, else from inline opacity. */
function nameVisibleMorphs(root: HTMLElement, targets?: Map<HTMLElement, boolean>): void {
  morphGroups(root).forEach((els, key) => {
    let named = false;
    els.forEach((el) => {
      const visible = targets?.get(el) ?? el.style.opacity !== '0';
      const take = visible && !named;
      if (take) named = true;
      el.style.viewTransitionName = take ? `rk-morph-${cssKey(key)}` : 'none';
    });
  });
}
```

- [x] **Step 3: Wrap intra-slide step changes**

In the patched `_applyStep` from Task 5, wrap the `collectEntries(slide).forEach(…)` block: extract it into a local `const run = () => { … }`, then:

```ts
    const entries = collectEntries(slide);
    const run = () =>
      entries.forEach(({ el, step, hide, delay }) => {
        /* …exact same body as Task 5… */
      });

    const svt = (document as DocWithVT).startViewTransition?.bind(document);
    const stepChanged = prevStep !== -1 && prevStep !== this.step;
    if (svt && stepChanged && !vtActive && !reducedMotion() && slide.querySelector(`[${MORPH_ATTR}]`)) {
      const targets = new Map(
        entries.map(({ el, step, hide }) => [el, hide ? this.step < step : this.step >= step])
      );
      nameVisibleMorphs(slide);          // old state, before capture
      vtActive = true;
      svt(() => { run(); nameVisibleMorphs(slide, targets); })
        .finished.finally(() => { vtActive = false; });
    } else {
      run();
    }
```

- [x] **Step 4: Patch `_goTo` for inter-slide morph**

Still inside `installClickStages()`, after the `_applyStep` patch:

```ts
  const origGoTo = proto._goTo;
  proto._goTo = function (this: DeckRootProto, idx: number): void {
    const slides = this.slides ?? [];
    const from = slides[this.current];
    const to = slides[Math.max(0, Math.min(slides.length - 1, idx))];
    const svt = (document as DocWithVT).startViewTransition?.bind(document);
    const keys = from && to && from !== to ? matchedMorphKeys(from, to) : [];
    if (keys.length === 0 || !svt || vtActive || reducedMotion()) {
      origGoTo.call(this, idx);
      return;
    }
    nameVisibleMorphs(from!);   // outgoing side, before capture
    vtActive = true;
    // deck-transition skips its classic animation for this navigation.
    (this as unknown as { __rkMorphActive?: boolean }).__rkMorphActive = true;
    svt(() => { origGoTo.call(this, idx); nameVisibleMorphs(to!); })
      .finished.finally(() => {
        vtActive = false;
        (this as unknown as { __rkMorphActive?: boolean }).__rkMorphActive = false;
      });
  };
```

Known limitation (documented in the spec): `_back()` re-applies the step after `_goTo`, so a backward morph may capture an intermediate state — acceptable.

- [x] **Step 5: deck-transition skip guard**

In `src/runtime/deck-transition.ts`, first line of `onChange`:

```ts
  const onChange = (e: Event) => {
    // A morph view-transition owns this navigation · don't double-animate.
    if ((host as unknown as { __rkMorphActive?: boolean }).__rkMorphActive) return;
    const ev = e as CustomEvent<{ current: HTMLElement | null; previous: HTMLElement | null }>;
```

Also update the click-stages header comment:

```ts
//   <h1 data-morph="title">…</h1> · paired across steps or consecutive
//   slides → FLIP morph via the View Transitions API (graceful no-op
//   fallback). Morph targets must live in light DOM.
```

- [x] **Step 6: Typecheck + build**

Run: `npx tsc --noEmit && node build.mjs`
Expected: no errors. If `startViewTransition` typing conflicts with the TS lib version, keep only the local `DocWithVT` cast (do not add lib entries to tsconfig).

- [x] **Step 7: Commit**

```bash
git add src/plugins/click-stages.ts src/runtime/deck-transition.ts dist
git commit -m "feat(rikiki): data-morph magic-move via View Transitions, intra-slide and across slides"
```

## Task 7: Chantier 2 fixture + browser verification

**Files:**
- Create: `decks/tests/stages.html`

- [x] **Step 1: Create the fixture**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>click-stages v2 fixture</title>
  <link rel="stylesheet" href="../../themes/rikiki.css">
  <script type="module" src="../../dist/index.js"></script>
  <script type="module">
    import { installClickStages } from '../../dist/click-stages.js';
    installClickStages();
  </script>
</head>
<body>
  <deck-root transition="slide">
    <deck-feature>
      <h1>Timing + presets</h1>
      <p data-click data-anim="slide-up" data-anim-duration="600" data-anim-ease="spring">slow spring slide-up</p>
      <p data-click data-anim="blur" data-anim-delay="200">delayed blur-in</p>
      <p data-click data-anim="flip-up">flip-up</p>
      <svg viewBox="0 0 300 80" width="300" height="80" data-click data-anim="draw">
        <path d="M10 60 C 80 10, 160 10, 290 60" stroke="#e0531f" stroke-width="3" fill="none"/>
      </svg>
    </deck-feature>

    <deck-feature>
      <h1>Auto chain · one click</h1>
      <p data-click>click once…</p>
      <p data-click-auto="500">…this follows at +500ms…</p>
      <p data-click-auto="500">…and this at +1s, no extra click</p>
    </deck-feature>

    <deck-feature>
      <h1>Stagger</h1>
      <ul data-click-stagger="120" data-anim="slide-up">
        <li>wave 1</li><li>wave 2</li><li>wave 3</li><li>wave 4</li>
      </ul>
      <div data-click-children data-anim="scale">
        <span>then</span> <span>one</span> <span>per</span> <span>click</span>
      </div>
    </deck-feature>

    <deck-feature>
      <h1 data-morph="title" style="font-size:1.2rem">Morph me</h1>
      <p data-click>intra-slide morph: next click grows the title</p>
      <h1 data-morph="title" data-click="2" style="font-size:3rem; color:#e0531f">Morph me</h1>
      <p data-click-hide="2" style="display:none"></p>
    </deck-feature>

    <deck-feature>
      <h1 data-morph="title" style="font-size:1rem; opacity:0.6">Morph me</h1>
      <p>inter-slide morph: the title glided here from the previous slide</p>
    </deck-feature>
  </deck-root>
</body>
</html>
```

Note: on the intra-slide morph slide, the small title is always visible and the big one appears at step 2 — `nameVisibleMorphs` picks whichever is visible, so the small→big swap morphs. Adjust during verification if the duplicate-visible case (both shown between steps) skips the transition: if so, add `data-click-hide="2"` on the small title (hiding it the same step the big one appears).

- [x] **Step 2: Verify in the browser**

Navigate to `http://localhost:8765/decks/tests/stages.html` with Playwright MCP:
1. Slide 1: four advances reveal in order — spring slide-up (slow), blur-in after a beat, flip-up, then the path **draws itself** left to right. Step dots show 4 steps.
2. Slide 2: ONE advance reveals line 1, then lines 2 and 3 appear by themselves at ~0.5s intervals. Step dots show 1 step. Going back then forward replays the chain.
3. Slide 3: first advance cascades the four `<li>` in a 120ms wave; the next four advances reveal the spans one by one. Step dots show 5 steps.
4. Slide 4: first advance shows the helper line; second advance **morphs** the small title into the big orange one (smooth glide, Chromium). On Firefox without View Transitions: instant swap, no error in console.
5. Advancing to slide 5: the title morphs across slides AND the classic `slide` transition is skipped for that navigation (no double animation). Navigating between other slides still uses the `slide` transition.
6. `browser_console_messages`: no errors.

- [x] **Step 3: Commit**

```bash
git add decks/tests/stages.html
git commit -m "test(rikiki): click-stages v2 fixture · timing, auto chain, stagger, morph"
```

---

# Chantier 3 — Mouse navigation

## Task 8: `mouse-nav` attribute + click-to-advance

**Files:**
- Modify: `src/runtime/deck-root.ts`

- [ ] **Step 1: Add the property and the helper**

In `src/runtime/deck-root.ts`, after the `swipe` property (line ~115):

```ts
  /** Mouse navigation · enabled by default. Set to "none" to disable, or to a
   *  space-separated subset of "click wheel arrows aux" to pick mechanisms. */
  @property({ type: String, reflect: true, attribute: 'mouse-nav' }) mouseNav: string | null = null;
```

After `_has2DNav()`:

```ts
  private _mouseEnabled(kind: 'click' | 'wheel' | 'arrows' | 'aux'): boolean {
    const v = (this.mouseNav ?? 'all').trim();
    if (v === 'none') return false;
    if (v === '' || v === 'all') return true;
    return v.split(/\s+/).includes(kind);
  }
```

- [ ] **Step 2: Add the click handler**

With the other private fields:

```ts
  // Mouse-nav click guard · pointerdown coords to tell clicks from drags
  private _navDownX = 0;
  private _navDownY = 0;
```

New handlers (next to `_onPointerDown`):

```ts
  private _onNavPointerDown = (e: PointerEvent): void => {
    this._navDownX = e.clientX;
    this._navDownY = e.clientY;
  };

  /** Click anywhere → advance (Shift+click → back) · PowerPoint-style.
   *  Skips interactive targets, our own chrome, text selections and drags. */
  private _onClickNav = (e: MouseEvent): void => {
    if (!this._mouseEnabled('click')) return;
    if (this.overview || this.blank) return;
    if (this.shadowRoot?.querySelector('#kb-overlay.open')) return;
    if (Math.hypot(e.clientX - this._navDownX, e.clientY - this._navDownY) > 5) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const interactive = e.composedPath().some((n) => {
      if (!(n instanceof HTMLElement)) return false;
      if (n.matches?.('a, button, input, textarea, select, [contenteditable], [data-no-advance]')) return true;
      return n.id === 'blank' || n.id === 'kb-overlay' || n.id === 'overview-grid'
          || n.id === 'nav-arrows' || n.id === 'kb-hint';
    });
    if (interactive) return;
    if (this.autoplay > 0 && !this._autoplayPaused) this._startAutoplay();
    if (e.shiftKey) this._back(); else this._advance();
  };
```

- [ ] **Step 3: Wire listeners**

In `firstUpdated()`, after the keyboard/hash listeners:

```ts
    this.addEventListener('pointerdown', this._onNavPointerDown);
    this.addEventListener('click', this._onClickNav);
```

In `disconnectedCallback()`:

```ts
    this.removeEventListener('pointerdown', this._onNavPointerDown);
    this.removeEventListener('click', this._onClickNav);
```

(`_onNavPointerDown` is independent of the swipe pointerdown listener — both can coexist.)

- [ ] **Step 4: Typecheck + build + quick check**

Run: `npx tsc --noEmit && node build.mjs`
With Playwright on `http://localhost:8765/starter.html`: click the middle of the slide → next slide; Shift+click → previous; click a link/within `#kb-hint` → no navigation. Set `mouse-nav="none"` via `browser_evaluate` (`document.querySelector('deck-root').setAttribute('mouse-nav','none')`) → clicks do nothing.

- [ ] **Step 5: Commit**

```bash
git add src/runtime/deck-root.ts dist
git commit -m "feat(rikiki): mouse-nav attribute + click-to-advance (default on, shift-click back)"
```

## Task 9: Wheel + mouse buttons 4/5

**Files:**
- Modify: `src/runtime/deck-root.ts`

- [ ] **Step 1: Add the handlers**

```ts
  // Wheel navigation · deltaY accumulation + lockout against trackpad inertia
  private _wheelAccum = 0;
  private _wheelLockUntil = 0;

  private _onWheel = (e: WheelEvent): void => {
    if (!this._mouseEnabled('wheel') || this.overview || this.blank) return;
    e.preventDefault();
    const now = performance.now();
    if (now < this._wheelLockUntil) return;
    this._wheelAccum += e.deltaY;
    if (Math.abs(this._wheelAccum) < 50) return;
    const forward = this._wheelAccum > 0;
    this._wheelAccum = 0;
    this._wheelLockUntil = now + 400;
    if (this.autoplay > 0 && !this._autoplayPaused) this._startAutoplay();
    if (forward) this._advance(); else this._back();
  };

  /** Mouse back/forward buttons (3/4) · act on mouseup, suppress the
   *  browser's history navigation best-effort on auxclick. */
  private _onAuxUp = (e: MouseEvent): void => {
    if (!this._mouseEnabled('aux')) return;
    if (e.button !== 3 && e.button !== 4) return;
    e.preventDefault();
    if (e.button === 3) this._back(); else this._advance();
  };

  private _onAuxClick = (e: MouseEvent): void => {
    if (!this._mouseEnabled('aux')) return;
    if (e.button === 3 || e.button === 4) e.preventDefault();
  };
```

- [ ] **Step 2: Wire listeners**

In `firstUpdated()`:

```ts
    this.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('mouseup', this._onAuxUp);
    window.addEventListener('auxclick', this._onAuxClick);
```

In `disconnectedCallback()`:

```ts
    this.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('mouseup', this._onAuxUp);
    window.removeEventListener('auxclick', this._onAuxClick);
```

- [ ] **Step 3: Typecheck + build + quick check**

Run: `npx tsc --noEmit && node build.mjs`
Playwright on `starter.html`: `browser_run_code_unsafe` dispatching a `wheel` event with `deltaY: 60` advances exactly one slide; a second event within 400ms is ignored. With overview open (`o`), wheel scrolls the grid instead of navigating.

- [ ] **Step 4: Commit**

```bash
git add src/runtime/deck-root.ts dist
git commit -m "feat(rikiki): wheel + mouse buttons 4/5 navigation with trackpad debounce"
```

## Task 10: On-screen chevrons

**Files:**
- Modify: `src/runtime/deck-root.ts`

- [ ] **Step 1: Add the CSS** (inside `static override styles`, after the `#kb-hint` rules)

```css
    #nav-arrows {
      position: fixed; bottom: 2.4rem; right: 1.5rem;
      display: flex; gap: 4px;
      z-index: 100;
      opacity: var(--deck-root-nav-opacity, 0.35);
      transition: opacity 0.2s ease;
    }
    #nav-arrows:hover { opacity: 1; }
    .nav-btn {
      appearance: none; cursor: pointer;
      width: 30px; height: 30px;
      display: grid; place-items: center;
      font: 700 1rem/1 var(--rik-font-mono);
      color: var(--deck-root-nav-color, var(--rik-text-default));
      background: var(--deck-root-nav-bg, var(--rik-surface-raised));
      border: 1px solid var(--rik-border-default);
      border-radius: 6px;
      padding: 0;
    }
    .nav-btn:hover:not(:disabled) { border-color: var(--rik-accent); }
    .nav-btn:disabled { opacity: 0.3; cursor: default; }
```

- [ ] **Step 2: Add the template helper** (next to `render()`)

```ts
  private _navArrows(): unknown {
    if (!this._mouseEnabled('arrows') || this.overview) return '';
    const total = this.slides.length;
    if (total === 0) return '';
    const atStart = this.current === 0 && this.step === 0;
    const atEnd = this.current >= total - 1 && this.step >= this._maxSteps();
    if (this._has2DNav()) {
      const { c, i } = this._coords(this.current);
      const chap = this.chapters[c];
      return html`
        <div id="nav-arrows">
          <button class="nav-btn" title="Previous chapter" ?disabled=${!this.loop && this.current === 0}
            @click=${() => (c > 0 ? this._goToCoords(c - 1, 0) : this._back())}>&lsaquo;</button>
          <button class="nav-btn" title="Up" ?disabled=${i === 0}
            @click=${() => this._goToCoords(c, i - 1)}>&uarr;</button>
          <button class="nav-btn" title="Down" ?disabled=${!chap || i + 1 >= chap.slides.length}
            @click=${() => this._goToCoords(c, i + 1)}>&darr;</button>
          <button class="nav-btn" title="Next chapter" ?disabled=${!this.loop && atEnd}
            @click=${() => (c + 1 < this.chapters.length ? this._goToCoords(c + 1, 0) : this._advance())}>&rsaquo;</button>
        </div>`;
    }
    return html`
      <div id="nav-arrows">
        <button class="nav-btn" title="Previous" ?disabled=${!this.loop && atStart}
          @click=${() => this._back()}>&lsaquo;</button>
        <button class="nav-btn" title="Next" ?disabled=${!this.loop && atEnd}
          @click=${() => this._advance()}>&rsaquo;</button>
      </div>`;
  }
```

- [ ] **Step 3: Render it** — in `render()`, after the `#kb-hint` div:

```ts
      ${this._navArrows()}
```

- [ ] **Step 4: Typecheck + build + quick check**

Run: `npx tsc --noEmit && node build.mjs`
Playwright on `starter.html`: chevrons visible bottom-right, faint, full opacity on hover; `‹` disabled on slide 1; clicking `›` advances (and does NOT also trigger click-to-advance — the `#nav-arrows` guard from Task 8); chevrons absent in overview mode and with `mouse-nav="none"`.

- [ ] **Step 5: Commit**

```bash
git add src/runtime/deck-root.ts dist
git commit -m "feat(rikiki): on-screen chevron navigation, 2D-aware, themable"
```

## Task 11: deck-help mouse section

**Files:**
- Modify: `src/runtime/deck-help.ts`

- [ ] **Step 1: Add the rows** — in `MARKUP`, before the closing `.kb-card` div (after the View group):

```html
      <div class="kb-group-label">Mouse</div>
      <div class="kb-row"><span class="desc">Next / Previous</span><span class="keys"><kbd>Click</kbd><kbd>Shift+Click</kbd></span></div>
      <div class="kb-row"><span class="desc">Navigate</span><span class="keys"><kbd>Wheel</kbd><kbd>Back/Fwd buttons</kbd></span></div>
```

- [ ] **Step 2: Typecheck + build + commit**

```bash
npx tsc --noEmit && node build.mjs
git add src/runtime/deck-help.ts dist
git commit -m "feat(rikiki): document mouse navigation in the help overlay"
```

## Task 12: Mouse-nav fixture

**Files:**
- Create: `decks/tests/mouse-nav.html`

- [ ] **Step 1: Create the fixture**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>mouse-nav fixture</title>
  <link rel="stylesheet" href="../../themes/rikiki.css">
  <script type="module" src="../../dist/index.js"></script>
</head>
<body>
  <deck-root>
    <deck-cover><h1>Mouse nav fixture</h1><p><a href="#3">a link · must not advance</a></p></deck-cover>
    <deck-feature><h1>Slide 2</h1><p><button data-no-advance>inert button</button></p></deck-feature>
    <deck-section><h1>Chapter 2</h1></deck-section>
    <deck-feature><h1>Sub-slide 2.2</h1></deck-feature>
    <deck-feature><h1>Last</h1></deck-feature>
  </deck-root>
</body>
</html>
```

- [ ] **Step 2: Full mouse verification with Playwright**

On `http://localhost:8765/decks/tests/mouse-nav.html`:
1. Click center → slide 2. Shift+click → slide 1.
2. Click the link → hash navigation only (no double-advance). Click the button on slide 2 → nothing.
3. Chevrons: 2D deck → four buttons (`‹ ↑ ↓ ›`), `↓` works inside chapter 2.
4. Wheel down ×1 → one slide. Rapid wheel burst → still one slide per 400ms window.
5. `document.querySelector('deck-root').setAttribute('mouse-nav', 'wheel')` → clicks dead, chevrons gone, wheel still works. `mouse-nav="none"` → everything dead, keyboard still works.
6. Console free of errors.

- [ ] **Step 3: Commit**

```bash
git add decks/tests/mouse-nav.html
git commit -m "test(rikiki): mouse navigation fixture deck"
```

## Task 13: Docs + version bump + final pass

**Files:**
- Modify: `README.md`, `docs/llms/rikiki-reference.md`, `.claude/skills/rikiki-deck/SKILL.md`, `package.json`

- [ ] **Step 1: package.json** — `"version": "0.2.0"` → `"version": "0.3.0"`.

- [ ] **Step 2: Document in the three files**

Read each file first and integrate where the existing structure dictates (keyboard/navigation section, plugins section, attribute tables). Content to convey — adapt wording to each file's voice:

*Mouse navigation (deck-root):*

```markdown
### Mouse navigation

Mouse navigation is on by default: click to advance (Shift+click to go back),
scroll wheel, on-screen chevrons (bottom right), and mouse back/forward
buttons. Configure with the `mouse-nav` attribute on `<deck-root>`:

- `<deck-root>` — everything on (default)
- `<deck-root mouse-nav="none">` — keyboard-only decks (pre-0.3 behavior)
- `<deck-root mouse-nav="wheel arrows">` — pick mechanisms: `click`, `wheel`, `arrows`, `aux`

Interactive elements (`a`, `button`, inputs) never trigger navigation; add
`data-no-advance` to opt any element out. Chevron colors: `--deck-root-nav-color`,
`--deck-root-nav-bg`, `--deck-root-nav-opacity`.
```

*click-stages v2 (plugin section):*

```markdown
Per-element timing: `data-anim-duration="600"` (ms), `data-anim-delay="120"` (ms),
`data-anim-ease="out|spring|in-out"` or a raw `cubic-bezier(…)`.
New presets: `slide-down`, `slide-right`, `blur`, `flip-up`, `draw` (traces
stroked SVG paths).
Auto stages: `data-click-auto="800"` reveals 800 ms after the previous stage,
no click consumed — chain several for one-click choreographies.
Stagger: `data-click-stagger="80"` on a container reveals its children in a
cascade on one click; `data-click-children` gives each child its own click.
Morph: pair `data-morph="key"` elements across steps or consecutive slides for
a Keynote-style magic move (View Transitions API; graceful no-op fallback;
light-DOM elements only).
```

*Breaking-ish change note (README + reference):* clicks navigate by default starting v0.3.0; add `mouse-nav="none"` to restore the previous behavior.

- [ ] **Step 3: Full rebuild including standalone**

Run: `npm run build` (build.mjs + build-standalone.mjs + declarations)
Expected: clean. Then re-run the three fixture verifications quickly (overview-svg, stages, mouse-nav) plus `prefers-reduced-motion` emulation on `stages.html` (Playwright `browser_evaluate` with `matchMedia` emulation or CDP): reveals become instant, morph skipped, auto chain still advances.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/llms/rikiki-reference.md .claude/skills/rikiki-deck/SKILL.md package.json dist
git commit -m "docs(rikiki): mouse nav + click-stages v2 docs, bump to 0.3.0"
```

---

## Self-review notes

- Spec coverage: chantier 1 → Tasks 1-3; chantier 2 (timing, presets, auto, stagger, morph, deck-transition interplay, reduced-motion) → Tasks 4-7; chantier 3 (mouse-nav attr, 4 mechanisms, help, docs, version) → Tasks 8-13. Verification section → Tasks 3, 7, 12, 13.
- The Task 7 fixture's intra-slide morph has a flagged uncertainty (duplicate visible morph names between steps); the verification step says exactly how to adjust if the transition gets skipped.
- Type consistency: `DeckRootProto` gains `_goTo` (Task 6) used only after its definition; `reducedMotion()` defined Task 4, used Tasks 5-6; `nameVisibleMorphs`/`matchedMorphKeys`/`vtActive` defined Task 6 before use.
