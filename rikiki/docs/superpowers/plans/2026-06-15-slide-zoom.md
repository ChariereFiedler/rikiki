# Slide Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a reader magnify the active slide beyond the fit scale and pan around it (PDF-style), on by default, in fixed-canvas mode only.

**Architecture:** Extend the existing `#stage` transform with a user zoom factor and a pan translation (`translate(pan) scale(fit × zoom)`), driven by Ctrl/⌘+wheel (pinch), `+`/`-`/`0` keys, plain-wheel + drag pan while zoomed. State lives on `<deck-root>`; `cqw/cqh` keep resolving against the 1920×1080 stage so content magnifies without reflow. No-op in `fluid`/overview/blank or with `no-zoom`.

**Tech Stack:** Lit (TypeScript) web component, esbuild flat `dist/`, Playwright e2e, Biome lint, vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-15-slide-zoom-design.md`

---

## File structure

- Modify `src/runtime/deck-root.ts` — all zoom state, CSS, math, handlers (single engine file by design; do not split).
- Create `decks/tests/zoom.html` — fixed-canvas fixture deck.
- Create `e2e/zoom.spec.ts` — behaviour tests.
- Rebuild + commit `dist/**` with each src change (CI fails on `dist` drift).
- Docs: `docs/llms/rikiki-reference.md`, repo-root `CHANGELOG.md`, `llms.txt`,
  `site/src/pages/docs/plugins.astro`, `site/src/pages/docs/api.astro`,
  `.claude/skills/rikiki-debug/SKILL.md`.

**Conventions:** no em-dashes in `src/` (use `·`); run `npm run build` before any
Playwright run (tests load `dist/`); `npm test` for vitest, `npx playwright test
--workers=1` for e2e (parallel workers flake on this machine).

---

## Task 1: Ctrl/⌘+wheel zoom (state, CSS, math, fixture)

**Files:**
- Modify: `src/runtime/deck-root.ts`
- Create: `decks/tests/zoom.html`
- Create: `e2e/zoom.spec.ts`

- [ ] **Step 1: Create the fixture deck**

Create `decks/tests/zoom.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>rikiki · zoom harness</title>
<link rel="stylesheet" href="../../themes/rikiki.css">
<script type="module" src="../../dist/index.js"></script>
</head>
<body>
<deck-root>
  <deck-feature>
    <h1 slot="title">Zoom me</h1>
    <p>Some readable body text to magnify.</p>
  </deck-feature>
  <deck-feature>
    <h1 slot="title">Second slide</h1>
  </deck-feature>
</deck-root>
</body>
</html>
```

- [ ] **Step 2: Write the failing e2e test**

Create `e2e/zoom.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

const DECK = '/rikiki/decks/tests/zoom.html';

// Read the host's zoom custom property + marker.
const zoomState = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const root = document.querySelector('deck-root') as HTMLElement;
    return {
      zoom: parseFloat(getComputedStyle(root).getPropertyValue('--deck-zoom') || '1'),
      zoomed: root.hasAttribute('data-zoomed'),
    };
  });

// Dispatch a ctrl+wheel (zoom-in) at a viewport point and report preventDefault.
const ctrlWheel = (page: import('@playwright/test').Page, deltaY: number) =>
  page.evaluate((dy) => {
    const root = document.querySelector('deck-root')!;
    const ev = new WheelEvent('wheel', {
      deltaY: dy, clientX: 400, clientY: 300, ctrlKey: true,
      cancelable: true, bubbles: true,
    });
    root.dispatchEvent(ev);
    return ev.defaultPrevented;
  }, deltaY);

test('ctrl+wheel magnifies the slide', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  expect((await zoomState(page)).zoom).toBe(1);
  const prevented = await ctrlWheel(page, -300); // negative = zoom in
  expect(prevented, 'zoom gesture is consumed').toBe(true);

  const after = await zoomState(page);
  expect(after.zoom, 'zoomed past fit').toBeGreaterThan(1);
  expect(after.zoomed, 'data-zoomed set').toBe(true);
  expect(deck.consoleErrors).toEqual([]);
});
```

- [ ] **Step 3: Build and run the test to verify it fails**

Run: `npm run build && npx playwright test --workers=1 zoom`
Expected: FAIL · `--deck-zoom` is unset (reads `1`), no `data-zoomed`.

- [ ] **Step 4: Add the CSS transform + cursor**

In `src/runtime/deck-root.ts`, in the `#stage` rule, replace the transform line:

```css
      transform: scale(var(--deck-scale, 1));
```

with:

```css
      transform: translate(var(--deck-pan-x, 0px), var(--deck-pan-y, 0px))
        scale(calc(var(--deck-scale, 1) * var(--deck-zoom, 1)));
```

Then, right after the `:host([fluid]) #stage, :host([unfixed]) #stage { … }`
rule, add:

```css
    /* While magnified beyond fit (slide zoom), the deck is grab-to-pan. */
    :host([data-zoomed]) { cursor: grab; }
    :host([data-zoomed][data-panning]) { cursor: grabbing; }
