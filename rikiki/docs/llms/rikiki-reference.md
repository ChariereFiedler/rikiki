# Rikiki · LLM reference

This reference documents rikiki v0.6.0.

Exhaustive, self-consistent reference for authoring valid **rikiki** decks. Every
tag, attribute, slot, and token below was derived from the source in this repo
(`src/index.ts` is the canonical component list; `themes/rikiki.css` is the
canonical token list). Do not invent tags, attributes, or tokens · use only what
is listed here.

---

## 1 · What rikiki is

Rikiki is a presentation framework built as **Lit Web Components**. A deck is
plain HTML: there is **no build step** to author or run one. You load a theme
stylesheet, then the component bundle, then write a `<deck-root>` that wraps
`deck-*` slide elements.

Load order matters · **theme CSS first, then `dist/index.js`**:

```html
<link rel="stylesheet" href="./tokens.css">
<script type="module" src="./dist/index.js"></script>
```

`tokens.css` simply `@import`s the default theme (`themes/rikiki.css`); you may
link a theme directly instead (e.g. `themes/siliceum.css`).

Each direct child of `<deck-root>` is one slide. `<deck-root>` handles
navigation, hash routing, the progress bar, step dots, and the keyboard hint.

---

## 2 · Minimal deck

The canonical skeleton (see `starter.html`):

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My deck</title>
<link rel="stylesheet" href="./tokens.css">
<script type="module" src="./dist/index.js"></script>
</head>
<body>
<deck-root>
  <deck-cover brand="my talk" speaker="Your name" duration="~25 min" audience="Your audience">
    <h1>Deck <span class="accent">title</span></h1>
    <p class="sub">Subtitle or opening question</p>
  </deck-cover>

  <deck-section num="Section 1">
    <h1>A first<br>chapter</h1>
  </deck-section>

  <deck-feature eyebrow="Topic">
    <h1 slot="title">Headline · sharp claim</h1>
    <p slot="lead" class="lead">One sentence that frames the slide.</p>
    <deck-code lang="js" hero>
      const greet = (name) => `Hello, ${name}!`;
    </deck-code>
  </deck-feature>
</deck-root>
</body>
</html>
```

(Adjust the relative paths to wherever rikiki's `tokens.css` and `dist/` sit
relative to your deck file.)

---

## 3 · Navigation & hash

`<deck-root>` listens for keys globally (ignored while typing in an
`input`/`textarea`/`[contenteditable]`).

| Key(s) | Action |
|--------|--------|
| `→` / `↓` | Advance (next step, else next slide) |
| `←` / `↑` | Back |
| `Space` / `PageDown` | Advance |
| `PageUp` | Back |
| `Home` | First slide |
| `End` | Last slide |
| `O` | Overview grid (toggle; `Esc`/`Enter`/`O` exit) |
| `P` | Presenter / speaker window (toggle) |
| `?` / `H` | Keyboard help overlay |
| `Esc` | Close help overlay |
| `B` / `.` | Blank screen black (any key restores) |
| `W` / `,` | Blank screen white (any key restores) |

**2D navigation** is **opt-in** via `nav="2d"` on `<deck-root>` (it also needs
2+ chapters, bounded by `<deck-section>` markers, with at least one multi-slide
chapter). In 2D mode: `←`/`→` move between chapters, `↑`/`↓` move within a
chapter (both fall back to linear motion at the edges). Without `nav="2d"` the
deck stays **linear**: arrows always move to the next/previous slide, so adding
sections never silently remaps `←`/`→` to chapter jumps.

**Mouse navigation** is on by default (since 0.3.0): left click advances
(Shift+click goes back), the scroll wheel navigates with a trackpad-friendly
debounce, discreet chevrons sit bottom-right (2D-aware), and mouse
back/forward buttons map to back/advance. The wheel yields to scrollable
content: a wheel over an overflowing descendant (a tall `deck-code` block, a
zoomable inline `<svg>`, …) scrolls it natively and only advances the deck once
that element reaches its scroll edge. **Ctrl/⌘ + wheel and trackpad pinch zoom
the slide** (see Slide zoom below); set `no-zoom` to leave zoom to the browser.
The bottom-left key-hint chips
(`← → O P ?`) are also clickable shortcuts for the matching action. Interactive
elements (`a`, `button`, inputs, `[contenteditable]`) never trigger navigation;
add `data-no-advance` to opt any element out. Configure with the `mouse-nav`
attribute on `<deck-root>`:

| Value | Meaning |
|-------|---------|
| *(absent)* | Everything on · the default |
| `mouse-nav="none"` | Keyboard-only deck (pre-0.3 behavior) |
| `mouse-nav="wheel arrows"` | Granular subset of `click`, `wheel`, `arrows`, `aux` |

Chevron styling tokens: `--deck-root-nav-color`, `--deck-root-nav-bg`,
`--deck-root-nav-opacity`.

**`<deck-root>` attributes** (all optional):

| Attribute | Values | Effect |
|-----------|--------|--------|
| `nav` | `2d` | Opt into 2D (chapter/slide) navigation · see above |
| `mouse-nav` | *(absent)* / `none` / subset of `click wheel arrows aux` | Mouse navigation config · see above |
| `transition` | `slide` (default-ish) / `slide-up` / `slide-down` / `slide-right` / `fade` / `zoom` / `flip` | Deck-wide slide transition (see table below) |
| `fluid` | *(boolean)* | Fluid rendering · the deck fills its box and reflows like a web page (no logical canvas, no zoom-to-fit scale, no letterbox). Default is zoom-to-fit · see Rendering & sizing below. Also accepted **per slide** · see below |
| `width` / `height` | integers (default `1920` / `1080`) | Logical canvas size for zoom-to-fit · only the aspect ratio and the rem baseline depend on these. Ignored in `fluid` mode |
| `no-hint` | *(boolean)* | Hide the bottom-left key-hint chips (`← → · O · P · ?`) |
| `no-arrows` | *(boolean)* | Hide the bottom-right on-screen navigation chevrons |
| `no-zoom` | *(boolean)* | Disable slide zoom (Ctrl/⌘+wheel, pinch, `+`/`-`/`0`) · on by default; restores the browser's own zoom |
| `no-counter` | *(boolean)* | Hide the slide counter (it is already hidden on cover, overview and blank screens) |
| `preview` | *(boolean)* | Inert mode · render and letterbox the deck but wire no input, autoplay or presenter handlers. Used internally by the presenter's Current preview as a control surface; rarely set by hand |
| `autoplay` | integer ms (e.g. `8000`) | Auto-advance every N ms; pauses on hover, resets on any manual nav. `0`/absent = off |
| `loop` | *(boolean)* | With `autoplay`, wraps from the last slide back to the first |
| `swipe` | *(boolean)* | Pointer-driven horizontal swipe (touch + mouse): a swipe ≥ 60 px advances / goes back |

In presenter mode (`P`) the projected (main) window auto-hides its hint chips
and nav arrows while the speaker popup is open · `no-hint` / `no-arrows` stay
useful for a clean look outside presenter mode (and for embedded thumbnails).

**Rendering & sizing.** By default a deck renders into a fixed logical canvas
(`width`×`height`, 1920×1080 by default) scaled uniformly to fit the host box,
so a slide's layout is identical at any window size and the deck is letterboxed
when the aspect differs. Set `fluid` to opt out: the deck then fills its box and
reflows like a web page. Either mode is embed-safe · a `<deck-root>` placed
inside a larger document scales to (or fills) its own container and never
touches the host page's scroll or typography.

**Per-slide fluid escape.** A single slide can opt out of the fixed canvas by
carrying its own `fluid` attribute · while that slide is active the deck drops
the zoom-to-fit scale and letterbox and gives the slide the real viewport (the
rem baseline tracks the viewport too), then restores the canvas on navigation
back to a fixed slide. Use it for one slide that embeds a live interactive demo
(an `<iframe>` playground, a mini-game) which should consume the whole screen
while the rest of the deck stays on the predictable fixed canvas:

```html
<deck-root>
  <deck-feature><h1 slot="title">Regular fixed slide</h1></deck-feature>
  <deck-feature fluid>
    <iframe src="playground.html" style="position:fixed; inset:0; border:0;"></iframe>
  </deck-feature>
