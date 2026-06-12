# Fluid Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in `fluid` attribute to `<deck-root>` so a deck can reflow like a web page (and make both modes embed-safe), per `docs/design/2026-06-12-fluid-mode-design.md`.

**Architecture:** Three independent slices, each shippable: (1) scope the injected globals with `:has(> body > deck-root)` so embedded decks never touch the host page, (2) measure the host box with a ResizeObserver instead of the window so zoom-to-fit works inside a container, (3) the `fluid` property itself (no canvas, no scale, no letterbox). TDD with Playwright e2e against new fixtures; no new pure logic, so no new unit tests.

**Tech Stack:** Lit 3 (experimental decorators), Playwright 1.60, esbuild (committed `dist/`), Biome.

**Working directory:** all `npm`/`npx` commands run in `rikiki/` (the package dir). Repo root holds `.gitlab-ci.yml` and `docs/`.

**Verified facts (don't re-derive):** `starter.html`, `decks/tests/*.html` and `examples/rikiki-tour/index.html` all have `<deck-root>` as a direct child of `<body>`, so the `:has(> body > deck-root)` scoping keeps matching them. The presenter preview srcdoc also puts `deck-root` directly in `<body>`.

---

### Task 1: Scope the injected globals (embedded decks leave the host page alone)

**Files:**
- Create: `rikiki/decks/tests/embedded.html`
- Create: `rikiki/e2e/embed.spec.ts`
- Modify: `rikiki/src/runtime/deck-root.ts` (`_injectGlobals`, around line 296)

- [ ] **Step 1: Create the embedded fixture**

`rikiki/decks/tests/embedded.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>rikiki · embedded harness</title>
<link rel="stylesheet" href="../../themes/rikiki.css">
<script type="module" src="../../dist/index.js"></script>
</head>
<body>
<h1 id="host-title">Host page</h1>
<p>A deck embedded in a regular, scrollable page · the deck must not touch
the page's scroll or rem baseline.</p>
<div id="deck-box" style="width: 800px; height: 450px">
  <deck-root no-hint no-arrows>
    <deck-section title="Embedded deck"></deck-section>
    <deck-section title="Second slide"></deck-section>
  </deck-root>
</div>
<div style="height: 2000px">tall host content · keeps the page scrollable</div>
</body>
</html>
```

- [ ] **Step 2: Write the failing test**

`rikiki/e2e/embed.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// An embedded deck (not a direct <body> child) must be a good citizen: no
// overflow lock, no rem rebase, the host page keeps scrolling.
const EMBED = '/rikiki/decks/tests/embedded.html';

test('an embedded deck leaves the host page untouched', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  const host = await page.evaluate(() => ({
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(host.htmlOverflow, 'host page keeps its scroll').not.toBe('hidden');
  expect(host.rootFont, 'host page keeps its rem baseline').toBe(16);
  expect(deck.consoleErrors).toEqual([]);
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `npx playwright test e2e/embed.spec.ts`
Expected: FAIL — `htmlOverflow` is `'hidden'` and `rootFont` ≈ 25.4 (the unscoped globals apply).

- [ ] **Step 4: Scope the injected CSS**

In `rikiki/src/runtime/deck-root.ts`, replace the `style.textContent` assignment inside `_injectGlobals` with:

```ts
    style.textContent =
      'html:has(> body > deck-root){overflow:hidden;height:100%}' +
      'html:has(> body > deck-root) body{margin:0;overflow:hidden;height:100%}' +
      'html:has(> body > deck-root:not([fluid])){font-size:calc(var(--deck-canvas-h,1080)*0.0235px)}' +
      'html:has(> body > deck-root[fluid]){font-size:clamp(14px,2.35vh,42px)}';
```

and update the method's doc comment: the rules are inert unless a deck is a
direct `<body>` child, so embedded decks never affect the host page (the
`fluid` font-size rule is consumed by Task 3 — harmless until then). Note the
new `height:100%` pair: Task 2 switches `:host` from `100vw/100vh` to `100%`,
which needs a sized body in the full-window case.

- [ ] **Step 5: Rebuild dist and verify green**

Run: `npm run build && npx playwright test`
Expected: ALL PASS — including `scaling.spec.ts` ('rem baseline is injected', the tour deck is a direct body child) and the new embed test.

- [ ] **Step 6: Commit**

```bash
cd <repo>
git add rikiki/decks/tests/embedded.html rikiki/e2e/embed.spec.ts rikiki/src rikiki/dist
git commit -m "fix(deck-root): scope injected globals to full-page decks

The overflow lock and rem rebase now only apply when the deck is a
direct <body> child · an embedded deck no longer breaks the host
page's scroll and typography."
```

---

### Task 2: Scale against the host box, not the window

**Files:**
- Modify: `rikiki/src/runtime/deck-root.ts` (`:host` styles ~line 27, `_applyScale` ~line 262, `_installRuntime` ~line 215, `disconnectedCallback` ~line 320)
- Test: `rikiki/e2e/embed.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `rikiki/e2e/embed.spec.ts`:

```ts
test('an embedded zoom-to-fit deck scales to its container, not the window', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  // #deck-box is 800×450 → scale = min(800/1920, 450/1080) ≈ 0.417
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          parseFloat(
            (document.querySelector('deck-root') as HTMLElement).style.getPropertyValue(
              '--deck-scale',
            ),
          ),
        ),
      { message: 'scale derives from the container box' },
    )
    .toBeCloseTo(800 / 1920, 2);
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx playwright test e2e/embed.spec.ts`
Expected: the new test FAILS — today the scale comes from the 1280×720 window (≈ 0.667), not the 800×450 box.

- [ ] **Step 3: Implement host-box measurement**

In `rikiki/src/runtime/deck-root.ts`:

a) `:host` styles — replace `width: 100vw; height: 100vh;` with:

```css
      width: 100%;
      height: 100%;
```

(full-window decks keep their size via the `height:100%` html/body rules from Task 1; embedded decks now fill their container).

b) Replace `_applyScale` with:

```ts
  /** Uniform zoom-to-fit · scale the fixed logical canvas to the largest size
   *  that still fits the host's own box (the viewport for a full-window deck,
   *  the container for an embedded one). Driven by a ResizeObserver. */
  private _applyScale = (): void => {
    const scale = Math.min(this.clientWidth / this.width, this.clientHeight / this.height);
    if (scale > 0) this.style.setProperty('--deck-scale', String(scale));
  };

  private _resizeObserver: ResizeObserver | null = null;
```

c) In `_installRuntime`, replace `window.addEventListener('resize', this._applyScale);` with:

```ts
    this._resizeObserver = new ResizeObserver(this._applyScale);
    this._resizeObserver.observe(this);
```

d) In `disconnectedCallback`, replace `window.removeEventListener('resize', this._applyScale);` with:

```ts
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
```

- [ ] **Step 4: Rebuild and verify green**

Run: `npm run build && npx playwright test`
Expected: ALL PASS — `lifecycle.spec.ts` ('re-attached deck keeps rescaling') now goes through the observer path; `scaling.spec.ts` full-window behaviour unchanged.

- [ ] **Step 5: Commit**

```bash
cd <repo>
git add rikiki/src rikiki/dist rikiki/e2e/embed.spec.ts
git commit -m "fix(deck-root): zoom-to-fit measures the host box, not the window

ResizeObserver on the host replaces the window resize listener · an
embedded deck now scales to its container, and container-driven size
changes re-fit without a window resize."
```

---

### Task 3: The `fluid` property

**Files:**
- Create: `rikiki/decks/tests/fluid.html`
- Modify: `rikiki/src/runtime/deck-root.ts` (property block ~line 140, styles ~line 41, `_applyScale`, `_applyCanvasVars` ~line 253, `_applyLetterbox` ~line 272)
- Test: `rikiki/e2e/embed.spec.ts`

- [ ] **Step 1: Create the fluid fixture**

`rikiki/decks/tests/fluid.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>rikiki · fluid harness</title>
<link rel="stylesheet" href="../../themes/rikiki.css">
<script type="module" src="../../dist/index.js"></script>
</head>
<body>
<deck-root fluid no-hint no-arrows>
  <deck-section title="Fluid deck"></deck-section>
  <deck-section title="Second slide"></deck-section>
</deck-root>
</body>
</html>
```

- [ ] **Step 2: Write the failing test**

Append to `rikiki/e2e/embed.spec.ts`:

```ts
test('a fluid deck reflows with the viewport (no canvas, no letterbox)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/fluid.html');

  const stageBox = () =>
    page.evaluate(() => {
      const stage = document.querySelector('deck-root')?.shadowRoot?.querySelector('#stage');
      if (!stage) throw new Error('no #stage');
      const b = stage.getBoundingClientRect();
      return { w: b.width, h: b.height };
    });

  // The stage fills the viewport exactly · no 16:9 letterbox.
  await page.setViewportSize({ width: 700, height: 1100 });
  const tall = await stageBox();
  expect(tall.w, 'stage fills the viewport width').toBeCloseTo(700, 0);
  expect(tall.h, 'stage fills the viewport height').toBeCloseTo(1100, 0);

  // Reflow, not zoom: the stage box CHANGES shape between viewports — the
  // inverse of the zoom-to-fit invariant locked in scaling.spec.ts.
  await page.setViewportSize({ width: 1600, height: 900 });
  const wide = await stageBox();
  expect(wide.w / wide.h, 'aspect follows the window').not.toBeCloseTo(tall.w / tall.h, 1);
  expect(deck.consoleErrors).toEqual([]);
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `npx playwright test e2e/embed.spec.ts`
Expected: the new test FAILS — without `fluid` support the stage stays a scaled 1920×1080 canvas (`getBoundingClientRect` of the scaled stage ≈ 700×394 at 700×1100).

- [ ] **Step 4: Implement fluid mode**

In `rikiki/src/runtime/deck-root.ts`:

a) Property — insert after the `overview` property declaration:

```ts
  /** Fluid rendering · the deck fills its box and reflows like a web page
   *  (no logical canvas, no zoom-to-fit scale, no letterbox). Opt-in · the
   *  default stays the uniform zoom-to-fit canvas. */
  @property({ type: Boolean, reflect: true }) fluid = false;