```

- [ ] **Step 5: Add zoom state + the `no-zoom` opt-out property**

After the `@property(... ) noArrows = false;` declaration, add:

```ts
  /** Disable slide zoom (Ctrl/⌘+wheel, pinch, +/-/0) · on by default. */
  @property({ type: Boolean, reflect: true, attribute: 'no-zoom' }) noZoom = false;
```

Near the other private fields (after `_wheelLockUntil`), add:

```ts
  // Slide zoom · 1 = fit, panX/panY in viewport px.
  private _zoom = 1;
  private _panX = 0;
  private _panY = 0;
  private static readonly ZOOM_MAX = 4;
  private static readonly ZOOM_STEP = 1.25;
  private static readonly ZOOM_WHEEL_SENSITIVITY = 0.002;
```

- [ ] **Step 6: Add the zoom helpers**

Add these methods to the class (next to `_applyScale`):

```ts
  /** Zoom is live only in the fixed canvas and outside overlays. */
  private _zoomEnabled(): boolean {
    return !this.noZoom && !this._effectiveFluid() && !this.overview && !this.blank;
  }

  /** Publish zoom + pan as custom props the #stage transform reads. */
  private _applyZoom(): void {
    this.style.setProperty('--deck-zoom', String(this._zoom));
    this.style.setProperty('--deck-pan-x', `${this._panX}px`);
    this.style.setProperty('--deck-pan-y', `${this._panY}px`);
    this.toggleAttribute('data-zoomed', this._zoom > 1);
  }

  /** Keep the pan within bounds so the magnified stage always covers the
   *  viewport (no gaps); at fit (zoom 1) it forces re-centring. */
  private _clampPan(): void {
    const fit =
      this.clientWidth && this.clientHeight
        ? Math.min(this.clientWidth / this.width, this.clientHeight / this.height)
        : 1;
    const s = fit * this._zoom;
    const maxX = Math.max(0, (this.width * s - this.clientWidth) / 2);
    const maxY = Math.max(0, (this.height * s - this.clientHeight) / 2);
    this._panX = Math.max(-maxX, Math.min(maxX, this._panX));
    this._panY = Math.max(-maxY, Math.min(maxY, this._panY));
  }

  /** Zoom by a factor, keeping the point at viewport (cx, cy) fixed. */
  private _zoomAt(factor: number, cx: number, cy: number): void {
    if (!this._zoomEnabled()) return;
    const z0 = this._zoom;
    const z1 = Math.max(1, Math.min(DeckRoot.ZOOM_MAX, z0 * factor));
    if (z1 === z0) return;
    const rect = this.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const ratio = z1 / z0;
    this._panX += (cx - centerX - this._panX) * (1 - ratio);
    this._panY += (cy - centerY - this._panY) * (1 - ratio);
    this._zoom = z1;
    this._clampPan();
    this._applyZoom();
  }

  private _resetZoom(): void {
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._applyZoom();
  }
```

- [ ] **Step 7: Route Ctrl/⌘+wheel to zoom**

In `_onWheel`, replace the existing guard:

```ts
    if (e.ctrlKey || e.metaKey) return;