</deck-root>
```

(A deck-wide `fluid` already makes every slide fluid · the per-slide attribute
is only meaningful inside an otherwise fixed deck.)

**Slide zoom.** On by default in fixed-canvas mode: Ctrl/⌘ + wheel (and trackpad
pinch) magnify the active slide around the cursor; `+`/`-` zoom by steps and `0`
resets to fit. While magnified, a plain wheel and pointer drag pan the slide, and
slide navigation snaps back to fit. Because it scales the whole stage uniformly,
fonts and layout grow together (no reflow) · this is also how to "make the fonts
bigger". Zoom is a no-op in `fluid` mode (nothing fixed to magnify), in overview,
and with `no-zoom`. It is local to the projected window (not mirrored into the
presenter popup).

**Transition values** (deck-wide via `transition="…"` on `<deck-root>`, or
per-slide via `data-transition="…"` on a slide host). When unset, the effective
default is `fade`:

| Value | Effect |
|-------|--------|
| `slide` | Horizontal slide, direction-aware (back navigation slides the other way) |
| `slide-up` | Vertical slide from the bottom |
| `slide-down` | Vertical slide from the top |
| `slide-right` | Horizontal slide from the left |
| `fade` | Cross-fade with a slight scale (the effective default) |
| `zoom` | Scale-in / scale-out |
| `flip` | 3D flip on the Y axis |

A per-slide `data-transition` overrides the deck-wide `transition` for that one
navigation. (A `data-morph` reveal temporarily suppresses the transition so the
two don't fight · see §7.)

**Hash format** (deep-linking):

| Form | Meaning |
|------|---------|
| `#3` | slide 3 (1-based) |
| `#3.2` | slide 3, step 2 |
| `#2.3` | chapter 2, slide 3 (2D nav only) |
| `#2.3s1` | chapter 2, slide 3, step 1 (2D nav only) |

The 2D forms only apply when 2D navigation is active; otherwise `#a.b` is read as
`slide.step`.

Out-of-range deep links are **clamped to the nearest valid position**, not reset
to the first slide: a slide/chapter index past the end lands on the last one, and
a step past a slide's range settles on its last step. This keeps a bookmarked
`#4.3` usable while you iterate (e.g. after deleting a bullet that had a click).

---

## 4 · Layouts (slide-level containers)

Direct children of `<deck-root>`. Each is one slide.

| Tag | Purpose | Key attributes | Slots |
|-----|---------|----------------|-------|
| `deck-cover` | Opening slide, dark, with brand + meta | `brand` (split on " · "), `brand-src` (logo URL), `speaker`, `company`, `duration`, `audience`, `runtime`; per-row label overrides `speaker-label`, `company-label`, `duration-label`, `audience-label`, `runtime-label` | default `<h1>`, `.sub`/`p[slot=sub]` |
| `deck-section` | Chapter divider (also a chapter boundary for 2D nav) | `num` | default `<h1>` (may use `<em>`) |
| `deck-feature` | Headline + lead + one focal block | `eyebrow` | `title` (`<h1>`), `lead`, default (focal block, e.g. `deck-code`) |
| `deck-split` | Two or three columns side by side | `eyebrow`, `cols` (`1-1`/`1-2`/`2-1`/`3`), `gap` (1..6 or raw CSS length), `col-gap` (1..6 or raw CSS length) | `title`, `lead`; `left`/`right` (2-col) or `a`/`b`/`c` (3-col) |
| `deck-feature-cards` | Hero focal block + two detail cards under it | `eyebrow` | `title`, `lead`, default (hero block), `left`, `right` |
| `deck-photo` | Full-bleed image slide, content on overlay | `src` (required), `position` (CSS `object-position`, default `center`), `darken` (0..1 overlay alpha, default `0.35`), `align` (top/center/bottom, default center), `text-align` (left/center/right, default left) | default slot: any content; style slotted children with `.sub`/`.kicker` classes (these are **CSS classes**, not named slots) |
| `deck-takeaway` | Centered punchline, dark | `kicker` | default (e.g. `p.display`, `p.caption`, a `deck-callout`) |
| `deck-bento` | Bento grid slide · multi-row/column cells share the space | `eyebrow`, `cols` (1..12 or template, default 2), `rows` (1..12 or template, default 1 full-height row), `gap` (1..6 or CSS, default 3), `align`, `justify` | `title` (`<h1>`), default (`deck-cell` children) |