```

b) Styles — after the existing `#stage { … }` block, add:

```css
    :host([fluid]) #stage {
      width: 100%;
      height: 100%;
      transform: none;
    }
```

(`container-type: size` is inherited from the base `#stage` rule, so the
slides' `cqw`/`cqh` resolve against the real box and the content reflows.)

c) Guards — make the canvas machinery a no-op in fluid mode:

```ts
  private _applyCanvasVars(): void {
    if (this.fluid) return;
    const root = document.documentElement;
    root.style.setProperty('--deck-canvas-w', String(this.width));
    root.style.setProperty('--deck-canvas-h', String(this.height));
  }
```

In `_applyScale`, first line of the body:

```ts
    if (this.fluid) {
      this.style.removeProperty('--deck-scale');
      return;
    }
```

In `_applyLetterbox`, first line of the body:

```ts
    if (this.fluid) {
      this.style.removeProperty('--deck-letterbox-bg');
      return;
    }
```

- [ ] **Step 5: Rebuild and verify green**

Run: `npm run build && npx playwright test && npm run typecheck && npm run lint && npx vitest run`
Expected: ALL PASS, 0 lint warnings.

- [ ] **Step 6: Commit**

```bash
cd <repo>
git add rikiki/decks/tests/fluid.html rikiki/e2e/embed.spec.ts rikiki/src rikiki/dist docs/design/2026-06-12-fluid-mode-design.md docs/design/2026-06-12-fluid-mode-plan.md
git commit -m "feat(deck-root): opt-in fluid mode

<deck-root fluid> fills its box and reflows like a web page · no
logical canvas, no zoom-to-fit scale, no letterbox. Full-window fluid
decks get the pre-canvas rem baseline (clamp on vh) via the scoped
globals; embedded fluid decks follow the host page's typography."
```

---

### Task 4: Smoke coverage + docs

**Files:**
- Modify: `rikiki/e2e/smoke.spec.ts` (DECKS list, line 7-15)
- Modify: `docs/llms/rikiki-reference.md` (deck-root attribute table, ~line 130)

- [ ] **Step 1: Add the new fixtures to the smoke net**

In `rikiki/e2e/smoke.spec.ts`, extend `DECKS`:

```ts
  '/rikiki/decks/tests/embedded.html',
  '/rikiki/decks/tests/fluid.html',
```

Run: `npx playwright test e2e/smoke.spec.ts`
Expected: PASS (9 decks).

- [ ] **Step 2: Document the attribute**

In the `deck-root` attribute table of `docs/llms/rikiki-reference.md` (the
table that documents `autoplay` at ~line 132), add a row:

```markdown
| `fluid` | *(boolean)* | Fluid rendering: the deck fills its box and reflows like a web page — no logical canvas, no zoom-to-fit scale, no letterbox. Default: zoom-to-fit |
```

Also check `rikiki/llms.txt` and `rikiki/README.md` for a deck-root attribute
list (`grep -n "no-hint" rikiki/llms.txt rikiki/README.md docs/llms/*.md`) and
add the same one-liner wherever the sibling attributes are enumerated.

- [ ] **Step 3: Full validation**

Run, from `rikiki/`: `npm run typecheck && npm run lint && npx vitest run && npm run build && npx playwright test`
Expected: ALL PASS, 0 warnings, and `git status` shows no unexpected dist drift beyond the committed rebuild.

- [ ] **Step 4: Commit**

```bash
cd <repo>
git add rikiki/e2e/smoke.spec.ts docs/llms rikiki/llms.txt rikiki/README.md rikiki/dist
git commit -m "test+docs: smoke the embedded/fluid fixtures, document fluid"
```

---

## Self-review notes

- Spec coverage: scoped globals → Task 1; host-box scale → Task 2; `fluid`
  API/stage/guards → Task 3; overview needs no change (measures `#stage`,
  which IS the host box in fluid mode); presenter keeps zoom-to-fit (its
  srcdoc has no `fluid`); tests per spec → Tasks 1-4.
- The Task 1 CSS ships the `[fluid]` font-size rule before the property
  exists; it matches nothing until Task 3 — intentional, keeps Task 1
  self-contained.
- Type consistency: `_resizeObserver` is declared in Task 2 and only used
  there; `fluid` is read by guards added in Task 3 only.