```

with:

```ts
    // Ctrl/⌘ + wheel (and trackpad pinch, which fires ctrlKey wheel events) is a
    // zoom gesture: magnify the slide around the cursor. When zoom is disabled
    // (no-zoom / fluid / overlay) let the browser handle its own zoom instead.
    if (e.ctrlKey || e.metaKey) {
      if (!this._zoomEnabled()) return;
      e.preventDefault();
      this._zoomAt(Math.exp(-e.deltaY * DeckRoot.ZOOM_WHEEL_SENSITIVITY), e.clientX, e.clientY);
      return;
    }
```

- [ ] **Step 8: Build and run the test to verify it passes**

Run: `npm run build && npx playwright test --workers=1 zoom`
Expected: PASS.

- [ ] **Step 9: Typecheck + lint + dash-lint**

Run: `npm run typecheck && npm run lint && (cd ../site && node scripts/lint-dashes.mjs)`
Expected: no errors, `lint:dashes · OK`.

- [ ] **Step 10: Commit**

```bash
git add src/runtime/deck-root.ts dist decks/tests/zoom.html e2e/zoom.spec.ts
git commit -m "feat(deck-root): ctrl+wheel slide zoom (magnify around cursor)"
```

---

## Task 2: Keyboard zoom (`+` / `-` / `0`)

**Files:**
- Modify: `src/runtime/deck-root.ts`
- Modify: `e2e/zoom.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `e2e/zoom.spec.ts`:

```ts
test('plus/minus/zero keys zoom and reset', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  await page.keyboard.press('+');
  await page.keyboard.press('+');
  const zoomedIn = (await zoomState(page)).zoom;
  expect(zoomedIn, 'plus zooms in').toBeGreaterThan(1);

  await page.keyboard.press('-');
  expect((await zoomState(page)).zoom, 'minus zooms out').toBeLessThan(zoomedIn);

  await page.keyboard.press('0');
  const reset = await zoomState(page);
  expect(reset.zoom, 'zero resets to fit').toBe(1);
  expect(reset.zoomed).toBe(false);
  expect(deck.consoleErrors).toEqual([]);
});
```

- [ ] **Step 2: Build + run to verify it fails**

Run: `npm run build && npx playwright test --workers=1 zoom -g "plus/minus"`
Expected: FAIL · keys do nothing, zoom stays 1.

- [ ] **Step 3: Handle the keys in `_onKey`**

In `_onKey`, immediately after the black/white `blank` handling block (after the
`if (e.key === ',' || e.key === 'w' …)` block) insert:

```ts
    // Slide zoom · +/= zoom in, - zoom out (centred), 0 resets to fit.
    if (this._zoomEnabled() && (e.key === '+' || e.key === '=' || e.key === '-')) {
      e.preventDefault();
      const rect = this.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const factor = e.key === '-' ? 1 / DeckRoot.ZOOM_STEP : DeckRoot.ZOOM_STEP;
      this._zoomAt(factor, cx, cy);
      return;
    }
    if (e.key === '0' && this._zoom > 1) {
      e.preventDefault();
      this._resetZoom();
      return;
    }
```

- [ ] **Step 4: Build + run to verify it passes**

Run: `npm run build && npx playwright test --workers=1 zoom`
Expected: PASS (both tests).

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/runtime/deck-root.ts dist e2e/zoom.spec.ts
git commit -m "feat(deck-root): +/-/0 keyboard zoom controls"
```

---

## Task 3: Pan while zoomed (wheel + drag), suspend nav

**Files:**
- Modify: `src/runtime/deck-root.ts`
- Modify: `e2e/zoom.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `e2e/zoom.spec.ts`:

```ts
const pan = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const root = document.querySelector('deck-root') as HTMLElement;
    const cs = getComputedStyle(root);
    return {
      x: cs.getPropertyValue('--deck-pan-x').trim(),
      y: cs.getPropertyValue('--deck-pan-y').trim(),
    };
  });

test('plain wheel pans while zoomed, navigates at fit', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  // Zoom in first so panning is possible.
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  const before = await deck.activeIndex();

  // A plain wheel while zoomed pans and does NOT change the slide.
  const prevented = await page.evaluate(() => {
    const root = document.querySelector('deck-root')!;
    const ev = new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true });
    root.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(prevented, 'wheel claimed for pan').toBe(true);
  expect(await deck.activeIndex(), 'slide unchanged while zoomed').toBe(before);
  expect((await pan(page)).y, 'pan moved').not.toBe('0px');

  // Reset, then a plain wheel navigates again.
  await page.keyboard.press('0');
  const idx = await deck.activeIndex();
  await page.mouse.wheel(0, 200);
  await expect.poll(() => deck.activeIndex()).toBeGreaterThan(idx);
});
```