---

## 5 · Molecules (composed containers)

| Tag | Purpose | Key attributes | Slots / children |
|-----|---------|----------------|------------------|
| `deck-callout` | Highlighted note box | `type` (`info`/`warn`/`danger`/`ok`) | default (text / `deck-md`) |
| `deck-card` | Tinted card | `color` (`yellow`/`orange`/`green`/`red`), `center`, `compact` | default (`<h3>` + body) |
| `deck-md` | Render Markdown (GFM) · also expands `::: cards` blocks into a tinted card grid | · | default = raw Markdown text |
| `deck-mermaid` | Render a Mermaid diagram (loads Mermaid from CDN) | `compact` | default = Mermaid source |
| `deck-stat` | Big-number visual | `num`, `tone` (`yellow`/`orange`/`green`/`red`/`purple`/`lime`/`cyan`) | `claim` (`<h3>`), default = body line |
| `deck-metric-list` | Wraps `deck-metric` rows | · | `deck-metric` children |
| `deck-metric` | One metric row | `severity` (`bad`/`warn`/`ok`/`info`), `value`, `mono` (render the value in the mono font) | default = label |
| `deck-tier-list` | Tier ladder | · | `deck-tier`, `deck-tier-arrow` children |
| `deck-tier` | One tier row | `name`, `speed`, `severity` (`muted`/`warn`/`ok`/`hot`), `hot` | default = description text |
| `deck-tier-arrow` | Separator note between tiers | · | default = text |
| `deck-step-list` | Numbered step ladder | · | `deck-step` children |
| `deck-step` | One step row | `n`, `note` | default = label |
| `deck-shortcut-list` | Shortcut grid | `cols` (column count, e.g. `1`), `col-gap` (1..6) | `deck-shortcut` children |
| `deck-shortcut` | One keyboard-shortcut row | `keys` (space-separated), `label`, `note`, `tone` (`accent`/`ok`) | default = note |
| `deck-kbd` | Inline key chip | `tone` (`accent`/`ok`) | default = key text |
| `deck-stack` | Flex stack helper | `gap` (1..6), `direction` (`row`/`column`), `align` (`start`/`center`/`end`/`stretch`), `justify` (`start`/`center`/`end`/`between`/`around`), `fill` (grow to fill the cross axis) | children |
| `deck-grid` | CSS grid helper | `cols` (1..12 or template), `rows`, `gap` (1..6 or CSS), `align`, `justify`, `fill` | children |
| `deck-cell` | Bento grid item · a `container-type: size` box so child `cqw`/`cqh` type scales against the cell, not the slide. A slotted `img`/`svg`/`video` auto-fits the cell (object-fit contain); a slotted `table` fills the width | `span` (`"CxR"`, e.g. `2x1`, or a bare column count), `col`/`row` (per-axis override · integer → `span N`, else raw line syntax), `tone` (`info`/`warn`/`ok`/`danger`), `plain` (drop the card chrome), `flat` (keep the surface but drop the border), `align` (**horizontal**: `start`/`center`/`end`/`stretch`), `justify` (**vertical**: `start`/`center`/`end`/`between`) | default (`<h3>` + body, or any block) |
| `deck-fit` | Shrink slotted content to fit its box by font-size (for non-`deck-punch` text content · not for images, which scale geometrically) | `min` (rem, default 1), `max` (rem, default 12) | default = any content |
| `deck-csv` | Render inline CSV as a styled table (cells are trimmed) | `delimiter` (default `,`), `no-header` (first row is data), `fit` (shrink the table to fit the cell), `fit-min`/`fit-max` (rem bounds, default 0.6/2) | default = raw CSV text |

---

## 6 · Atoms (primitives)

| Tag | Purpose | Key attributes | Slots |
|-----|---------|----------------|-------|
| `deck-badge` | Small status badge | `type` (`bad`/`ok`/`info`/`warn`/`neutral`) | default = text |
| `deck-kicker` | Uppercase eyebrow label | `on-dark` | default = text |
| `deck-punch` | Short punchy line | `tone` (`warn`/`danger`/`ok`/`info`/`muted`/`accent`; inherits text color if absent), `size` (`lead`/`big`/`mega`/`stat`/`display`), `weight` (`700`/`800`/`900`), `align` (`left`/`center`/`right`), `fit` (shrink to fit the box · overrides `size`/cqw fluid scaling), `fit-min`/`fit-max` (rem bounds, default 1/12) | default = text |
| `deck-code` | Syntax-highlighted code | `lang`, `hero`, `nested`, `step-groups` | default = code text |

### deck-code details

- `lang` · drives highlighting. The **built-in highlighter understands only**
  `js` / `ts` / `json` (default), `html` / `xml` / `svg`, and `css` / `scss` /
  `less`. **Any other value** (`python`, `rust`, `bash`, `go`, `sql`, …) is **not
  an error and produces no warning** — the block is silently colored with the JS
  rules, so the result looks plausible but is wrong. For any language outside the
  list above, install the Shiki plugin (see below); it adds Shiki's full set of
  grammars and is the only way to highlight non-built-in languages correctly.
- `hero` · centers the block vertically as the slide's focal element.
- `nested` · lighter border, no shadow (for use inside a `deck-card`).
- `step-groups` · a JSON array attribute that turns the snippet into a stepped
  reveal; the number of groups becomes the slide's step count (see §7).

Highlighting is done client-side with a built-in regex highlighter (no build
step), limited to the languages listed under `lang` above. An opt-in **Shiki
plugin** upgrades every `deck-code` block to Shiki's full grammar/theme set —
**required** whenever a deck uses a language the built-in highlighter does not
understand.

### Shiki plugin (optional, opt-in)