- [ ] **Step 2: Build + run to verify it fails**

Run: `npm run build && npx playwright test --workers=1 zoom -g "pans while zoomed"`
Expected: FAIL · plain wheel currently navigates even when zoomed.

- [ ] **Step 3: Add the pan-by helper**

Add next to `_resetZoom`:

```ts
  private _panBy(dx: number, dy: number): void {
    this._panX += dx;
    this._panY += dy;
    this._clampPan();
    this._applyZoom();
  }
```

- [ ] **Step 4: Pan on plain wheel while zoomed**

In `_onWheel`, immediately after the `if (e.ctrlKey || e.metaKey) { … }` block,
insert:

```ts
    // While magnified, a plain wheel pans the slide instead of navigating.
    if (this._zoom > 1 && this._zoomEnabled()) {
      e.preventDefault();
      this._panBy(-e.deltaX, -e.deltaY);
      return;
    }
```

- [ ] **Step 5: Add drag-to-pan pointer handlers**

Add the fields next to the zoom state:

```ts
  private _panning = false;
  private _panLastX = 0;
  private _panLastY = 0;
```

Add the handlers (next to `_onPointerDown`):

```ts
  private _onPanDown = (e: PointerEvent): void => {
    if (this._zoom <= 1 || !this._zoomEnabled()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('a, button, input, textarea, select, [contenteditable]')) return;
    this._panning = true;
    this._panLastX = e.clientX;
    this._panLastY = e.clientY;
    this.toggleAttribute('data-panning', true);
    this.setPointerCapture?.(e.pointerId);
  };
  private _onPanMove = (e: PointerEvent): void => {
    if (!this._panning) return;
    this._panBy(e.clientX - this._panLastX, e.clientY - this._panLastY);
    this._panLastX = e.clientX;
    this._panLastY = e.clientY;
  };
  private _onPanUp = (e: PointerEvent): void => {
    if (!this._panning) return;
    this._panning = false;
    this.toggleAttribute('data-panning', false);
    this.releasePointerCapture?.(e.pointerId);
  };
```

- [ ] **Step 6: Register / unregister the pan handlers**

In `_installRuntime`, after the `this.addEventListener('wheel', …)` line, add:

```ts
    this.addEventListener('pointerdown', this._onPanDown);
    this.addEventListener('pointermove', this._onPanMove);
    this.addEventListener('pointerup', this._onPanUp);
    this.addEventListener('pointercancel', this._onPanUp);
```

In `disconnectedCallback`, alongside the other `removeEventListener` calls, add:

```ts
    this.removeEventListener('pointerdown', this._onPanDown);
    this.removeEventListener('pointermove', this._onPanMove);
    this.removeEventListener('pointerup', this._onPanUp);
    this.removeEventListener('pointercancel', this._onPanUp);
```

- [ ] **Step 7: Suspend click-advance and swipe while zoomed**

In `_onClickNav`, after `if (this.overview || this.blank) return;` add:

```ts
    if (this._zoom > 1) return; // panning, not advancing
```

In `_onPointerUp` (the swipe handler), after the `if (this._swipePointerId === null
|| e.pointerId !== this._swipePointerId) return;` line add:

```ts
    if (this._zoom > 1) {
      this._swipePointerId = null;
      return;
    }
```

- [ ] **Step 8: Build + run to verify it passes**

Run: `npm run build && npx playwright test --workers=1 zoom`
Expected: PASS (all zoom tests).

- [ ] **Step 9: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 10: Commit**

```bash
git add src/runtime/deck-root.ts dist e2e/zoom.spec.ts
git commit -m "feat(deck-root): pan magnified slide via wheel and drag"
```

---

## Task 4: Reset on slide change + re-clamp on resize

**Files:**
- Modify: `src/runtime/deck-root.ts`
- Modify: `e2e/zoom.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `e2e/zoom.spec.ts`:

```ts
test('navigating to another slide resets the zoom', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  await page.keyboard.press('+');
  await page.keyboard.press('+');
  expect((await zoomState(page)).zoom).toBeGreaterThan(1);

  await page.keyboard.press('ArrowRight'); // navigate
  const after = await zoomState(page);
  expect(after.zoom, 'zoom reset on slide change').toBe(1);
  expect(after.zoomed).toBe(false);
  expect(deck.consoleErrors).toEqual([]);
});
```

- [ ] **Step 2: Build + run to verify it fails**

Run: `npm run build && npx playwright test --workers=1 zoom -g "resets the zoom"`
Expected: FAIL · zoom persists across navigation.

- [ ] **Step 3: Reset zoom on navigation**

In `_goToNow`, as the first statement of the method, add:

```ts
    this._resetZoom();
```

- [ ] **Step 4: Re-clamp the pan on resize**

At the end of `_applyScale` (the arrow function), after the
`if (scale > 0) this.style.setProperty('--deck-scale', String(scale));` line, add:

```ts
    if (this._zoom > 1) {
      this._clampPan();
      this._applyZoom();
    }
```

- [ ] **Step 5: Build + run to verify it passes**

Run: `npm run build && npx playwright test --workers=1 zoom`
Expected: PASS.

- [ ] **Step 6: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/runtime/deck-root.ts dist e2e/zoom.spec.ts
git commit -m "feat(deck-root): reset zoom on slide change, re-clamp pan on resize"
```

---

## Task 5: No-op guards (`no-zoom`, fluid)

**Files:**
- Modify: `src/runtime/deck-root.ts` (no code change expected · guards already in
  `_zoomEnabled`; this task proves them)
- Modify: `e2e/zoom.spec.ts`
- Create: fixtures reuse existing `decks/tests/fluid.html`

- [ ] **Step 1: Add the failing/guard tests**

Append to `e2e/zoom.spec.ts`:

```ts
test('no-zoom disables the feature (browser keeps its zoom)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await page.evaluate(() => document.querySelector('deck-root')!.setAttribute('no-zoom', ''));

  const prevented = await page.evaluate(() => {
    const root = document.querySelector('deck-root')!;
    const ev = new WheelEvent('wheel', { deltaY: -300, ctrlKey: true, cancelable: true, bubbles: true });
    root.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(prevented, 'ctrl+wheel left for the browser').toBe(false);
  expect((await zoomState(page)).zoomed).toBe(false);
});

test('fluid deck does not zoom', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/fluid.html');
  const prevented = await page.evaluate(() => {
    const root = document.querySelector('deck-root')!;
    const ev = new WheelEvent('wheel', { deltaY: -300, ctrlKey: true, cancelable: true, bubbles: true });
    root.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(prevented, 'no zoom in fluid mode').toBe(false);
  expect(document.querySelector ? true : true).toBe(true);
  expect((await zoomState(page)).zoomed).toBe(false);
});
```

- [ ] **Step 2: Build + run**

Run: `npm run build && npx playwright test --workers=1 zoom`
Expected: PASS without code changes (guards live in `_zoomEnabled`). If either
fails, the guard is missing · re-check `_zoomEnabled()` covers `noZoom` and
`_effectiveFluid()`.

- [ ] **Step 3: Add the fixture to the smoke list**

In `e2e/smoke.spec.ts`, add to the `DECKS` array (after `per-slide-fluid.html`):

```ts
  '/rikiki/decks/tests/zoom.html',
```

- [ ] **Step 4: Build + run the smoke + zoom suites**