`src/plugins/shiki.ts` (`dist/shiki.js`) re-renders all `<deck-code>` blocks
through [Shiki](https://shiki.style), loaded from the vendored
`dist/vendor/shiki.js` bundle on first use (offline · no CDN). Install it after
the rikiki bundle:

```html
<script type="module" src="./dist/index.js"></script>
<script type="module">
  import { installShiki } from './dist/shiki.js';
  await installShiki({ theme: 'one-dark-pro', langs: ['ts', 'tsx', 'html', 'css'] });
</script>
```

API:

```ts
async function installShiki(opts?: {
  theme?: string;    // any Shiki theme name (https://shiki.style/themes) · default 'one-dark-pro'
  langs?: string[];  // grammars to preload · default ['ts', 'js', 'html', 'css', 'json']
}): Promise<void>
```

- Any Shiki theme/language works (not just the built-in highlighter's set); set
  `langs` to whatever your deck uses.
- Shiki owns the palette under this plugin: it colors each token with an inline
  style from the chosen `theme`, so pick a `theme` that suits your code
  background (e.g. `one-dark-pro` on a dark deck). The `--deck-code-syntax-*`
  tokens only affect the built-in highlighter, not Shiki output.
- A language not loaded falls back silently to the built-in regex highlighter
  (no error).
- **How it hooks in:** it registers a highlighter on the shared `<deck-code>`
  class via `setDeckCodeHighlighter` (resolved through `customElements.get`), so
  it never patches the component's internals · see *Writing a plugin* below.
- **Trade-off:** the vendored Shiki bundle is large (every grammar + theme, JS
  engine, no wasm). That is why it is opt-in and lazy · the core bundle stays
  ~39 KB gzip.

---

## 7 · Steps & animations

Two independent mechanisms drive in-slide reveals; both serialize through the
slide's `step` so they also work inside presenter mirror iframes.

### Built-in steps (no plugin)

- **`steps="N"`** (or `data-steps="N"`) on a slide host declares N reveal steps.
- **`[data-step-block]`** elements inside a slide are hidden until their step is
  reached. `<deck-root>` toggles their visibility as `step` advances.
- **`deck-code[step-groups='[…]']`** · a code block whose `step-groups` JSON
  array defines line groups revealed step by step; its group count sets the
  slide's step count automatically.

The step dots at the bottom of the deck reflect the active slide's step count.

### Click-stages plugin (per-element reveals)

`src/plugins/click-stages.ts` adds Slidev-style `v-click` reveals. rikiki drives
them with **attributes** (`data-click` on any element) · it does **not** support
Slidev's `<v-click>` / `<v-clicks>` wrapper elements. It is **opt-in** · not part
of the core bundle. Install it after rikiki loads:

```html
<script type="module" src="./dist/index.js"></script>
<script type="module">
  import { installClickStages } from './dist/click-stages.js';
  installClickStages();
</script>
```

Then annotate any element inside a slide:

| Attribute | Effect |
|-----------|--------|
| `data-click` | Hidden initially; appears at the next click (bare attributes get sequential steps in document order) |
| `data-click="N"` | Appears at explicit step N |
| `data-click-hide` | Visible initially; hidden once its click step is reached (`data-click-hide="N"` for an explicit step) |
| `data-anim="…"` | Reveal animation: `fade` (default), `slide-up`, `slide-down`, `slide-left`, `slide-right`, `scale`, `blur`, `flip-up`, `draw` (traces stroked SVG paths) |
| `data-anim-duration="600"` | Per-element duration in ms (default 320) |
| `data-anim-delay="120"` | Per-element delay in ms (default 0) |
| `data-anim-ease="…"` | `out` (default), `spring`, `in-out`, or any raw `cubic-bezier(…)` |
| `data-click-auto="800"` | **No click consumed** · reveals 800 ms after the previous stage (or slide activation). Consecutive autos chain · one click can drive a whole choreography |
| `data-click-stagger="80"` | On a container · **one** click flips its children in a cascade, 80 ms apart (`"0"` = simultaneous). A child with `data-click-hide` hides at that step instead of revealing |
| `data-click-children` | On a container · each direct child becomes its own sequential click, inheriting the container's `data-anim*` |
| `data-morph="key"` | Pair two elements (across steps of one slide, or across consecutive slides) · the element glides/resizes from A to B like Keynote's Magic Move. Uses the View Transitions API, with a WAAPI FLIP fallback on browsers without it (Firefox). Targets must be light-DOM elements |

Example:

```html
<deck-feature eyebrow="Demo">
  <h1 slot="title">Click stages</h1>
  <p data-click data-anim="slide-up" data-anim-duration="600" data-anim-ease="spring">First reveal</p>
  <p data-click-auto="500">Follows the first reveal automatically after 500 ms</p>
  <ul data-click-stagger="80" data-anim="slide-up">
    <li>wave 1</li><li>wave 2</li><li>wave 3</li>
  </ul>
  <p data-click="3" data-anim="scale">Explicit step</p>
</deck-feature>
```

Morph pairs that swap on the same click need explicit steps
(`data-click-hide="1"` on the outgoing element, `data-click="1"` on the
incoming one) · bare attributes would put them on two sequential clicks.

The plugin registers on each `<deck-root>` through the plugin hook API (see
*Writing a plugin* below): its `steps` hook makes the step counter account for
`[data-click]` elements, its `applyStep` hook toggles their visibility, and its
`navigate` hook wraps cross-slide `data-morph` transitions. Going back cancels
pending auto/stagger timers. Deep links and back-navigation settle instantly (no
replayed delays). It respects `prefers-reduced-motion`. When a `data-morph`
navigation runs, the deck-wide `transition="…"` animation is skipped for that
navigation so the two don't fight, and pending auto/stagger reveals start
once the morph settles instead of firing mid-transition. On auto/stagger
elements, `data-anim-delay` is folded into the timer (delays add up once,
they don't apply twice).

### Writing a plugin (the hook API)

Both opt-in plugins extend the deck through a small **public** contract rather
than reaching into engine internals. A plugin is a `DeckPlugin` object; register
it on a deck instance with `deckRoot.use(plugin)`, which returns an unregister
function.

```ts
import type { DeckPlugin } from './dist/index.js';

const myPlugin: DeckPlugin = {
  name: 'my-plugin',                          // unique · use() is idempotent by name
  setup(ctx) { /* … */ return () => {}; },    // on register · optional teardown
  steps(slide, ctx) { return 0; },            // contribute step count (combined as a max)
  applyStep(step, slide, ctx) { /* … */ },    // after the engine applied the step
  navigate(to, ctx, proceed) { return false; }, // around-advice · call proceed() to navigate
};
document.querySelector('deck-root').use(myPlugin);
```

The `ctx` (`DeckContext`) is the only surface a plugin touches:
`ctx.host` (the element), `ctx.current`, `ctx.step`, `ctx.slides`,
`ctx.requestUpdate()`. Notes:

- **`navigate` is around-advice** · return a truthy value to take ownership and
  call `proceed()` yourself (e.g. inside a `startViewTransition`); return falsy
  to let the engine navigate. Only the **first** registered plugin with a
  `navigate` hook owns navigation (a second one warns and is ignored).
- **`steps` from all plugins are combined with the engine's own as a maximum.**
- **`<deck-code>` highlighting** is a separate hook: `setDeckCodeHighlighter(fn)`
  registers a `(code, lang) => string | null` highlighter on the shared
  `<deck-code>` class (return `null` to fall back to the built-in regex one).
- `installClickStages()` / `installShiki()` are **back-compat shims** that attach
  the plugin to every `<deck-root>` already on the page · a deck created
  dynamically *after* the call must register the plugin itself with `use()`.

---

## 8 · Presenter mode

Press **`P`** to open a speaker window. It mirrors the current slide and the
next slide (rendered live via the rikiki bundle), shows a timer/clock, and
displays the speaker notes for the current slide.

On a Chromium browser with a second screen, pressing **`P`** sends the **deck
fullscreen to the external screen** (the projector) and opens the **speaker
window on the speaker's current screen** · the audience gets the slides, the
speaker keeps the presenter view on their laptop. The deck fullscreen is
released when the presenter closes. Without the Window Management API
(Firefox/Safari), the permission, or a second screen, the deck stays in its
window and the popup uses the default placement.

Notes on the first use: the **first** `P` press prompts for the Window
Management permission; the speaker window always opens regardless (it is never
blocked on the prompt). The slides move to the projector as soon as the screen
layout is known · because that layout is only available after the permission is
granted, the very first time may take a second `P` press (close + reopen) before
the slides go fullscreen; afterwards it happens on the press itself (the cached
layout lets the fullscreen ride the keypress activation, and `window.open`
relies on popups being allowed for the origin · which the presenter already
requires). The Current/Next previews are constrained to a 16:9 box so the
thumbnail matches the projected slide's geometry regardless of the window shape.
While the speaker window is open, the projected deck auto-hides its key-hint
chips and nav arrows (the same effect as `no-hint` / `no-arrows`), restoring
them on close.

Speaker notes live in a `<deck-notes>` element placed inside any slide host.
It is hidden in the deck itself; only the presenter window reads its text.

```html
<deck-feature>
  <h1 slot="title">My slide</h1>
  <deck-notes>
    - Mention the migration story
    - Pause for laughter on the Java joke
  </deck-notes>
</deck-feature>
```

---

## 9 · Multi-deck assembly

Split a long talk into small partial files and assemble them into one deck at
build time. The assembler is `build/vite-deck.mjs` (pure Node · no runtime
weight added).

A `deck.config.js` (or `.json`) describes the deck:

```js
export default {
  title: 'My talk',
  theme: '../../tokens.css',   // theme href, relative to the OUTPUT file
  bundle: '../../dist/index.js', // rikiki bundle href, relative to OUTPUT
  transition: 'slide',         // optional <deck-root transition="…">
  slides: [
    'parts/cover.html',
    'parts/intro.md',
    'parts/closing.html',
  ],
};
```

- **`.html` partials** are inlined verbatim (one or more `deck-*` elements each).
- **`.md` partials** can hold one or many slides. A line that is exactly `---`
  splits the file into separate slides (reveal.js convention); each chunk is
  wrapped into its own `<deck-feature><deck-md>…</deck-md></deck-feature>`. Use
  `***` for a horizontal rule inside a slide (since `---` is the slide break).

Run it:

```bash
node build/vite-deck.mjs decks/example/deck.config.js
# or with an explicit output path:
node build/vite-deck.mjs decks/example/deck.config.js dist-decks/example.html
```

There are also npm scripts: `npm run deck <config>` and `npm run deck:example`.
The default output file is named from `title` and written next to the config.

### Bundling caveat for assembled decks

> The single-file export step (`bundle.mjs`, §12) only rewrites paths that use
> the `rikiki/…` convention · specifically references matching
> `rikiki/(dist|themes|tokens.css)` (as the decks under `examples/` do). It does
> **not** resolve plain relative paths like `../../dist/index.js`.
>
> The in-repo `decks/example` deliberately uses `../../dist/index.js` /
> `../../tokens.css` relative paths so it can be **served directly** for dev. As
> a result, `decks/example`'s assembled output is meant for direct serving and
> does **not** bundle via `bundle.mjs` as-is. To produce a bundleable assembled
> deck, point its `deck.config.js` `theme`/`bundle` at the `rikiki/…`-style paths
> that `bundle.mjs` rewrites.

---

## 10 · Livereload (authoring only)

`src/livereload.ts` polls the `Last-Modified`/etag of the deck's files and
auto-reloads the page when any change (showing a brief toast and keeping the
current slide via the hash). It watches: the deck's `<link rel="stylesheet">`
hrefs, the rikiki component files in `dist/`, and the deck HTML itself.

Enable it two ways:

- **`?live`** on the deck URL · `dist/index.js` lazy-imports the poller only when
  this query param is present, e.g. `…/starter.html?live`.
- **Load the module directly** · `<script type="module" src="./dist/livereload.js">`
  (it auto-starts on import).

Livereload is for authoring only; never ship it in a presented or bundled deck.

---

## 11 · Theming tokens

The theme defines three layers (`themes/rikiki.css`):

1. **Palette** (`--rik-palette-*`) · raw colors, **private**; never consume
   directly.
2. **Semantic** (`--rik-<role>--<modifier>`) · the **public** API; this is what
   decks and components reference.
3. **Component** (`--deck-<tag>-*`) · per-component knobs that default to
   semantic tokens; override on a host to retheme one instance.

Override semantic tokens at `:root` to retheme the whole deck, or set component
tokens on a single host. Representative semantic tokens (see `themes/rikiki.css`
for the full list):

| Group | Examples |
|-------|----------|
| Surfaces | `--rik-surface-page`, `--rik-surface-raised`, `--rik-surface-inverse`, `--rik-surface-inverse--soft` |
| Text | `--rik-text-default`, `--rik-text-default--muted`, `--rik-text-inverse`, `--rik-text-inverse--muted` |
| Borders | `--rik-border-default`, `--rik-border-inverse` |
| Accent | `--rik-accent`, `--rik-accent--soft`, `--rik-accent--strong`, `--rik-accent__on` |
| Status | `--rik-status-success`, `--rik-status-danger`, `--rik-status-warn`, `--rik-status-info` (each with `__bg` / `__border`) |
| Spacing | `--rik-space-1` … `--rik-space-6`, `--rik-space-hair`, `--rik-space-2xs` |
| Radius | `--rik-radius-xs`, `--rik-radius-sm`, `--rik-radius-md`, `--rik-radius-lg`, `--rik-radius-pill` |
| Fonts | `--rik-font-sans`, `--rik-font-display`, `--rik-font-mono` |
| Type scale | `--rik-text-xs` … `--rik-text-4xl`, plus legacy `--rik-font-size-*` aliases |
| Motion | `--rik-motion-fast`, `--rik-motion-base`, `--rik-motion-slow`, `--rik-motion__ease-out` |
| Code surface | `--rik-code__bg`, `--rik-code__text`, `--rik-code__syntax-keyword`, … |

**Deck chrome** · `<deck-root>` exposes component tokens to restyle its own
overlay UI (set them on `deck-root` or at `:root`):

| Token | Controls |
|-------|----------|
| `--deck-root-bg` | Deck background |
| `--deck-root-progress-color`, `--deck-root-progress-height` | Progress bar |
| `--deck-root-counter-color` | Slide counter text |
| `--deck-root-dot-bg`, `--deck-root-dot-active-bg` | Step dots (idle / active) |
| `--deck-root-kb-hint-color` | Bottom-left key-hint chips |
| `--deck-root-nav-color`, `--deck-root-nav-bg`, `--deck-root-nav-opacity` | Mouse-nav chevrons |

The theme zeroes motion durations under `prefers-reduced-motion: reduce`.

Light-DOM helper classes the theme ships (use on slotted children):
`.accent`, `.accent-danger`, `.accent-warn`, `.accent-success`, `.accent-orchid`,
`.accent-lime`, `.sub`, `.display`, `.lead`, `.caption.on-dark`, `.card-text`,
`table.dense`.

---

## 12 · Bundling (single-file export)

`bundle.mjs` (Vite + vite-plugin-singlefile) crawls a deck's `<link>` and
`<script type="module">` references, bundles and inlines everything (Lit
included) into one self-contained HTML file:

```bash
node bundle.mjs my-talk/index.html              # → my-talk/index.bundle.html
node bundle.mjs my-talk/index.html out.html     # explicit output
node bundle.mjs my-talk/index.html -            # to stdout
node bundle.mjs my-talk/index.html --no-fonts   # strip Google Fonts @import (system fonts, zero network)
```

The bundler resolves rikiki references written with the `rikiki/(dist|themes|tokens.css)`
path convention (see the §9 caveat about decks that use plain relative paths).

---

## 13 · Recipes / cookbook

Copy-paste patterns. Every tag/attribute used here is defined above · combine
them freely. Assume the deck head loads the theme then `dist/index.js` (§2).

### Markdown + code feature slide

```html
<deck-feature eyebrow="Module">
  <h1 slot="title">Side effects</h1>
  <p slot="lead" class="lead">A module can <span class="accent">act</span> on import.</p>
  <deck-code lang="ts" hero>
    import './polyfill';  // executed at import time
  </deck-code>
</deck-feature>
```

### Side-by-side comparison (two columns)

```html
<deck-split eyebrow="ESM">
  <h1 slot="title">Static vs dynamic</h1>
  <deck-card slot="left" color="yellow">
    <h3>Static</h3>
    <deck-md>Resolved at startup. **Tree-shakable.**</deck-md>
  </deck-card>
  <deck-card slot="right" color="green">
    <h3>Dynamic</h3>
    <deck-md>Loaded on demand. *Asynchronous.*</deck-md>
  </deck-card>
</deck-split>
```

### Three columns

```html
<deck-split eyebrow="Actions" cols="3">
  <h1 slot="title">Three levers</h1>
  <deck-card slot="a" color="yellow"><h3>① Cache</h3><deck-md>…</deck-md></deck-card>
  <deck-card slot="b" color="orange"><h3>② Batch</h3><deck-md>…</deck-md></deck-card>
  <deck-card slot="c" color="green"><h3>③ Defer</h3><deck-md>…</deck-md></deck-card>
</deck-split>
```

### Hero block + two detail cards

```html
<deck-feature-cards eyebrow="Pipeline">
  <h1 slot="title">How it flows</h1>
  <deck-mermaid>graph LR; A-->B-->C</deck-mermaid>
  <deck-card slot="left" color="yellow"><h3>Ingest</h3><deck-md>…</deck-md></deck-card>
  <deck-card slot="right" color="green"><h3>Serve</h3><deck-md>…</deck-md></deck-card>
</deck-feature-cards>
```

### Bento layout (adaptive cells + fit-to-box text)

A `deck-cell` stacks its children in a column, so its two alignment knobs run
on the axes their names do not suggest: **`align` moves content left/right**,
**`justify` moves it up/down**. To push a cell's content to the bottom, write
`justify="end"`, not `align="end"`.

Cells share a multi-row/column grid via `span`. Each `deck-cell` is a size
container, so `cqw`/`cqh` type (and `<deck-punch fit>`) adapts to the cell it
lands in, not the whole slide. Use `fit` when the text length is unknown and
must never overflow; use `size="display"` (or any `cqw`-based size) for plain
fluid scaling without the JS measure.

```html
<deck-bento eyebrow="Overview" cols="3" rows="2" gap="3">
  <h1 slot="title">Sharing the space</h1>
  <deck-cell span="2x1" align="center" justify="center">
    <deck-punch fit>Headline that shrinks to fit its cell</deck-punch>
  </deck-cell>
  <deck-cell span="1x2" tone="info"><h3>Side</h3><deck-md>Tall cell.</deck-md></deck-cell>
  <deck-cell tone="ok"><h3>A</h3></deck-cell>
  <deck-cell tone="warn"><h3>B</h3></deck-cell>
</deck-bento>
```

### Cards from markdown (`::: cards`)

Author a whole slide in markdown and let `deck-md` expand a `::: cards` fenced
block into a tinted card grid · the fast way to write a bento without HTML.
Inside the fence, `:: <tone> <span> | <title>` opens a card (both `tone` —
`info`/`warn`/`ok`/`danger` — and `span` like `2x1` are optional, any order);
the lines until the next `::` are its markdown body. The fence takes `cols=N`
and `gap=N` (default `cols` = number of cards).

```html
<deck-feature>
  <deck-md>
# You won't write it all yourself

Every dependency is a trade-off:

::: cards cols=3
:: warn | Reproducibility
same versions on every machine, every CI run
:: warn | Build cost
source you compile vs prebuilt you link
:: ok 2x1 | Control
who owns the version, the flags, the patches
:::
  </deck-md>
</deck-feature>
```

For pixel control (true cell spans, `fit` text, images, `deck-csv`), author the
grid explicitly with `deck-bento` + `deck-cell` instead.

### Big-number stat

```html
<deck-feature eyebrow="Impact">
  <h1 slot="title">The result</h1>
  <deck-stat num="92%" tone="green">
    <h3 slot="claim">faster cold start</h3>
    after the lazy-import refactor
  </deck-stat>
</deck-feature>
```

### Metric list

```html
<deck-metric-list>
  <deck-metric severity="bad" value="2.4 s">p95 latency (before)</deck-metric>
  <deck-metric severity="ok"  value="0.3 s" mono>p95 latency (after)</deck-metric>
</deck-metric-list>
```

### Callout

```html
<deck-callout type="warn">
  <deck-md>Don't ship `?live` in a presented deck.</deck-md>
</deck-callout>
```

### Tier ladder

```html
<deck-tier-list>
  <deck-tier name="LLInt" speed="×1" severity="muted">Bytecode interpreter</deck-tier>
  <deck-tier-arrow>warms up after ~6 calls</deck-tier-arrow>
  <deck-tier name="DFG" speed="×8" severity="ok">Optimizing JIT</deck-tier>
  <deck-tier name="FTL" speed="×100" severity="hot" hot>Top-tier JIT</deck-tier>
</deck-tier-list>
```

### Keyboard-shortcut grid

```html
<deck-shortcut-list cols="1" col-gap="4">
  <deck-shortcut keys="⌘ K" label="Command palette" tone="accent"></deck-shortcut>
  <deck-shortcut keys="⌘ ⇧ P" label="Run task"></deck-shortcut>
</deck-shortcut-list>
```

### Stepped code reveal (no plugin)

```html
<deck-feature eyebrow="Build-up">
  <h1 slot="title">One line at a time</h1>
  <deck-code lang="ts" hero step-groups='[[1],[2,3],[4]]'>
    const a = load();
    const b = transform(a);
    const c = render(b);
    export default c;
  </deck-code>
</deck-feature>
```

The `step-groups` array sets the slide's step count automatically (3 steps here).

### Stepped blocks (no plugin)

```html
<deck-feature steps="2" eyebrow="Reveal">
  <h1 slot="title">Two beats</h1>
  <p>Always visible.</p>
  <p data-step-block>Appears on step 1.</p>
  <p data-step-block>Appears on step 2.</p>
</deck-feature>
```

### Per-element click reveals (click-stages plugin)

```html
<!-- once, after dist/index.js -->
<script type="module">
  import { installClickStages } from './dist/click-stages.js';
  installClickStages();
</script>

<deck-feature eyebrow="Build">
  <h1 slot="title">Click through</h1>
  <p data-click data-anim="slide-up">First.</p>
  <p data-click-auto="500">Follows automatically after 500 ms.</p>
  <ul data-click-stagger="80" data-anim="slide-up">
    <li>wave 1</li><li>wave 2</li><li>wave 3</li>
  </ul>
</deck-feature>
```

### Magic Move (morph across slides)

```html
<deck-feature><h1 slot="title">Before</h1>
  <deck-code lang="ts" data-morph="snippet">const x = 1;</deck-code>
</deck-feature>
<deck-feature><h1 slot="title">After</h1>
  <deck-code lang="ts" data-morph="snippet">const x = compute();</deck-code>
</deck-feature>
```

The matching `data-morph="snippet"` glides/resizes the element from the first
slide to the second.

### Speaker notes

```html
<deck-feature>
  <h1 slot="title">My slide</h1>
  <deck-notes>
    - Mention the migration story
    - Pause on the Java joke
  </deck-notes>
</deck-feature>
```

### Full-bleed photo with caption

```html
<deck-photo src="./hero.jpg" position="center" darken="0.5" align="bottom">
  <h1>Scale</h1>
  <p class="sub">3 M req/s at peak</p>
</deck-photo>
```

### Retheme one slide locally

```html
<deck-stat num="∞" style="--rik-accent: #ff0066;">
  <h3 slot="claim">possibilities</h3>
</deck-stat>
```

---

## 14 · Authoring rules for LLMs

- **Never nest `<deck-root>`.** One per document.
- **Load theme CSS before `dist/index.js`.**
- Every direct child of `<deck-root>` is one slide; keep **one focal idea per
  slide**.
- **Set `slot=` wherever a layout defines named slots** (e.g. `slot="title"`,
  `slot="lead"`, `slot="left"`/`slot="right"`, `slot="a"`/`b`/`c`). Content with
  no matching slot lands in the default slot.
- Prefer **`deck-md`** for prose; use **`deck-code`** for code.
- Use **semantic `--rik-*` tokens** for any color/spacing override, at `:root`
  (or component `--deck-*-…` tokens on one host). Do not hardcode colors.
- Move detail into **`<deck-notes>`** rather than crowding the slide.
- Only use tags, attributes, and tokens listed in this document.

---

## 15 · Trust model

- **Deck content is trusted.** `deck-md` renders raw HTML from the markdown you
  write, on purpose. That is the contract: a deck is a page its author
  publishes. There is no `sanitize` attribute and none is planned.
- **Derived text is not.** A renderer error message quotes the source that broke
  it, so it is escaped before display. Never assume an error string is inert.
- **mermaid runs at `strict`.** HTML in diagram labels is encoded and
  click-bound scripts are refused. There is no permissive opt-in.
- **Never render untrusted markdown or diagram source.** If the content comes
  from a form, an API or a CMS field a stranger can edit, sanitise it before it
  reaches `<deck-md>`. rikiki is a presentation engine, not a sandbox.

---

## 16 · The three ways a deck runs

Pick one deliberately · they make different promises.

**Served** · the folder as you wrote it. HTML, CSS and JS stay separate files,
so editing a slide needs no build. ES modules mean it needs a **static HTTP
server**, not a double-click: `python3 -m http.server`, `npx serve`, anything.
Offline once every asset is local.

**Standalone** · one HTML file, produced by `rikiki bundle deck.html out.html`.
Opens straight from `file://`, so it survives a USB stick, an email attachment
and an archive. Nothing is fetched at runtime: scripts, styles, fonts and images
are all inside. The presenter works from it too.

- A deck using `<deck-mermaid>` needs `--with-mermaid` (+~3 MB).
- A deck using Shiki needs `--with-shiki` (+~9 MB).
- Without the flag the command **fails** and names the missing runtime · it will
  not hand you a file that renders an empty diagram offline.
- `rikiki init --standalone` produces a starter with the same guarantees.

**CDN** · two `<script>`/`<link>` tags from jsdelivr. Zero install, but the deck
fetches the framework every time it runs, so it needs the network and is **not**
an archival format. Always pin a version.

The self-containment of a standalone file is enforced, not assumed:
`e2e/bundle.spec.ts` writes each bundle outside the repository, opens it over
`file://`, and fails if the page issues a single request beyond itself.

---

## 17 · Printing and PDF export

A deck carries its own print stylesheet · no mode to switch on, no separate
build.

- **One slide, one page.** Every slide prints, in order, at the deck's canvas
  size. The `@page` box is written from `--deck-canvas-w/h`, so a 16:9 deck
  prints 16:9 · forcing A4 crops it.
- **Backgrounds are kept** (`print-color-adjust: exact`) · a tinted layout means
  nothing in black and white.
- **Chrome is dropped** · counter, progress bar, nav arrows, key hints, step dots.
- **Steps do not multiply pages.** A slide with click-stages prints once, fully
  revealed. Speaker notes stay out.

From the browser: print, backgrounds on. From the command line:

```sh
rikiki export deck.html --output deck.pdf
```

The command serves the deck over HTTP (ES modules need it), waits for
`document.fonts.ready` and for every `<deck-mermaid>` to settle, then prints. It
reports any asset it could not load rather than handing back a silently
incomplete PDF. It needs **Playwright**, an optional peer dependency:
`npm i -D playwright && npx playwright install chromium`.

The whole contract is verified in `e2e/print.spec.ts` by reading the produced
PDF back with poppler.

---

## 18 · Embedding a deck in a page

A `<deck-root>` that is a direct child of `<body>` **is** the page: it owns the
scroll, the rem baseline, the URL hash, the keyboard and the wheel. Anywhere
else it is a widget, and owns none of that.

An embedded deck:

- **leaves the host's styling alone.** The theme's reset, page background and
  helper classes (`.accent`, `.lead`, `.display`, `table.dense` …) are scoped to
  the deck subtree. Importing a theme does not restyle the page around it.
- **does not touch the URL.** `#section-3` stays the host's anchor. Deep links
  work on a full-page deck only.
- **takes the keyboard only while focused.** It gets `tabindex="0"`, so a reader
  tabs to it and then navigates with the arrow keys. Until then the arrows
  belong to the host page.
- **lets the wheel scroll the host.** Ctrl/⌘ + wheel still zooms, and panning
  still works once a slide is magnified.

**Several decks per document are supported.** Each keeps its own canvas, its own
slide index and its own navigation; focus decides which one the keyboard drives.
Only one of them can be the page. Pinned by `e2e/multi-deck.spec.ts`.

Recommended for a thumbnail or an inline demo:

```html
<div style="width: 640px; height: 360px">
  <deck-root no-hint no-arrows>…</deck-root>
</div>
```

---

## 19 · Filling the slide vertically

A slide body takes the height left under the title, but its blocks stack at the
top. A short slide therefore leaves most of the canvas empty · measured at 62%
on a three-line `deck-feature`. Two opt-in attributes on `deck-feature`,
`deck-split` and `deck-takeaway` share that space. Both are no-ops when absent,
so existing decks are untouched.

| Attribute | Effect |
|---|---|
| `spread="between"` | push the blocks apart over the full height |
| `spread="around"` / `"evenly"` | distribute the space around / between evenly |
| `spread="center"` / `"end"` / `"start"` | group the blocks, centred / bottom / top (default) |
| `fill` | give the height to the blocks themselves rather than to the gaps |

An unknown `spread` value falls back to `start` rather than dropping the
layout.

`fill` on its own makes the blocks taller, not the text. Pair it with
`<deck-fit>` to grow the text into the box it now has:

```html
<deck-feature fill>
  <h1 slot="title">Filled</h1>
  <deck-fit max="5">One line that grows to fill its share of the slide.</deck-fit>
  <deck-fit max="5">And a second one.</deck-fit>
</deck-feature>
```

Which to reach for: `spread` when the type size is right and only the rhythm is
wrong; `fill` when the slide is genuinely under-filled and the text should be
bigger. `deck-bento` remains the answer when the content wants a grid rather
than a stack.