Run: `npm run build && npx playwright test --workers=1 zoom smoke`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/zoom.spec.ts e2e/smoke.spec.ts
git commit -m "test(deck-root): cover no-zoom and fluid zoom guards"
```

---

## Task 6: Documentation

**Files:**
- Modify: `docs/llms/rikiki-reference.md`
- Modify: `../../CHANGELOG.md` (repo root)
- Modify: `llms.txt`
- Modify: `../site/src/pages/docs/api.astro`
- Modify: `../site/src/pages/docs/plugins.astro`
- Modify: `.claude/skills/rikiki-debug/SKILL.md`

- [ ] **Step 1: Reference · attribute table + new subsection**

In `docs/llms/rikiki-reference.md`, add a row to the `<deck-root>` attribute
table after the `no-arrows` row:

```markdown
| `no-zoom` | *(boolean)* | Disable slide zoom (Ctrl/⌘+wheel, pinch, `+`/`-`/`0`) · on by default; restores the browser's own zoom |
```

After the "Per-slide fluid escape" paragraph in **Rendering & sizing**, add:

```markdown
**Slide zoom.** On by default in fixed-canvas mode: Ctrl/⌘ + wheel (and trackpad
pinch) magnify the active slide around the cursor; `+`/`-` zoom by steps and `0`
resets to fit. While magnified, a plain wheel and pointer drag pan the slide, and
slide navigation snaps back to fit. Because it scales the whole stage uniformly,
fonts and layout grow together (no reflow) · this is also how to "make the fonts
bigger". Zoom is a no-op in `fluid` mode (nothing fixed to magnify), in overview,
and with `no-zoom`. It is local to the projected window (not mirrored into the
presenter popup).
```

Update the wheel note added earlier (the "Ctrl/⌘ + wheel … left for the browser's
zoom" sentence) to read:

```markdown
that element reaches its scroll edge. **Ctrl/⌘ + wheel and trackpad pinch zoom
the slide** (see Slide zoom below); set `no-zoom` to leave zoom to the browser.
The
```

- [ ] **Step 2: CHANGELOG**

In repo-root `CHANGELOG.md`, under `## [Unreleased]` → `### Added`, add:

```markdown
- **Slide zoom.** Ctrl/⌘ + wheel, trackpad pinch and `+`/`-`/`0` magnify the
  active slide around the cursor and pan it (drag or wheel), fixed-canvas only,
  on by default. Scales fonts and layout together (no reflow). Opt out with
  `no-zoom` on `<deck-root>`.
```

- [ ] **Step 3: llms.txt**

In `llms.txt`, after the presenter bullet under "Plugins (opt-in, lazy)" is not
the right spot · instead add to the runtime touchpoints line a note. Add this
bullet right after the "Writing a plugin" bullet:

```markdown
- **Slide zoom**: Ctrl/⌘+wheel / pinch / `+`/`-`/`0` magnify a slide (fixed canvas, on by default, pan by drag/wheel); `no-zoom` on `<deck-root>` opts out.
```

- [ ] **Step 4: Site api.astro**

In `site/src/pages/docs/api.astro`, add a row to the reactive-properties table
after the `noArrows` row:

```html
    <tr><td><code>noZoom</code></td>   <td><code>boolean</code> · attr <code>no-zoom</code></td> <td>Disable slide zoom (Ctrl/⌘+wheel, pinch, <code>+</code>/<code>-</code>/<code>0</code>) · on by default.</td></tr>
```

- [ ] **Step 5: Site plugins.astro**

In `site/src/pages/docs/plugins.astro`, in the presenter section is unrelated;
add a short paragraph under the `<h2 id="presenter">` block is wrong · instead
append to the mouse-navigation description. Add after the `</p>` that ends the
presenter multi-screen paragraph a new standalone note is out of place. Place
this in the cost-model-adjacent prose: directly before `<h2 id="cost">`, add:

```html
<h2 id="zoom">Slide zoom</h2>
<p>
  In the default fixed canvas, <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + wheel and trackpad
  pinch magnify the active slide around the cursor; <kbd>+</kbd>/<kbd>-</kbd> zoom
  by steps and <kbd>0</kbd> resets. While magnified, a plain wheel and pointer
  drag pan the slide, and changing slide snaps back to fit. It scales the whole
  slide uniformly (fonts and layout together, no reflow), so it doubles as a
  "bigger fonts" control. It is a no-op in <code>fluid</code> mode and in
  overview; set <code>no-zoom</code> on <code>deck-root</code> to leave zoom to
  the browser.
</p>
```

- [ ] **Step 6: rikiki-debug skill**

In `.claude/skills/rikiki-debug/SKILL.md`, replace the existing "Zoom does
nothing" row with:

```markdown
| Zoom does nothing / "ça zoom pas" | Slide zoom is on by default in the fixed canvas: Ctrl/⌘+wheel, pinch, or `+`/`-`/`0` magnify the slide (drag/wheel to pan, any nav resets). If it does nothing: the deck is in `fluid` mode (no fixed layout to magnify · use the fixed canvas), `no-zoom` is set, or an overlay (`?`/`O`) is open. For reflowing bigger text instead of magnification, use `fluid` + `cqw/cqh`. |
```

- [ ] **Step 7: Dash-lint the site + build site check**

Run: `cd ../site && node scripts/lint-dashes.mjs && npx astro check`
Expected: `lint:dashes · OK`, astro `0 errors`.

- [ ] **Step 8: Commit**

```bash
git add docs/llms/rikiki-reference.md llms.txt .claude/skills/rikiki-debug/SKILL.md \
        ../../CHANGELOG.md ../site/src/pages/docs/api.astro ../site/src/pages/docs/plugins.astro
git commit -m "docs(rikiki): document slide zoom + no-zoom"
```

---

## Task 7: Final validation

**Files:** none (verification only)

- [ ] **Step 1: Full build + dist sync**

Run: `npm run build && git diff --stat -- dist`
Expected: build completes; staged `dist` reflects the zoom changes (commit any
remaining `dist` drift with the relevant prior task if the working tree shows it).

- [ ] **Step 2: Unit + full e2e**

Run: `npm test && npx playwright test --workers=1`
Expected: vitest all pass; Playwright all pass (smoke + navigation + scaling +
embed + lifecycle + per-slide-fluid + click-stages + shiki + zoom).

- [ ] **Step 3: Lint + typecheck + dash-lint**

Run: `npm run typecheck && npm run lint && (cd ../site && node scripts/lint-dashes.mjs)`
Expected: all clean.

- [ ] **Step 4: Manual sanity in the browser (multi-zoom can't be e2e'd for feel)**

Serve and open `decks/tests/zoom.html`; confirm Ctrl+wheel magnifies around the
cursor, drag pans, `0` resets, arrow navigation resets. Note: feel/anchoring is
verified manually; the e2e covers state transitions.

---

## Self-review

**Spec coverage:**
- Approach A transform → Task 1 Step 4. ✓
- State `_zoom`/`_panX/Y`/`no-zoom`/`data-zoomed` → Task 1 Steps 5-6. ✓
- `_zoomEnabled` guards (fluid/overview/blank/no-zoom) → Task 1 Step 6, proven in Task 5. ✓
- Ctrl/⌘+wheel cursor-anchored zoom → Task 1 Step 7 (`_zoomAt`). ✓
- `+`/`-`/`0` keys → Task 2. ✓
- Pan via wheel + drag, suspend click/swipe → Task 3. ✓
- Reset on slide change + resize re-clamp → Task 4. ✓
- Pan clamp bounds → `_clampPan` (Task 1 Step 6), exercised by pan tests. ✓
- Docs (reference/CHANGELOG/llms/astro/skill) → Task 6. ✓

**Placeholder scan:** no TBD/TODO; every code step has concrete code. One test
line `expect(document.querySelector ? true : true).toBe(true);` in Task 5 Step 1
is filler · remove it when implementing (kept the test focused on `prevented` +
`zoomed`).

**Type/name consistency:** `_zoom`, `_panX`, `_panY`, `_applyZoom`, `_clampPan`,
`_zoomAt`, `_resetZoom`, `_panBy`, `_zoomEnabled`, `noZoom`, `ZOOM_MAX`,
`ZOOM_STEP`, `ZOOM_WHEEL_SENSITIVITY`, `data-zoomed`, `data-panning`,
`--deck-zoom`, `--deck-pan-x`, `--deck-pan-y` are used consistently across tasks.
`_effectiveFluid()` and `width`/`height` already exist on the class.

**Note for implementer:** delete the filler assertion noted above; keep the
`prevented`/`zoomed` assertions.
