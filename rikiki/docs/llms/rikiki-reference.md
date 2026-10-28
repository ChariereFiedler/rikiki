# Rikiki · LLM reference

This reference documents rikiki v0.8.0.

Exhaustive, self-consistent reference for authoring valid **rikiki** decks. Every
tag, attribute, slot, and token below was derived from the source in this repo
(`dist/index.js` registers every component; `themes/rikiki.css` is the
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

The canonical skeleton · `rikiki init <name>.html` writes exactly this, with the
runtime copied into `./rikiki/` beside it:

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
| `deck-cover` | Opening slide, dark, with brand + meta | `brand` (split on " · "), `brand-src` (logo URL), `speaker`, `company`, `company-src` (client logo URL, shown before the company name), `duration`, `audience`, `runtime`; per-row label overrides `speaker-label`, `company-label`, `duration-label`, `audience-label`, `runtime-label` | default `<h1>`, `.sub`/`p[slot=sub]` |
| `deck-section` | Chapter divider (also a chapter boundary for 2D nav) | `num` | default `<h1>` (may use `<em>`) |
| `deck-feature` | Headline + lead + one focal block | `eyebrow` | `title` (`<h1>`), `lead`, default (focal block, e.g. `deck-code`) |
| `deck-split` | Two or three columns side by side | `eyebrow`, `cols` (`1-1`/`1-2`/`2-1`/`3`), `gap` (1..6 or raw CSS length), `col-gap` (1..6 or raw CSS length) | `title`, `lead`; `left`/`right` (2-col) or `a`/`b`/`c` (3-col) |
| `deck-feature-cards` | Hero focal block + two detail cards under it | `eyebrow` | `title`, `lead`, default (hero block), `left`, `right` |
| `deck-photo` | Full-bleed image slide, content on overlay | `src` (required), `position` (CSS `object-position`, default `center`), `darken` (0..1 overlay alpha, default `0.35`), `align` (top/center/bottom, default center), `text-align` (left/center/right, default left) | default slot: any content; style slotted children with `.sub`/`.kicker` classes (these are **CSS classes**, not named slots) |
| `deck-takeaway` | Centered punchline, dark | `kicker` | default (e.g. `p.display`, `p.caption`, a `deck-callout`) |
| `deck-bento` | Bento grid slide · multi-row/column cells share the space | `eyebrow`, `cols` (1..12 or template, default 2), `rows` (1..12 or template, default 1 full-height row), `gap` (1..6 or CSS, default 3), `align`, `justify` | `title` (`<h1>`), default (`deck-point` / `deck-cell` children) |

`eyebrow` renders as a short accent-coloured line above the title, in sentence
case. Write it as a word or two, the way you would say it · "numbers", not
"NUMBERS". It used to render as a filled pill holding tracked-out small caps,
which is unreadable at projection distance and is one of the plainest marks of a
generated page (ADR-002). The tokens are unchanged, so a deck that wants the
badge back sets `--deck-eyebrow-bg`, `--deck-eyebrow-color`,
`--deck-eyebrow-radius` and `--deck-eyebrow-padding-x` / `-y`.

---

## 5 · Molecules (composed containers)

| Tag | Purpose | Key attributes | Slots / children |
|-----|---------|----------------|------------------|
| `deck-callout` | Highlighted note box | `type` (`info`/`warn`/`danger`/`ok`), `on-dark` (inverse text on a dark raised surface, for a dark slide) | default (text / `deck-md`) |
| `deck-card` | Tinted card | `color` (`yellow`/`orange`/`green`/`red`), `center`, `compact` | default (`<h3>` + body) |
| `deck-md` | Render Markdown (GFM) · also expands `::: cards` blocks into a tinted card grid | · | default = raw Markdown text |
| `deck-mermaid` | Render a Mermaid diagram (uses the optional vendored Mermaid runtime) | `compact` | default = Mermaid source |
| `deck-stat` | Big-number visual | `num`, `tone` (`yellow`/`orange`/`green`/`red`/`purple`/`lime`/`cyan`) | `claim` (`<h3>`), default = body line |
| `deck-metric-list` | Wraps `deck-metric` rows | · | `deck-metric` children |
| `deck-metric` | One metric row | `severity` (`bad`/`warn`/`ok`/`info`), `value`, `mono` (render the value in the mono font) | default = label |
| `deck-tier-list` | Tier ladder | · | `deck-tier`, `deck-tier-arrow` children |
| `deck-tier` | One tier row | `name`, `speed`, `severity` (`muted`/`warn`/`ok`/`hot`), `hot` | default = description text |
| `deck-tier-arrow` | Separator note between tiers | · | default = text |
| `deck-step-list` | Numbered step ladder | `direction` (`column` default, `row` for a chain across the width), `no-connectors` | `deck-step` children (each one carries its own `note-position`) |
| `deck-step` | One step row | `n`, `note`, `note-position` (`inline` default / `below`, the note under the label rather than beside it) | default = label |
| `deck-shortcut-list` | Shortcut grid | `cols` (column count, e.g. `1`), `col-gap` (1..6) | `deck-shortcut` children |
| `deck-shortcut` | One keyboard-shortcut row | `keys` (space-separated), `label`, `note`, `tone` (`accent`/`ok`) | default = note |
| `deck-kbd` | Inline key chip | `tone` (`accent`/`ok`) | default = key text |
| `deck-stack` | Flex stack helper | `gap` (1..6), `direction` (`row`/`column`), `align` (`start`/`center`/`end`/`stretch`), `justify` (`start`/`center`/`end`/`between`/`around`), `fill` (grow to fill the cross axis) | children |
| `deck-grid` | CSS grid helper | `cols` (1..12 or template), `rows`, `gap` (1..6 or CSS), `align`, `justify`, `fill` | children |
| `deck-cell` | Bento grid item, sized BY THE GRID · a `container-type: size` box so child `cqw`/`cqh` type scales against the cell, not the slide. A slotted `img`/`svg`/`video` auto-fits the cell (object-fit contain); a slotted `table` fills the width | `span` (`"CxR"`, e.g. `2x1`, or a bare column count), `col`/`row` (per-axis override · integer → `span N`, else raw line syntax), `tone` (`info`/`warn`/`ok`/`danger`), `plain` (drop the card chrome), `flat` (keep the surface but drop the border), `align` (**horizontal**: `start`/`center`/`end`/`stretch`), `justify` (**vertical**: `start`/`center`/`end`/`between`) | default (`<h3>` + body, or any block) |
| `deck-point` | Bento grid item, sized BY ITS CONTENT · one point of a bento, for words. Not a size container, so a row of points is as tall as the tallest one and a painted point shows no hole under its text; a row made only of points, all with the same number of children and none claiming a span, shares the grid's rows, so a title that wraps to a second line no longer drags its own body text below its neighbours'. Reach for `deck-point` for words and `deck-cell` for anything measured (fit-to-cell text, a diagram, an image) | `span`, `col`/`row`, `tone` (`info`/`warn`/`ok`/`danger`), `plain` (stop painting the chrome · the gutter stays, so the reading edge survives), `flat`, `align` (**horizontal**) · no `justify`, a point has no leftover height to distribute | default (`<h3>` + body) |
| `deck-fit` | Shrink slotted content to fit its box by font-size (for non-`deck-punch` text content · not for images, which scale geometrically) | `min` (rem, default 1), `max` (rem, default 12) | default = any content |
| `deck-csv` | Render inline CSV as a styled table (cells are trimmed) | `delimiter` (default `,`), `no-header` (first row is data), `fit` (shrink the table to fit the cell), `fit-min`/`fit-max` (rem bounds, default 0.6/2), `highlight-rows` / `highlight-cols` (1-based, space-separated), `reveal` (one body row per step) | default = raw CSV text |

---

## 6 · Atoms (primitives)

| Tag | Purpose | Key attributes | Slots |
|-----|---------|----------------|-------|
| `deck-badge` | Small status badge | `type` (`bad`/`ok`/`info`/`warn`/`neutral`) | default = text |
| `deck-kicker` | Uppercase eyebrow label | `on-dark` | default = text |
| `deck-punch` | Short punchy line | `tone` (`warn`/`danger`/`ok`/`info`/`muted`/`accent`; inherits text color if absent), `size` (`lead`/`big`/`mega`/`stat`/`display`), `weight` (`700`/`800`/`900`), `align` (`left`/`center`/`right`), `fit` (shrink to fit the box · overrides `size`/cqw fluid scaling), `fit-min`/`fit-max` (rem bounds, default 1/12) | default = text |
| `deck-code` | Syntax-highlighted code | `lang`, `hero`, `nested`, `step-groups` | default = code text |
| `deck-source` | A source or credit line, placed under any evidence block (`deck-csv`, `deck-table`, `deck-bar`, `deck-kpi-grid`, `deck-annotate`, or plain prose) | `href` (turns the credit into a link) | default = the credit text |

### deck-code details

- `lang` · drives highlighting. The **built-in highlighter understands only**
  `js` / `ts` / `json` (default), `html` / `xml` / `svg`, and `css` / `scss` /
  `less`. **Any other value** (`python`, `rust`, `bash`, `go`, `sql`, …) is **not
  an error and produces no warning** — the block is silently colored with the JS
  rules, so the result looks plausible but is wrong. For any language outside the
  list above, add or rebuild a compatible highlighter. Rikiki's optional Shiki
  plugin covers a curated subset described below.
- `hero` · centers the block vertically as the slide's focal element.
- `nested` · lighter border, no shadow (for use inside a `deck-card`).
- `step-groups` · a JSON array attribute that turns the snippet into a stepped
  reveal; the number of groups becomes the slide's step count (see §7).

Highlighting is done client-side with a built-in regex highlighter (no build
step), limited to the languages listed under `lang` above. An opt-in **Shiki
plugin upgrades every `deck-code` block to TextMate highlighting for a curated
set of common web languages.

### Shiki plugin (optional, opt-in)

The Shiki plugin (`dist/shiki.js`) re-renders all `<deck-code>` blocks
through [Shiki](https://shiki.style), loaded from the vendored
`dist/vendor/shiki.js` bundle on first use (offline · no CDN). Install it after
the rikiki bundle:

```html
<script type="module" src="./dist/index.js"></script>
<script type="module">
  import { installShiki } from './dist/shiki.js';
  await installShiki({ theme: 'one-dark-pro', langs: ['ts', 'js', 'html', 'css'] });
</script>
```

API:

```ts
async function installShiki(opts?: {
  theme?: 'one-dark-pro';
  langs?: Array<'ts' | 'typescript' | 'js' | 'javascript' | 'html' | 'css' | 'json'>;
}): Promise<void>
```

- The offline artifact contains only `one-dark-pro` and the TypeScript,
  JavaScript, HTML, CSS and JSON grammars. Set `langs` to the subset your deck
  uses. Supporting another grammar or theme requires rebuilding the vendor
  entry with an explicit import.
- Shiki owns the palette under this plugin: it colors each token with an inline
  style from the chosen `theme`, so pick a `theme` that suits your code
  background (e.g. `one-dark-pro` on a dark deck). The `--deck-code-syntax-*`
  tokens only affect the built-in highlighter, not Shiki output.
- A language not loaded falls back silently to the built-in regex highlighter
  (no error).
- **How it hooks in:** it registers a highlighter on the shared `<deck-code>`
  class via `setDeckCodeHighlighter` (resolved through `customElements.get`), so
  it never patches the component's internals · see *Writing a plugin* below.
- **Trade-off:** the curated runtime is about 113 KB when gzip-compressed. It remains opt-in and
  lazy, so the core bundle stays ~43 KB gzip.

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

The click-stages plugin (`dist/click-stages.js`) adds Slidev-style `v-click` reveals. rikiki drives
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
displays the speaker notes, slide counter and current reveal step. The current
preview follows forward and backward reveal changes without reloading its frame.

Listen on `deck-root` for `slide-change` (`detail.current`, `detail.previous`)
or `step-change` (`detail.step`, `detail.steps`). The latter reports the current
zero-based reveal state and the number of reveal steps. `slide-leave` (same
`detail`) comes just before, while the slide left is still on screen: what it
shows at that instant can still be measured.

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

## 9 · Multi-file decks

A long talk is easier to write, review and diff in pieces. `rikiki assemble`
joins ordered partials into the single HTML file everything else expects.

A `deck.config.js` (or `.json`) describes the deck:

```js
export default {
  title: 'My talk',
  theme: 'rikiki/tokens.css',      // href, relative to the OUTPUT file
  bundle: 'rikiki/dist/index.js',  // runtime href, relative to OUTPUT
  transition: 'slide',             // optional <deck-root transition="…">
  lang: 'fr',                      // optional <html lang="…">
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
  `***` for a horizontal rule inside a slide, since `---` is the slide break.

Run it:

```bash
npx rikiki assemble deck.config.js                 # → <title>.html next to the config
npx rikiki assemble deck.config.js out/talk.html   # explicit output
npx rikiki assemble deck.config.js -               # to stdout
```

`theme` and `bundle` default to the `rikiki/…` paths `rikiki init` writes, which
are the ones `rikiki bundle` inlines. Point them elsewhere and the deck still
serves, but the command says on stderr that the single-file export will leave
those references external.

Assembly is a one-way step: edit the partials, re-run, and keep the assembled
file as an artefact rather than a source.

## 10 · Livereload (authoring only)

The livereload module (`dist/livereload.js`) polls the `Last-Modified`/etag of the deck's files and
auto-reloads the page when any change (showing a brief toast and keeping the
current slide via the hash). It watches: the deck's `<link rel="stylesheet">`
hrefs, the rikiki component files in `dist/`, and the deck HTML itself.

Enable it two ways:

- **`?live`** on the deck URL · `dist/index.js` lazy-imports the poller only when
  this query param is present, e.g. `…/my-deck.html?live`.
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

`rikiki bundle` crawls a deck's `<link>` and `<script type="module">`
references and inlines everything, lit included, into one self-contained HTML
file. It curates the runtime down to the components the deck actually uses.

```bash
npx rikiki bundle my-talk/index.html            # → my-talk/index.bundle.html
npx rikiki bundle my-talk/index.html out.html   # explicit output
npx rikiki bundle my-talk/index.html -          # to stdout
npx rikiki bundle my-talk/index.html --no-fonts # drop the web fonts, use system ones
npx rikiki bundle my-talk/index.html --with-mermaid   # inline the mermaid runtime
npx rikiki bundle my-talk/index.html --with-shiki     # inline the Shiki highlighter
```

The command needs the optional peer `rolldown` (`npm i -D rolldown`); without
it, it says so and does nothing. It exits non-zero if the result would still
fetch something at runtime, so a file it accepts really opens offline.

It resolves rikiki references written in the `rikiki/(dist|themes|tokens.css)`
spelling · the one `rikiki init` writes.

---

## 12b · Looking at a deck, and measuring it

You cannot see a deck you wrote. These two commands are the eyes and the ruler.
Both need the optional peer `playwright`.

### `rikiki render` · pictures

```bash
npx rikiki render talk.html                       # → talk.shots/, one PNG per slide
npx rikiki render talk.html --out previews/       # somewhere else
npx rikiki render talk.html --slides intro,4      # by id or by 1-based number
npx rikiki render talk.html --slides 4-9,12       # an interval, or several (-3 · 8- · intro..outro)
npx rikiki render talk.html --steps               # every revealed state, not just the first
npx rikiki render talk.html --width 1280 --height 720
```

It writes, beside the pictures:

- `index.html` · a plain gallery, no runtime, opens offline;
- `manifest.json` · the contract between a picture and the slide it came from.

```json
{
  "schema": 1,
  "deck": "talk.html",
  "canvas": { "width": 1920, "height": 1080 },
  "slideCount": 12,
  "captured": 12,
  "stepsCaptured": false,
  "shots": [
    { "index": 1, "id": "intro", "tag": "deck-cover", "title": "…", "step": 0, "file": "01-intro.png" }
  ]
}
```

Read `stepsCaptured`. Without `--steps`, a stepped slide is photographed in its
opening state, which is usually the emptiest one it has: judging it then is
judging a slide nobody will see. File names are derived from the slide id and
are always safe, whatever the id contains; the manifest keeps the id verbatim,
which is what you edit against.

The command waits for the elements to upgrade, the fonts to load, the diagrams
to draw and every animation to finish before each shot. It does not sleep.

#### `--baseline <dir>` · what moved since last time

```bash
npx rikiki render talk.html --out after/ --baseline before/
npx rikiki render talk.html --out after/ --baseline before/ --json > diff.json
npx rikiki render talk.html --out after/ --baseline before/ --threshold 0
```

The deck is rendered as usual, then every PNG that has a same-named file in
`<dir>` is compared to it, in the browser that just took the pictures: both
images go on a canvas and `getImageData` counts the pixels whose worst channel
moved by more than 32 of 255. A file only one side has is reported as `added`
or `missing`, never as a diff; two captures of different sizes are `resized`,
with both sizes and no pixel count, because a ratio across a resize means
nothing.

Human output goes to stderr, one line per changed slide, most changed first:

```
rikiki · diff · 1 slide(s) changed · most changed first
    ·   9.21% 01-intro.png · Le titre de la slide · box 101,383 1204×323
rikiki · diff · 1 changed · 11 stable · 0 added · 0 missing · 0 resized · baseline before/
```

`--json` writes the whole report to stdout and nothing else; the same report is
always written to `diff.json`, beside `manifest.json`:

```json
{
  "schema": "rikiki.render-diff/1",
  "baseline": "/abs/path/to/before",
  "threshold": 0.5,
  "slides": [
    {
      "file": "01-intro.png",
      "slide": 1, "id": "intro", "title": "…", "step": 0,
      "status": "changed",
      "changedRatio": 0.0921, "changedPixels": 190941, "totalPixels": 2073600,
      "box": { "left": 101, "top": 383, "width": 1204, "height": 323 }
    },
    { "file": "04-wide.png", "status": "resized",
      "baselineSize": { "width": 1920, "height": 1080 }, "size": { "width": 1280, "height": 720 } },
    { "file": "09-gone.png", "status": "missing" }
  ],
  "summary": { "changed": 1, "stable": 11, "added": 0, "missing": 1, "resized": 1 }
}
```

`slides` is ranked by `changedRatio` descending, so the loudest slide is the
first thing read; the entries nobody could measure (`added`, `missing`,
`resized`) keep to the end, where the report names them one by one. `box` is
the smallest rect containing every changed pixel · it is where to look.

`--threshold` is a percentage of a slide's pixels: at or above it a slide is
`changed`, below it `stable`. The default `0.5` is there because re-rendering
an unchanged deck still repaints its anti-aliasing, and a report where 57 of 64
slides are "changed" hides the seven that really moved. `--threshold 0` lists
every slide where a single pixel moved; a slide where nothing moved stays
`stable` even then.

Exit code is 1 when at least one slide is `changed`, `missing` or `resized`, 0
otherwise · a slide the baseline never had is news, not a regression. A
`--baseline` pointing at a directory that is not there stops before the render,
with exit 2.

### `rikiki check` · measurements

```bash
npx rikiki check talk.html              # a readable report on stderr
npx rikiki check talk.html --json       # the report on stdout, nothing else
npx rikiki check talk.html --no-visual  # skip the pixel pass (one shot per slide)
npx rikiki check talk.html --steps      # measure every revealed state, not just the first
npx rikiki check talk.html --slides 4   # only slide 4 · a few seconds on a long deck
npx rikiki check talk.html --slides 2,pricing,6-9   # a set: numbers, ids, intervals
npx rikiki check talk.html --diversity  # how alike the illustrations are, every distance
npx rikiki check talk.html --richness   # what each illustration holds to see, criterion by criterion
npx rikiki check talk.html --list-checks          # every rule, and whether the deck's policy keeps it
npx rikiki check talk.html --checks -slide-dense --severity ill-wordy=error   # the policy, on the command line
```

**Diversity.** A deck can pass every rule slide by slide and still show one
picture thirty times with other words. `check` compares the illustrations of
the deck with each other and writes `diversity` in the report (null under two
drawings): each drawing's signature · its STRUCTURE (the intent, the layouts,
the kinds of marks, how many arrows and how they connect, tokens, gates, a
picture that reorganises), its VISUAL side (surfaces, tones, how many marks, a
coarse 8×4 thumbnail of where its ink sits) and its TIME (clicks, what moves) ·
and the distance between two, `D = 0.5 structure + 0.3 visual + 0.2 time`, from
0 (the same look) to 1. The report gives `structures` (distinct structural
signatures) and `structuresPer100`, the `intents` covered, the `families` (an
intent, else the layouts) and the `largestFamily`, `meanNearest` and `targets`
(a gallery aims at 40 structures per 100 illustrations, 12 intents, no family
over 10 %). Two drawings closer than 0.15 are `ILL_REPEATED_LOOK`, a warning
about the deck, never an error of a slide · unless the later one MOVES ON: it
keeps at least half of the earlier one's named marks and stands at a later step of
the same act (`step`), adds marks around them (`scope`), changes their figures
(`data`) or their words (`state`) while keeping some as they were (a clone with
every word changed stays a repeat). Such pairs are listed apart in `progressing`
(with their `progress`) and warned about by nobody. A diagram writes its signature on its
svg (`data-signature`); a scene or a hand-drawn svg is known by its tag and its
thumbnail. `--diversity` adds the `matrix` of every distance to the JSON, and
each drawing's nearest neighbour to the human report, whose line reads
`Diversity · 30 illustrations · 30 structures (100/100) · 16 intents · largest
family barrier 7 % · 0 pair(s) alike · 0 motif(s) that progress · mean nearest 0.32`.

**Richness.** A clean, varied drawing can still say nothing: three pale boxes
named "Service A", "Service B", "Service C". Every illustration row carries a
`richness` out of 100 on five criteria of equal weight, each 0, 10 or 20 with
its `measurement` and, when it is not met, its `fix`:

| criterion | 20 when | 10 when |
| --- | --- | --- |
| `content` | two precise facts or more, of two kinds (WHEN an hour, a date · WHICH an identifier, a version · HOW MUCH a figure), and a `deck-source` on the slide | one fact, facts of one kind, or no source |
| `demonstration` | two devices of relation or more (a link, a flow, a gate, a scale, a marker, a callout, a state that turns, panels) | one |
| `story` | a story (`play="enter"`) runs steady, breaks (event), proves after · a story with no break (a camera pulling back) ends on something that lasts | two of the three · an event told click by click |
| `paint` | as many flat fills (tints included) as it holds roles, up to three: context, focal, state, control, result | two |
| `result` | a lasting proof in the target · in a still, the thing put forward carries its figure | a lasting break · a thing put forward, no figure |

A criterion that does not apply is left out and the total renormalised: a
still of a share, a comparison or a structure is not judged as a story
(an intent that says an event · cause, barrier, propagate, threshold,
accumulate, drift, transform · a gate or a state that turns is); one role needs
one paint; a drawing that says nothing of its structure (a scene, a hand-drawn
svg) has no `demonstration`. Nothing is counted for its own sake: ten colours earn
what three do, and more marks, panels or seconds earn nothing. A word and one
figure (`appli 1`, `T4`) is an enumeration, not a fact. The richness is read on
the last state walked (`--steps` for the end of a stepped drawing). The report
gains `richness` (mean, poorest, each criterion's mean where it applies) and a
line `Richness · 4 illustrations · mean 35/100 · poorest 13 (slide 1) · content
5/20 · …`. It is a MEASURE: it never changes a score or a verdict, and its
findings are said only with `--richness`, which also prints the table of each
drawing's points: `ILL_GENERIC` (no precise fact), `ILL_FLAT_PAINT` (roles
painted alike) and `ILL_MODEL_REPEAT` (the same graphic model a third time in
five illustrated slides · its distinctive layouts and marks, every picture of
boxes and arrows being one; a motif that moves on, as above, is left alone), all warnings, selectable by the deck's
policy like any rule. Calibrated on the story decks (37 drawings, mean 95, 70 to
100) against the galleries written before them (47 drawings, mean 61, 38 to 88)
and pictures poor on purpose (6, mean 20, 0 to 40). Whether a fact is true is
for a reviewer: the check only sees that a source is named.

`--slides` takes the list `render --slides` takes: a 1-based number, a slide id,
an interval (`4-9`, `-3` from the start, `8-` to the end) or two ends joined by
`..` (`intro..pricing`, each a number or an id), comma-separated. Only those
slides are walked and photographed; `slideCount` stays the deck's, `slidesChecked`
lists the positions measured, and `notChecked` says the others were not looked
at · a clean report on three slides is not a clean deck, so run the whole deck
before shipping. Whatever belongs to the document rather than to a slide is read
once, on the first slide walked. A name that matches no slide stops before any
measure, names what the deck holds, prints no report and exits 2.

Every slide is measured, in its opening state, whatever the mode: `check`
walks the deck one slide at a time, because `deck-root` lays out the slide on
screen and hides the rest · measuring the document in one shot would read empty
boxes for every slide but the first, and report a clean deck. The walk drives
the deck by its location hash; a deck it cannot navigate stops the walk at that
slide with `NAVIGATION_STALLED`, and the report still carries every slide
measured before it.

Without `--steps`, a stepped slide is only ever measured in its opening state
· `advanceStep`'s own geometry rarely changes with it (rikiki reveals dim and
highlight, it does not hide), but content wired to a step through other means
can still defect only once revealed. With `--steps`, each slide is walked from
its opening state through every state `advanceStep` reaches (`ArrowRight`),
running the same diagnostics on each. Every diagnostic then carries a `state`
(`0` for the opening state) both in the JSON and appended to the human line
(`· state 2`). A diagnostic identical on code, slide and path/message across
several states of one slide is reported once, at the lowest state it held.
`statesInspected` counts every state actually measured · without `--steps`
that is one per slide, so it reads the slide count.
The pixel pass still measures only the opening state of each slide either way
· `notChecked` says so.

The pixel pass photographs each slide with the engine's own chrome hidden, and
measures where the ink sits. It reports imbalance only · a slide whose content
fills the canvas is left alone whatever empty space remains. `visualMeasured`
in the report says whether it ran.

Exit codes: `0` nothing blocking, `1` defects found, `2` the deck could not be
looked at (bad invocation, unreadable file). An agent branches on those: `1`
means fix the deck, `2` means fix the call.

Each diagnostic carries a stable `code`, a `severity`, the slide it belongs to,
an `element` path that reaches into the Shadow DOM (`deck-feature#detail
::shadow div`), the `measurement` that justifies it, and a `suggestion`.

| Code | Severity | What it means |
|---|---|---|
| `RUNTIME_NOT_LOADED` | error | the elements never registered · every slide is raw HTML |
| `NO_DECK_ROOT` / `NO_SLIDES` | error | nothing to show |
| `RESOURCE_MISSING` | error | a file the deck asked for did not arrive |
| `PAGE_ERROR` | error | the page threw during setup |
| `NAVIGATION_STALLED` | error | the deck never arrived at that slide · the walk stopped there and the report holds only what came before |
| `UNKNOWN_ELEMENT` | error | a misspelled `deck-*` tag · it renders as nothing at all |
| `STRAY_MARKUP` | warning | prose about markup that the parser turned into an element · escape the angle brackets |
| `CONTENT_CLIPPED` | error | the slide clips rather than scrolls · that content is lost |
| `CONTENT_ESCAPES_BOX` | error | a painted box runs past its nearest painted ancestor by more than 4px, and nothing clips · the box is too small for what is inside it |
| `CONTENT_OVERLAPS_SIBLING` | error | two unrelated painted boxes intersect by more than 8px on both axes · one paints over the other |
| `SVG_TEXT_ESCAPES` | error | a `<text>` of a drawing (any `<svg>` on the slide, shadow roots included) runs more than 2px past the smallest `<rect>` or `<circle>` holding its anchor, or past the viewBox · drawn text never wraps, shorten it or widen the shape · up to five per slide |
| `SVG_TEXT_OVERLAP` | error | two `<text>` of one drawing intersect by more than 2px on both axes · one label paints over the other · up to five per slide |
| `SVG_TEXT_TOO_SMALL` | warning | a `<text>` of a drawing is set under the readable floor (18px) **on screen** · its font-size in the drawing's units times what the drawing is scaled by (viewBox against its box, deck against the screen), so 14 units in a drawing scaled by 0.8 is 11px · one finding per drawing, the smallest label and the count · set it at 18px or more, or draw it as a scene |
| `SVG_TEXT_CONTRAST_LOW` | error / warning | a `<text>` of a drawing has a WCAG contrast under 4.5:1 (3:1 for large text, 24px or 18.7px bold) against what it is drawn on · the shape painted over its point (the last `<rect>` or `<circle>` in the document that holds it, opaque enough), else the slide · error under 3:1, warning between · a label that is not painted (opacity 0, on it or on a group above) is not measured, nor a fill that is a gradient or a pattern · up to five per slide |
| `ILL_ESCAPE` | error | a shape of a drawing (stroke included) runs past the drawing's frame by more than 2px · the slide crops what leaves it · `fix.action: move-inside` with the pixels |
| `ILL_SHAPE_OVERLAP` | error | two shapes overlap by more than 2px on both axes without one holding the other · a shape inside a card is fine, so is one marked `data-role="overlay"` or `"barrier"` |
| `ILL_TEXT_OVER_SHAPE` | error | a link's label (`data-role="link-label"`, a diagram's) overlaps by more than 2px a shape of another mark that is not a surface holding it (`data-role="frame"`) · it reads as that mark's words · `measurement.on` names the marks, `fix.link` the link |
| `ILL_MOTION_ENDLESS` | error | an animation of the drawing never ends · a slide rests at its final state, and print, PDF and reduced motion have no frame to stop on · a story (`data-story`) may loop for ambience once it has played: an endless animation that starts at its end or later is allowed |
| `ILL_MOTION_LONG` | warning / error | the last animation ends after 3s (warning) or 5s (error), delay included · a story is judged against its own budget (10 s unless it says otherwise, a warning past it) and 12 s (an error past it) |
| `ILL_NO_STEADY_STATE` | warning | a story breaks (its first `event`) with under 1.5 s of established flow before it · the room never saw the system run · `fix.use`: `steady="3s"` on a lane or a link, or `beat="steady"` on what it does normally |
| `ILL_STORY_NO_PROOF` | warning | a story breaks and no lasting `proof` comes after its last event · `measurement` counts the events, effects, proofs and the proofs that came before the break |
| `ILL_FINAL_INCOMPLETE` | error | the picture at rest of a story lost a beat: no mark of its event, effect or proof is left in it (a beat told by tokens alone is gone once they arrive) · print, PDF and the overview show that end · `measurement.phases` and `.marks` say which |
| `ILL_BEAT_OVERLAP` | warning | two beats a story's author declared start under 500 ms apart once played, and are not meant together (`with`) · `measurement.marks` names the closest pair, `fix.use` the `after` or `with` to write |
| `ILL_OFF_CENTRE` | warning | the visual weight of the drawing (area, accent counted 1.5×, an outline by its edge, a line or a path nothing) sits more than 8% of the width or 15% of the height from the centre of the room it was given · the height a lean is a share of is never less than 0.375 of the width, so a flat strip is not said to lean for a few pixels · `balance="free"` on the scene, or on anything around the drawing, says it is meant · a drawing whose structure sets its labels in a column at the left (`data-lean="x"`: lanes, an axis across, a column of bars) is judged in height only · on a diagram, `fix.pulls` names the marks that make it lean and their share, `fix.try` the changes of one attribute that bring it under the limit, tried on the ink (`{ mark, set: 'side="right"', leanAfterPct }`) |
| `ILL_MARGIN_UNEVEN` | warning | the left and right margins of the ink differ by more than 6% of the width |
| `ILL_SPARSE` | warning | the ink fills under 40% of the room · a few marks in a large space · `fix.emptyPct` says where, and on a diagram `fix.try` proposes `gap="airy"` and `size="large"` on the mark put forward (not measured: `simulated: false`) |
| `ILL_NEAR_ALIGN` | warning | edges of shapes that miss each other by 1.5 to 6px · under 1.5 they are one edge (a pixel is rounding), past 6 an offset someone chose · not judged on a `ring` · on a diagram, `fix.marks` names the two marks, `fix.cause` whether their `heights` or `widths` differ, and `fix.try` is `align="stretch"` when stretching them aligns them |
| `ILL_RHYTHM` | warning | four or more neighbours in a row or a column are spaced unevenly (coefficient of variation over 0.15) · a gap over three times the median separates two groups and is not part of the rhythm |
| `ILL_FOCAL_MANY` | warning | more than one separate region is drawn in the accent (a fill of the accent at half its strength or more) · a series of three or more marks of the same size counts as one, and so do gates in any number (`data-role="barrier"`) · on a diagram, `fix.marks` names each region's marks |
| `ILL_FOCAL_WEAK` | warning | the accent region, counted double, is under 1.2× the next shape · not judged when the accent is gates, put forward by their reach across lanes · on a diagram, `fix.focal` and `fix.rival` name the marks, `fix.need` how many times larger the accent must be, `fix.try` the rival as an outline when that leaves the accent leading |
| `ILL_TYPE_SCALE` | warning | more than four font sizes, or two sizes of the same weight within 15% of each other |
| `ILL_WORDY` | warning | more than 90 words on the drawing |
| `ILL_REPEATED_LOOK` | warning | two illustrations of the deck are closer than 0.15 (`D = 0.5 structure + 0.3 visual + 0.2 time`) · the room sees the same picture twice · reported on the later slide, both in `measurement.slides`, with the three parts · `fix.action: vary-the-look` (another intent, another layout or other marks, or merge the slides) · about the deck, never an error · a pair whose later drawing moves on (a step, a scope, figures, a state) is no repeat: it is listed in `diversity.progressing` |
| `ILL_PAIR_TARGET` | error · warning | `pair` on an incident's diagram names no illustrated slide (error; not said with `--slides` when that slide was not walked), or a slide that comes before it (warning) · `fix.known` lists the slides after it |
| `ILL_PAIR_MARKS` | warning | the remedy keeps under half of the incident's named marks · reported on the remedy, `measurement.missing` and `fix.names` list the marks to keep |
| `ILL_ZOOM_FROM_TARGET` | error · warning | a camera's `zoom-from="slide-id/mark"` names no illustrated slide, or a slide that draws no such mark (error) · a slide that is not the one just before (warning: walking the deck, the room never arrives from there) |
| `ILL_ACT_DRIFT` | warning | two diagrams of one act write its `acts` two ways (they share at least half their steps) · `fix.value` is the list of the slide before |
| `SCENE_TEXT_TOO_LONG` | error | a `deck-scene-*` could not fit a field even one size smaller · reported per field (`label`, `note`, `figure`, `caption`) with the width it needed and the width it had, in `measurement.fields` · the suggestion is that field's fix (a bar's figure shrinks to 70% of its size before it is reported, then a shorter `tag`, no unit or fewer bars) |
| `SCENE_ATTRIBUTE_INVALID` | error | bars: `max` or `height` is not a positive number · ranges: `scale` is not · the scene drew its default instead |
| `SCENE_VALUE_CLIPPED` | error | bars: a `value` is past `max` or negative · ranges: a `from` or `to` is past `scale` or negative · the bar stops at the edge of the scale, so it is not the size it says |
| `SCENE_LAYOUT_INVALID` | error | a `deck-scene` with a `layout`, `link` or `split` it does not know (a split is one positive number per scene, joined by `:`), fewer than two scenes, or a child that is neither a scene nor the band · the default is drawn instead and the stray child hidden |
| `SCENE_REGION_TOO_NARROW` | error | a scene of a `row` composition gets under 440 units of the 1600-unit canvas, too narrow to say its piece · fewer scenes, or a `split` that gives it more |
| `SCENE_EMPHASIS_SCATTERED` | warning | more than one scene of a composition puts something forward with `emphasis` · the composition argues for one |
| `SCENE_FONT_FALLBACK` | warning | a scene's theme font (`--rik-font-sans` or `--rik-font-display`) is not installed or did not load, so every width the scene measured is the fallback's, not the room's · serve the theme's font files or check the network, then check again · once per family |
| `SCENE_GROUP_SPLIT` | warning | bars: a `note` comes back after another · only neighbours with the same note share a group, so each return starts a new one · keep the items of a group together |
| `SCENE_ITEMS_DROPPED` | error | a `deck-scene-*` has more `deck-scene-item` than it draws (cards 5, steps 6, bars 8, matrix 6, ranges 8, a flow 4 sources before its hub and 2 outcomes after) · the extra ones are cut without a word, named here |
| `SCENE_TOO_FEW_ITEMS` | error | fewer items than the shape is built for (cards 2, bars 2, a flow 2) · one card compares nothing |
| `SCENE_ITEM_NO_LABEL` | error | an item with no `label` is drawn as an empty box · named by position |
| `SCENE_ICON_UNKNOWN` | error | `icon` is not in the 24-glyph set of `deck-icon` · the scene draws no icon and says nothing |
| `SCENE_VALUE_INVALID` | error | bars: `value` is missing or not a number, drawn as a flat bar · lanes: `passed` or `blocked` is not a whole number from 0 to 8, the default is drawn · units: `total` or `columns` out of range, or a panel's `value` missing, not whole or past `total` · ranges: `from` or `to` written and not a number, or `from` after `to` · a row with no bound at all is meant (an open duration, drawn dashed) and is left alone |
| `SCENE_TOO_TALL` | error | the drawing came out taller than a slide leaves room for (about 620 units on the 1600-wide canvas, under a title of one line · a title that wraps, past about 36 characters, costs about 80 more) and the slide clips it · named with the item count and the height, where `CONTENT_CLIPPED` only says "content is cut off" · a `steps` of 5 with its band, a `matrix` of more than 3 rows · fewer items, or split the slide |
| `SCENE_GRID_TOO_DENSE` | error | units: at the `total` and `columns` written, in the panel width left by the number of panels, a cell is under 12 units wide · fewer panels, or fewer cells |
| `SCENE_LEVEL_INVALID` | error | matrix: `level` does not hold one known status per column of `columns`, or holds a word that is not `prod`, `pilot`, `test`, `announced` or `none` · a missing or unknown one is drawn as `none` |
| `SCENE_EMPHASIS_MANY` | warning | more than one item is `emphasis` · the scene puts one forward, two are none · bars count per group (items sharing a `note`) |
| `SCENE_LABEL_LONG` | warning | a label of five words or more reads as a sentence · one to three words, the rest goes in the note |
| `SCENE_NOTE_LONG` | warning | a note of more than one sentence · a scene is read from the back of the room |
| `SCROLL_SLIVER` | warning | a box scrolls (a `deck-code` shrunk by a full slide) by less than one of its own lines · nothing is cut, yet the room sees a scrollbar and a sliced last line · cut or merge a line |
| `SLIDE_DENSE` | warning | nothing is cut yet, but there is no room left |
| `SLIDE_TOP_HEAVY` | warning | measured on the pixels · the ink sits in the top with a dead band under it |
| `TALK_SHORTER_THAN_ANNOUNCED` | warning | the notes carry far less speech than the cover announces |
| `TEXT_TOO_SMALL` | warning | below the readable floor once the canvas is scaled |
| `TEXT_LAST_LINE_ORPHAN` | warning | a block of prose ends on a stub under a quarter of the width above it · measured on the painted lines, headings and short blocks excepted · worst one per slide |
| `ICON_DOUBLED` | warning | a component that paints its own icon (a callout's chip, a checklist mark) holds text opening with an emoji · two icons in one box, drop the emoji |
| `UNKNOWN_ATTRIBUTE` | warning | an attribute the element neither reads nor styles on · the value is dropped |
| `DUPLICATE_SLIDE_ID` | warning | two slides answer to the same name |
| `EXTERNAL_DEPENDENCY` | warning | the deck fetches from the network at runtime |
| `GRAPH_NODE_OUT_OF_BOUNDS` | error | a `deck-node` is painted outside its `deck-graph` canvas · move it inward with `at`, shorten its note, or constrain it with `width` |
| `GRAPH_EDGE_CROSSES_NODE` | warning | the line a `deck-edge` actually paints, bends and stroke width included, runs over a node it does not connect · move the obstructing node, or route the edge around it |
| `GRAPH_NODE_OVERLAPS_NODE` | error | two `deck-node` of the same `deck-graph` are painted on top of each other · one of them is unreadable |
| `GRAPH_NODE_COVERS_LABEL` | error | a `deck-node` is painted over a `deck-group` / `deck-lane` / edge caption · move the node with `at`, or the region with its own `at` |
| `GRAPH_EDGE_SKEWED` | warning | an edge misses horizontal or vertical by a few pixels · a frank diagonal is left alone, a three-degree slope is a slip · align the two `at` coordinates, or set `route="ortho"` |
| `GRAPH_NODES_OFF_AXIS` | warning | two nodes sit within the alignment slack of the same row or column without sharing it · worst offender per graph |
| `GRAPH_NODE_SIZES_MIXED` | warning | two nodes of one row (or column) differ by a few pixels in height (or width) · near-equal boxes read as a failed attempt at the same size, plainly different ones are left alone |
| `GRAPH_LAYOUT_NOT_SEMANTIC` | warning | every node of a graph of three or more sits on one axis, with no `layout` · the `at` coordinates re-do what `layout="row"` / `layout="column"` says |

**Illustrations.** Every drawing of a slide larger than 240×120px (a scene, a
diagram, a hand-drawn SVG) is read as it is painted at its last frame, and judged by
the `ILL_*` rules above. A defect (`ILL_ESCAPE`, `ILL_SHAPE_OVERLAP`,
`ILL_MOTION_ENDLESS`, a motion past 5s, a story past 12 s, `ILL_FINAL_INCOMPLETE`) is an error and fails the drawing; balance
(centre, margins, alignment, rhythm, focal, type scale, density) is a warning with a
threshold, because an asymmetry can be meant. The JSON report carries one row per
drawing in `illustrations`: `{ slide, slideId, element, tag, score, verdict, facets }`,
where `score` is 0 to 100 (it ranks variants, it never overrules a defect), `verdict`
is `ship` (85 and over), `reread` (70 to 85), `redo` (under 70) or `fail` (any defect),
and `facets` gives six sub-scores: frame, balance, alignment, hierarchy, density,
motion. Every finding carries `measurement` (what was measured, against which limit),
`facet`, and a `fix` such as `{ action: "centre", toward: "right" }` or
`{ action: "align", edge: "left", to: 312, deltaPx: 4 }`.

A scene finding carries a `fix` an agent can act on without parsing the message:
`{ action, … }` with the numbers that size it. `SCENE_TEXT_TOO_LONG` gives
`action: "shorten"` and, per field, `chars` (its length now), `holds` (how many
characters that field takes at this width and item count, from a table measured
on the real fonts · `null` for a figure or a caption) and the units it `needsUnits`
against what it `hasUnits`; `SCENE_ITEMS_DROPPED` gives `remove-items`,
`SCENE_TOO_TALL` `reduce-height`, `SCENE_REGION_TOO_NARROW` `widen-region`,
`SCENE_VALUE_CLIPPED` `raise-scale`.

Drawn text is measured on what it inks: across, the advance `getBBox()` gives;
up and down, the glyphs' own ascent and descent around the baseline, since the
font's line cell would make two caption lines set 1.1em apart overlap. The
anchor is the first baseline at the `text-anchor` point, and the drawing is
brought to its last frame first, so a card still growing in is measured at
its full width. Hidden labels (`display: none` on them or a group above,
`visibility: hidden`, inside `<defs>` or a `<clipPath>`) and empty ones are
skipped. A text a scene reported as too long (`SCENE_TEXT_TOO_LONG`) is not
reported again through the label it drew, but the rest of that drawing is still
measured, so a known fault cannot hide another.

A scene is forgiving on purpose · an item past the maximum is not drawn, a
figure that is not a number is a flat bar, an unknown icon is no icon, an
unknown status is `none` · and each of those is a picture that looks finished
and is wrong. The scene lints what the author wrote before it draws, writes
the findings to `data-scene-issues` (JSON) and warns once in the console;
`check` reports them under the `SCENE_*` codes above, with the items concerned
in `measurement.items`. The errors are defects, the warnings are the writing
rules of the `rikiki-scenes` skill.

The report also carries `notChecked`, which names what was **not** looked at:
revealed steps, accessibility, wording and facts, other viewports, the size of
text inside a diagram, and the size of a component's own chrome. Silence about
a check that never ran would read as a clean bill.

Two things it will not do: call a slide bad for having empty space, and claim a
deck is accessible. Space is a choice, and a handful of measurements is not an
accessibility audit.

### A check policy · which rules a deck keeps, where, and why

Every rule has a code (`TEXT_TOO_SMALL`) and a name (`text-too-small`); both
spellings are accepted everywhere, and so are globs (`ill-*`, `SVG_TEXT_*`).
`npx rikiki check deck.html --list-checks` prints every rule the deck can meet
(the built-in ones and those of its plugins), whether its policy keeps it, at
what severity, what decided, and, with `--slides`, the slides where it is kept
(`~` mixed). It measures nothing, and says what the policy gets wrong (the table
below): an error there, an `elements` selector the browser rejects included,
exits 2.

A deck's folders write the policy in `rikiki.config.json`, under `check`, beside
`plugins`. Every such file from the deck's folder up applies, outermost first,
until one that says `"root": true`, the folder that holds `.git`, or the
filesystem root · never a home folder. `--config <file>` reads that file alone.

```json
{
  "check": {
    "root": true,
    "checks": "-text-last-line-orphan,-graph-nodes-off-axis",
    "severity": { "ill-wordy": "error", "slide-dense": "off" },
    "warningsAsErrors": "svg-text-*,content-*",
    "limits": { "minTextPx": 20, "ill.words": 120 },
    "options": { "SPEAK_TOO_MANY_WORDS.max": 40 },
    "inline": "warnings",
    "overrides": [
      { "slides": "annexe-1..annexe-9", "checks": "-text-too-small", "reason": "annexes lues en PDF" },
      { "kinds": ["deck-cover", "deck-section"], "checks": "-slide-top-heavy" },
      { "tags": ["demo"], "severity": { "content-escapes-box": "warning" }, "reason": "capture live" },
      { "elements": ".legal, deck-table.mentions", "checks": "-text-too-small", "reason": "mentions légales" }
    ]
  }
}
```

- `checks` · a comma list applied in order on what is inherited (every rule, by
  default): `-x` drops, `x` takes back, `-*` drops everything. A nearer file and
  the command line (`--checks`) apply after an outer one.
- `severity` · `error`, `warning` or `off`, by rule or glob. A rule whose
  severity varies (`SVG_TEXT_CONTRAST_LOW`) is set to one. Each file, then the
  command line, says its `checks` then its `severity` before the next speaks:
  `--checks text-too-small` takes back a rule an outer file set to `off`.
- `warningsAsErrors` · applied last, on what is left a warning (`promoted: true`
  on the finding). A comma list read in order across the files and the command
  line, the last match deciding: `*,-text-too-small` raises every warning but one,
  and a nearer file's `-slide-dense` takes back what an outer one raised.
- `limits` · thresholds for the whole deck: a check one by its name (the keys of
  the report's `limits`: `minTextPx`, `clipPx`, `denseFillRatio`…), an
  illustration one as `ill.<name>` (`ill.words`, `ill.offCentreX`…). An unknown
  name is `CHECK_CONFIG_INVALID`; an override cannot set one.
- `options` · what a plugin rule reads as `ctx.options` (`"CODE.option"`, the code
  in either spelling); `--check-option CODE.option=value` on the command line.
- `overrides` · each applies to the findings that stand where all its criteria
  match: `slides` (the `--slides` grammar, on the whole deck), `kinds` (the
  slide's tag, globs allowed), `tags` (any of the words of the slide's
  `data-tags="annexe demo"`), `elements` (a CSS selector, its subtree and its
  shadow tree included). A finding with no slide is placed by the slide its
  element stands in. An override that names slides the deck lacks covers none
  (`CHECK_SELECTION_UNMATCHED`); prefer ids and `data-tags` to positions.

A deck may also write an exception on itself, which only silences, and only
with its reason:

```html
<deck-feature id="tarifs" data-tags="annexe"
  data-check-off="slide-dense text-too-small"
  data-check-reason="grille contractuelle, lue en séance">
```

On `<deck-root>` it covers the deck, on a slide that slide, on an element that
element and what it holds. By default (`inline: "warnings"`) it cannot silence an
error: the error stays and `CHECK_SUPPRESSION_REFUSED` says so · lower the rule in
the config, where a reviewer reads it. `inline: "all"` lets it, `"none"`
(`--no-inline-exceptions`, for a CI) ignores every exception. `balance="free"`
and the attributes that change what a rule judges stay the better way: they are
not exceptions.

Order, the last word winning: the files, outermost first · the command line
(`--checks`, `--severity`, `--warnings-as-errors`, `--limit`, `--check-option`)
· the overrides that match, in order · the exceptions of the deck · then the
findings about the run (a page that threw, a file that did not load, a navigation
that stalled, a review that could not be read, every `CHECK_*`) come back,
whatever was written · then `warningsAsErrors`.

Nothing is lost: what the policy silences is in the report's `suppressed`, each
with `suppressedBy: { kind: config | override | inline, source, reason }`;
`summary.suppressed` counts them (absent when there is none), `notChecked` says so, and `--show-suppressed`
lists them in the human report. `selection` gives the files read, each override
with the slides it covered and how many findings it decided, each exception with
how many it silenced. An illustration is judged again on the findings kept, at
their severity, in every state `--steps` walked, and the worst state left stands:
its row says which were left out (`suppressed`). A plugin rule silenced on a slide
by its slides, kinds or tags does not run there at all, unless an override that
names elements takes it back on that slide: it then runs, and its findings are
kept under those elements only.

What the policy gets wrong is said, and never silenced:

| Code | Severity | Means |
|---|---|---|
| `CHECK_CONFIG_INVALID` | error | a `check` section that cannot be read, a threshold that is none, a selector the browser rejects · the file's section is left out, with the file and the key |
| `CHECK_SELECTION_UNMATCHED` | warning | a rule name or glob that names no rule (a typo silences nothing), an override whose slides the deck lacks |
| `CHECK_SELECTION_IGNORED` | warning | a name that only names findings about the run, which are always reported |
| `CHECK_OPTION_UNKNOWN` | warning | an option (`check.options`, `--check-option`) whose rule no plugin of the deck has · a typo gives it to nothing (silent when that plugin did not load: its own failure says so) |
| `CHECK_SUPPRESSION_UNJUSTIFIED` | error | `data-check-off` without `data-check-reason` · not applied |
| `CHECK_SUPPRESSION_UNKNOWN` | warning | `data-check-off` names no rule, or a bare `*` |
| `CHECK_SUPPRESSION_UNUSED` | warning | an exception that silenced nothing · said only when its slide was walked in every state, the pixels measured and its plugin run |
| `CHECK_SUPPRESSION_REFUSED` | warning | an exception written over an error, which the policy keeps |

A plugin may not take a built-in family as its namespace (`TEXT`, `ILL`, `DG`,
`SVG`, `CHECK`…): it would name a rule like a built-in one
(`CHECK_PLUGIN_LOAD_FAILED`).

### `rikiki scene` · from a brief to a slide

```bash
npx rikiki scene plan brief.json                          # candidates on stderr · exit 0 if one fits, 1 if none
npx rikiki scene plan brief.json --json                   # the plan on stdout, nothing else
npx rikiki scene plan brief.json --measure --out plan/    # + drawn in Chromium: height, issues, <id>.png
npx rikiki scene compile brief.json --candidate bars      # the <deck-feature> of that candidate
npx rikiki scene budgets cards --width 752 --json         # characters per field, by item count
```

A brief (`"schema": "rikiki.scene-brief/1"`) carries the `claim` (the future
title), the `relation` (`parallel`, `sequence`, `converge`, `compare-size`,
`position-2d`, `span-time`, `gate`, `share-of-crowd`, `before-after`,
`mechanism-proof`), the data that relation holds, `focus` (the label of the item
the claim argues for) and `source.text`. An invalid brief lists each error as
`path · message` and exits 2, with nothing written; so do a missing file, an
unknown `--candidate` (the valid ids are named) and an unknown shape.

`plan` is deterministic and calls no model: each candidate has an `id`, a
`form`, `fits`, the `imports` (modules to load), the `html` fragment and
`issues` (`code`, `severity`, `message`, `items`, `predicted: true` when it comes
from the tables rather than a drawing, a `fix` shaped like `check`'s). With
`--measure` (needs `playwright`) each candidate also gets
`measured: { height, issues, shot }`, read from the drawn scenes'
`data-scene-issues` in the theme's fonts (`--theme rikiki|siliceum`), and a
measured error sets `fits` to false. `--out` writes `candidates.json` and one
`<id>.html` (and `<id>.png`) per candidate. `compile` heads the slide with the
`<script type="module">` tags it needs, in an HTML comment: add them once to the
deck's `<head>`.

## 13 · Recipes / cookbook

For choosing a composition from what a slide has to say, see
[`rikiki-workflow.md`](./rikiki-workflow.md). This section is the wiring: what
to type once the composition is chosen.

Copy-paste patterns. Every tag/attribute used here is defined above · combine
them freely. Assume the deck head loads the theme then `dist/index.js` (§2).

### An opt-in component slide (§20)

The opt-in components are not in `dist/index.js` · load the ones you use, one
script tag each, after the core bundle. They follow the direction in §20: one
filled area at most, two type sizes, no label above content.

```html
<script type="module" src="dist/index.js"></script>
<script type="module" src="dist/deck-kpi-grid.js"></script>
<script type="module" src="dist/deck-flow.js"></script>
```

```html
<deck-feature eyebrow="Numbers" spread="center">
  <h1 slot="title">Where the time went</h1>
  <deck-kpi-grid cols="3">
    <deck-kpi value="34" label="components in the default bundle"></deck-kpi>
    <deck-kpi value="14" label="more, one script tag each" tone="accent"></deck-kpi>
    <deck-kpi value="0" label="network calls at runtime" note="a bundled deck runs offline"></deck-kpi>
  </deck-kpi-grid>
</deck-feature>

<deck-feature eyebrow="Chain" spread="center" data-steps="4">
  <h1 slot="title">One stage at a time</h1>
  <deck-flow cols="4" reveal>
    <deck-flow-step label="Write" note="one HTML file"></deck-flow-step>
    <deck-flow-step label="Preview" note="open it"></deck-flow-step>
    <deck-flow-step label="Bundle" note="one command"></deck-flow-step>
    <deck-flow-step label="Present" note="offline"></deck-flow-step>
  </deck-flow>
</deck-feature>
```

At step 0 the whole chain is visible and neutral · its shape is half the
message. Each step then moves the block to the stage being discussed. A running
version of both slides is in `examples/rikiki-tour/index.html`.

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

Everything above this section says what you MAY write. This one says what makes
the result worth projecting, because the two are not the same question and
decks assembled correctly from the tables above have been rejected in a room.

### 14.1 · What the slide is

A slide is read from three to ten metres, for about forty seconds, while
someone talks over it, and then again as a thumbnail in the overview grid and
as a page in a PDF. What survives that trip is **area, size, position, one
saturated colour and empty space**. What does not survive is a hairline, type
under about twenty pixels on the wall, letter spacing, small caps, a
low-contrast tint, and anything that has to be compared against something else
to be understood. Compose from the first list. See
`docs/design/adr-002-extras-visual-direction.md`.

### 14.2 · The title is the message, the body is the proof

A content slide's title is a **full sentence stating what the slide argues**,
about eight to fourteen words, and the body is its **evidence** · a figure, a
diagram, a table, a number. Not a bullet list restating the title.

This is the assertion-evidence structure (Michael Alley, Penn State), and it is
here because the comprehension gain over the usual topic-and-subtopic slide is
measured and statistically significant, not because it reads better.

A topic title carries no message, so the body has to carry all of it, and the
slide ends up with nothing to look at. "Graph" names a subject; "An architecture
reads as boxes and arrows, never as paragraphs" says something the evidence can
then support.

It costs nothing in type size: at the shipped title size the usable width holds
about forty-four characters a line, so fourteen words fit on two lines. It does
cost height · a two-line title takes a line back from the body, and
the repository's slide-budget suite will say so.

`deck-cover` and `deck-section` are exempt. A chapter title is a boundary, not
an assertion, and three words are right there.
a test in the repository holds the band on every shipped deck.

### 14.3 · The five rules

1. **One loud thing.** A slide has one statement. Everything else on it is
   quiet. Two loud things means the eye picks the wrong one.
2. **Two sizes, and the gap between them is the design.** A statement and a
   reading size, nothing in between. The theme sets the statement at more than
   twice the reading size on purpose · a title at 1.5x reads as body text in
   bold, which is the single most common reason a deck looks flat.
3. **One mass at most.** One filled area per slide, carrying whatever the
   content actually marks. Nothing marked means nothing filled. On these themes
   a pale tint is invisible in a room; real emphasis is the inverse surface.
4. **A line only where two things would otherwise touch.** A table header, a
   timeline axis, an edge in a diagram. Never as decoration or as a signature.
5. **Left, ragged right.** The vertical edge down the left is what makes a
   glance cheap. Centre a whole slide if you mean to; never centre a column
   inside a row of columns, because it breaks that edge.

### 14.4 · Filling the canvas

Most rejected slides put their content in the top fifth and leave the rest
white. That is almost never a component problem · it is a deck that never asked
for a distribution. `spread` and `fill` (§19) are the answer, and the choice
between them is: `spread` when the type size is right and only the rhythm is
wrong, `fill` when the slide is genuinely under-filled and the text should grow
into it (pair it with `<deck-fit>`).

Prefer cutting to shrinking. If a slide needs a third type size or a smaller
body to fit, it is two slides. `<deck-notes>` takes what does not fit, and a
stepped reveal (§7) is the medium's own way of showing a lot without crowding.

### 14.5 · Rows of items

Reach for **`<deck-point>`** when a bento item holds words, and **`<deck-cell>`**
when it holds something that must be measured to its box · fit-to-cell text, a
diagram, an image.

The difference is not cosmetic. A row of `deck-point` is as tall as its tallest
point, and a row made only of points (same number of children each, no spans,
no declared `rows`) shares the grid's bands, so a title that wraps to a second
line does not drag its own body text below its neighbours'. A row of
`deck-cell` takes a share of the slide instead, so a cell that carries a surface
will show a box taller than its text. Mixing them in one row is allowed and
costs the shared bands.

Whichever you use, do not reach for `plain` to remove the gutter · it keeps the
gutter on purpose, so a painted item and a plain one start their text on the
same edge.

### 14.6 · Mechanics

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
server**, not a double-click: `npx serve .`, or anything that speaks HTTP.
Offline once every asset is local.

**Standalone** · one HTML file, produced by `rikiki bundle deck.html out.html`.
Opens straight from `file://`, so it survives a USB stick, an email attachment
and an archive. Nothing is fetched at runtime: scripts, styles, fonts and images
are all inside. The presenter works from it too.

- A deck using `<deck-mermaid>` needs `--with-mermaid` (+~3 MB).
- A deck using Shiki needs `--with-shiki` (about +0.7 MB raw, 113 KB compressed).
- Without the flag the command **fails** and names the missing runtime · it will
  not hand you a file that renders an empty diagram offline.
- `rikiki init --standalone` produces a starter with the same guarantees.

**CDN** · two `<script>`/`<link>` tags from jsdelivr. Zero install, but the deck
fetches the framework every time it runs, so it needs the network and is **not**
an archival format. Always pin a version.

The self-containment of a standalone file is enforced, not assumed:
the bundle suite writes each bundle outside the repository, opens it over
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

The whole contract is verified by a print suite that reads the produced
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
Only one of them can be the page. Pinned by the multi-deck suite.

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

---

## 20 · Opt-in components

Some components are **not** in `dist/index.js`. A deck that does not use them
pays nothing for them · manifesto principle 3, light by default. Each is its own
module, loaded next to the bundle:

```html
<script type="module" src="dist/index.js"></script>
<script type="module" src="dist/deck-bar.js"></script>
<script type="module" src="dist/deck-quote.js"></script>
```

`rikiki bundle` folds a loaded module into the single file like any other
script, so a standalone deck keeps them and stays offline. Forget the `<script>`
and the tag stays an unknown element: it renders its text content, logs nothing,
and the rest of the deck is unaffected.

**Past about four added modules, stop adding script tags and bundle.** Each
module is compiled on its own and carries its own copy of the shared code, and
gzip compresses one large repetitive file far better than several small ones,
so script tags stop paying off quickly. Measured on this release, gzipped:

| what the deck loads | gzip |
|---|---|
| `dist/index.js` alone | 26 KB |
| `dist/index.js` + 3 modules | 30 KB |
| `dist/index.js` + 5 modules | 33 KB |

`rikiki bundle` carries only the components the deck actually writes, in one
file, so it is smaller than the plain bundle for any deck that does not use
every component · and it is the only option that gets *smaller* as the deck
gets simpler, rather than larger. Script tags are the convenient path for one
or two extras, not the cheap one.

Every evidence block below (`deck-csv`, `deck-table`, `deck-bar`,
`deck-kpi-grid`, `deck-annotate`, and plain prose) takes a `deck-source`
underneath it for the credit line · `deck-source` is a core atom (§6), not an
opt-in module, because so many of these need it. `deck-figure` renders one
internally for its own `source` / `source-href` attributes, so the two
authoring paths render identically and cannot drift.

| Tag | Purpose | Key attributes | Slots |
|-----|---------|----------------|-------|
| `deck-bar` | A proportion, drawn · one value against a total, or a stack of categories on one track | `value`, `total`, `label`, `tone` (`accent`/`ok`/`warn`/`danger`/`info`/`muted`), `segments` (`label:value:tone` triples separated by `\|`), `no-value`, `no-legend` | · |
| `deck-icon` | A symbol · one of 24 drawn glyphs by `name`, or any `<svg>` you slot in. Nothing is vendored; `rikiki bundle` keeps only the glyphs the deck writes | `name`, `size` (`sm`/`md`/`lg`/`xl`), `tone`, `label` (absent means decorative, and it is hidden from assistive technology) | default = a fallback `<svg>` |
| `deck-checklist` / `deck-check` | What works and what does not, told apart by shape as well as colour | list: `cols` · item: `no` | item default = the text |
| `deck-kpi-grid` / `deck-kpi` | Several figures that read as one family · the grid owns the value / label / note rows and every figure adopts them, so all the values share one baseline and all the labels sit on one line | grid: `cols`, `ruled` (a visible divider between figures) · figure: `value` (statement size · `--deck-kpi-value-size` for a fluid one), `label`, `note`, `tone` (`accent`/`ok`/`warn`/`danger` put the figure on the inverse surface and colour its label with the tone; `default` and `muted` paint nothing) | · |
| `deck-pull` | An excerpt lifted out of a dense slide · text wraps around it when floated | `side` (`full`/`left`/`right`) | default = the excerpt |
| `deck-persona` | Who is speaking, or who the case study is about · the portrait block is the inverse surface, so the person has a place on the slide | `name`, `person-role` (**not** `role`), `org`, `context` (the quiet line, gapped away from the identity), `src` (a portrait; initials in inverse ink stand in without one), `on-dark` (the block flips to paper with ink initials), `compact` (shrinks the block and the name together, for a supporting persona), `inline` (name, role and context on one wrapping row) | · |
| `deck-versus` | A directed comparison as a BLOCK inside a slide (`deck-split` covers the case where the comparison is the whole slide) | `pivot`, `winner` (`left`/`right`), `slide` (make the comparison a deck-root slide of its own, with `title` and `lead` slots), `eyebrow` (context label above the title, slide mode only) | `title`, `lead`, `left`, `right`, `footer` (full width, under both sides, slide mode only; a slotted `deck-callout` keeps its own size) |
| `deck-flow` / `deck-flow-step` | A chain across the width · numbered stages, and only the active one takes the block | flow: `cols`, `reveal` · stage: `label`, `note` | stage default = extra content |
| `deck-timeline` / `deck-milestone` | A trajectory in time, on an axis | timeline: `direction` (`row`/`column`), `alternate` (row only · milestones alternate above and below the axis, each twice as wide), `reveal` · milestone: `date`, `label`, `note`, `tone` | · |
| `deck-graph` / `deck-node` / `deck-edge` / `deck-group` / `deck-lane` | Nodes, edges, regions and bands · the primitive behind every boxes-and-arrows slide | graph: `layout` (`free`/`row`/`column`), `reveal` · node: `at` (`x,y` in percent), `label`, `note`, `boxed`, `tone`, `icon`, `width` (an explicit CSS width such as `18ch` or `240px`, so a long label wraps instead of colliding) · edge: `from`, `to`, `label`, `dashed`, `arrow` (`end` default / `start` / `both` / `none`), `route` (`straight` default / `ortho` for right-angle segments), `label-offset` (`x,y` in pixels, moves the label off the line) · each edge publishes the polyline it paints back onto itself as `data-path` (`x1,y1 x2,y2[ ...]`, graph-relative CSS pixels), which is what `rikiki check` reads · group: `at` (`x,y,w,h`), `label`, `solid` · lane: `at` (`top,height`), `label` | node default = extra content |
| `deck-table` | A hand-authored table with the hierarchy `deck-csv` has · the table stays in your light DOM, so its cells may carry markup | `highlight-rows`, `highlight-cols`, `reveal` | default = your `<table>` |
| `deck-annotate` | A screenshot the speaker can point at · numbered markers positioned in percent, revealed one per step through the engine's own step mechanism · a real `<figure>`/`<figcaption>`, so it can carry its own caption and source like `deck-figure` | `src`, `alt`, `marks` (`x,y,label` triples separated by `\|`, coordinates in percent), `all-at-once`, `no-legend`, `leader` (draw a line from the target point to a displaced badge), `offset` (`x,y` in pixels, or a named side `above` / `below` / `left` / `right` : the badge is displaced by its own rendered diameter plus `--deck-annotate-anchor-gap` in that direction, and its leader turns on regardless of `leader`), `offsets` (per-mark displacements separated by `\|`, mixing pixel and keyword forms, e.g. `above\|0,-40\|right`; a missing entry falls back to `offset`), `caption`, `source`, `source-href` (turns the credit into a link) | `caption`, `source` |
| `deck-agenda` | The running order and where the talk is · reads the deck's own chapter structure, so adding a `deck-section` grows a line | `no-numbers`, `no-jump` | · |
| `deck-quote` | Someone else's words, attributed · distinct from `deck-punch`, which is the speaker's own line | `author`, `author-role` (**not** `role`, which belongs to ARIA), `size` (`lead`/`big`/`mega`), `plain` (drop the rule beside the quote), `on-dark`, `no-mark` | default = the quoted text |
| `deck-figure` | A screenshot, a diagram or a chart as content · the image keeps its ratio, and its caption and credit stay attached to it semantically | `src`, `alt` (required unless `decorative`), `caption`, `source`, `source-href` (turns the credit into a link), `decorative` (the image carries no information · produces `alt=""`) | `image`, `caption`, `source` |

Tokens follow the usual per-component convention and every default routes to a
semantic `--rik-*` token, so both shipped themes are covered:
`--deck-bar-track`, `--deck-bar-height`, `--deck-bar-radius`, `--deck-bar-fill`,
`--deck-bar-divider`, `--deck-bar-legend-color`, `--deck-bar-label-color`,
`--deck-bar-value-color`; `--deck-quote-color`, `--deck-quote-size`,
`--deck-quote-rule`, `--deck-quote-mark-color`, `--deck-quote-author-color`,
`--deck-quote-role-color`, `--deck-quote-max-width`;
`--deck-annotate-mark-bg`, `--deck-annotate-mark-color`, `--deck-annotate-mark-size`,
`--deck-annotate-mark-ring`, `--deck-annotate-radius`, `--deck-annotate-legend-color`,
`--deck-annotate-leader`, `--deck-annotate-leader-width`, `--deck-annotate-anchor-gap`
(defaults to `--rik-space-2`, the gap a keyword offset leaves between the
target point and the badge), `--deck-annotate-gap`
(defaults to `--deck-figure-gap`), `--deck-annotate-caption-color` (defaults to
`--deck-figure-caption-color`);
`--deck-agenda-current-color`, `--deck-agenda-done-color`, `--deck-agenda-rule`,
`--deck-agenda-marker`, `--deck-agenda-size`, `--deck-agenda-gap`;
`--deck-icon-size`, `--deck-icon-color`, `--deck-icon-stroke`;
`--deck-check-yes`, `--deck-check-no`, `--deck-check-size`,
`--deck-check-no-color`, `--deck-checklist-rule`;
`--deck-kpi-value-size` (statement size by default · a slide with room can go
fluid with `clamp(2.25rem, 6cqw, 7rem)`, where `cqw` measures the nearest
declared container and falls back to the viewport when the deck declares
none), `--deck-kpi-value-color`,
`--deck-kpi-label-color`,
`--deck-kpi-note-color`, `--deck-kpi-mass`, `--deck-kpi-mass-text`,
`--deck-kpi-block-pad-x` (set it on the grid or above, never on one figure ·
the grid offsets itself by this value so the first column's ink lands on the
slide's text edge), `--deck-kpi-block-pad-y`,
`--deck-kpi-grid-cols`, `--deck-kpi-grid-gap`, `--deck-kpi-grid-row-gap`,
`--deck-kpi-grid-rule`, `--deck-kpi-grid-rule-width`;
`--deck-pull-rule`, `--deck-pull-size`, `--deck-pull-width`, `--deck-pull-font`;
`--deck-persona-avatar-size`, `--deck-persona-avatar-bg`,
`--deck-persona-initials-color`, `--deck-persona-initials-size`,
`--deck-persona-name-size`, `--deck-persona-name-color`,
`--deck-persona-role-color`, `--deck-persona-context-color`,
`--deck-persona-gap`, `--deck-persona-name-lift`, `--deck-persona-compact-avatar-size`,
`--deck-persona-compact-name-size`;
`--deck-versus-winner-ring`, `--deck-versus-loser-opacity`, `--deck-versus-pivot-color`,
`--deck-versus-slide-bg`, `--deck-versus-eyebrow-color`, `--deck-versus-side-align`,
`--deck-versus-footer-gap` (defaults to `--rik-space-3`);
`--deck-flow-gap`, `--deck-flow-step-accent`;
`--deck-timeline-axis`, `--deck-milestone-dot`;
`--deck-graph-edge`, `--deck-graph-edge-width`, `--deck-graph-ratio`, `--deck-node-rule`,
`--deck-node-bg`, `--deck-group-border`, `--deck-lane-rule`;
`--deck-table-mark-bg`, `--deck-table-mark-color`, `--deck-table-col-color`,
`--deck-table-col-on-mark`;
`--deck-figure-gap`, `--deck-figure-radius`, `--deck-figure-border`, `--deck-figure-bg`,
`--deck-figure-image-fit`, `--deck-figure-image-position`, `--deck-figure-max-height`,
`--deck-figure-caption-color`, `--deck-figure-source-color` (forwarded to the
`deck-source` it renders internally, alongside `--deck-source-color` and
`--deck-source-gap`, §6).

Five are shared and change every component here at once: `--rik-extras-mass`
and `--rik-extras-mass-text` (the one filled area), `--rik-extras-statement` and
`--rik-extras-reading` (the two sizes), and `--rik-extras-edge` (the load-bearing
line).

### The look these share

One direction, four rules, repeated by every component here. They come from the
medium rather than from a catalogue: a slide is read from three to ten metres in
about forty seconds while someone talks over it, and at that distance area, size
and position survive while hairlines, small caps, thin strokes and pale tints do
not.

1. **One mass at most.** A single filled area per component, carrying whatever
   the markup marks. Nothing marked means nothing filled.
2. **Two sizes.** A statement size and a reading size, with nothing in between.
   The absent third step is why no component here has a micro-label.
3. **No label above content.** Context is written after the thing, at reading
   size, in sentence case. No all-caps tag, no tracked-out eyebrow.
4. **A line only where two things would otherwise touch.** A table header, a
   timeline axis, a graph edge. Never as decoration.

Numbers appear in exactly two components, `deck-flow` and `deck-agenda`, because
those two genuinely are sequences. Numbering anything else labels an order the
content does not have.

`reveal` on `deck-flow`, `deck-timeline` and `deck-graph` **emphasises**, it
does not hide: at step 0 the whole chain, span or diagram is visible and
neutral, because its shape is half the message. `deck-annotate` is the
exception and shows nothing at step 0 · there the screenshot must speak first.

A block is `boxed`. The theme's raised surface measures 1.10 against the page,
which is invisible on a projector, so a node that must READ as a block uses the
inverse surface: dark on light is the one high-contrast ground this palette has.
`tone` fills it with an accent or a status colour instead.

```html
<deck-graph>
  <deck-lane at="4,40" label="edge"></deck-lane>
  <deck-group at="46,50,50,44" label="vpc · eu-west-3"></deck-group>
  <deck-node id="cdn" at="32,22" boxed icon="cloud" label="CDN" note="edge cache"></deck-node>
  <deck-node id="api" at="58,68" boxed tone="accent" icon="code" label="API"></deck-node>
  <deck-edge from="cdn" to="api" label="origin"></deck-edge>
</deck-graph>
```

```html
<deck-graph layout="row">
  <deck-node id="a" label="Collect" note="raw"></deck-node>
  <deck-node id="b" label="Decide" note="verdict"></deck-node>
  <deck-edge from="a" to="b" label="rules"></deck-edge>
</deck-graph>

<deck-graph>
  <deck-node id="client" at="8,50" label="Client"></deck-node>
  <deck-node id="api" at="64,25" label="API" note="node 24"></deck-node>
  <deck-edge from="client" to="api" label="https"></deck-edge>
</deck-graph>
```

`deck-graph` places nodes where the author puts them and never runs a layout
solver: an automatic layout moves every node when you add one, which breaks
"source = output" and makes the file unreadable a year later. `at="x,y"` in
percent is the whole layout language, plus `row` and `column` for the two cases
that would otherwise be typed out every time. `layout="row"` and
`layout="column"` space nodes evenly along one axis and **ignore `at`
entirely** · there is no automatic placement beyond these two canned
arrangements, and no `serpentine`, `fan-in` or `fan-out` layout, for the same
reason: placement is the diagram, not a computed side effect. Hand-placed
nodes that end up on top of each other are caught by `rikiki check`, which
reports `GRAPH_NODE_OVERLAPS_NODE` (§12b) · that check is the net for hand
placement, not a layout solver.

```html
<deck-annotate
  src="dashboard.png"
  alt="The ops dashboard"
  marks="20,30,Queue depth|55,60,Latency spike|82,25,Retries"
></deck-annotate>

<deck-agenda></deck-agenda>
```

`deck-annotate` publishes one step per marker onto its slide, so the reveal
works with the arrow keys like any other step · no plugin, no configuration. On
paper every marker prints. `deck-agenda` marks the chapter in progress with
`aria-current` and each line is a real button, so a reader can tab to a chapter
and jump.

```html
<deck-bar value="160" total="538" label="Worth a second look"></deck-bar>

<deck-bar
  label="Four thousand findings"
  segments="blocker:137:danger|major:921:warn|minor:1544:info|info:812:ok|noise:586:muted"
></deck-bar>

<deck-quote author="Marie Dupont" author-role="CTO, Acme">
  We stopped arguing about the diff and started arguing about the design.
</deck-quote>
```

A stacked bar's printed percentages always add to exactly 100 · the rounding
drift is absorbed by the largest slice, where it is least visible. A bar given
an explicit `total` keeps the honest figure instead: `160 / 538` reads 30% and
leaves the rest of the track empty, which is the whole point of drawing it.

### Animated scenes · `deck-scene-*`

A scene is a slide's illustration written as data. The author gives words and
figures on `deck-scene-item` children; the scene measures each string in the
font the slide renders, wraps it without cutting a word, lays everything out on
a 1600-unit SVG canvas, paints it with theme tokens and animates it when the
slide is entered. Nothing is placed by hand, so nothing overflows, overlaps or
gets cropped by a wrong coordinate.

Eight shapes, one module each, every one bringing `deck-scene-item` with it:

| Tag | The slide says | Scene attributes | Item attributes read |
|-----|----------------|------------------|----------------------|
| `deck-scene-cards` | "These options side by side" · 2 to 5 equal cards | · | `icon`, `label`, `note`, `tag`, `emphasis` |
| `deck-scene-steps` | "Start with this, then that" · 1 to 6 numbered rows (a slide holds about 4 beside the closing band, 5 without it), an optional closing band on the inverse surface | `conclusion`, `conclusion-note`, `conclusion-icon` | `label`, `note`, `tag`, `emphasis` |
| `deck-scene-flow` | "How it works" · sources merge into a hub, the hub feeds outcomes. Roles come from order: the `emphasis` item is the hub, items before it are sources (1 to 4), items after it are outcomes (1 or 2); without an emphasis the last item is the hub | · | `icon`, `label`, `note`, `emphasis`, `tag` (drawn on the arrow into an outcome) |
| `deck-scene-bars` | "This one is bigger" · up to 8 vertical bars, no axis; consecutive items with the same `note` form a captioned group | `unit` (after a narrow no-break space), `max`, `height` | `value` (`1,7` and `1.7` are the same number, printed as written), `label`, `tag` (printed instead of the figure), `note`, `emphasis` |
| `deck-scene-lanes` | "What happens when one thing changes" · 2 to 5 lanes carry the same traffic as tokens, a gate comes down across all of them, and the tokens still on their way queue against it. The end state is the picture: gate down, served tokens beyond it, refused ones queued | `gate` (the word on the gate), `trigger` (what brought it down), `passed` and `blocked` (tokens per lane, 0 to 8, default 3 each) | `label`, `note`, `icon`, `tag` (the outcome, at the end of the lane) |
| `deck-scene-matrix` | "Where each one stands" · up to 6 rows of status dots, of which a slide holds about 3 with its legend: past that the drawing is taller than the slide and `SCENE_TOO_TALL` says so | `columns` (`\|`-separated, 2 to 12), `groups` (`name:count \| …`), `statuses` (`prod=en production \| …`, the words in the deck's language) | `label`, `level` (one of `prod`/`pilot`/`test`/`announced`/`none` per column, space-separated), `emphasis` |
| `deck-scene-units` | "One cell per person" · 1 to 3 grids of the same `total`, the first `value` cells of each lit, side by side: 200 lit beside the same 200 switched off. The cells light down a column, then on to the next; the height of a grid is capped so the scene stays on the slide | `total` (cells per grid, 1 to 400, default 100), `columns` (1 to 40, a landscape grid by default) | `label` (the caption), `icon`, `value` (cells lit, 0 to `total`, required), `note`, `emphasis` (the panel lit in the accent, the others in ink) |
| `deck-scene-ranges` | "How long each takes" · up to 8 bars on one shared scale; `to` alone is a point, neither is an open row drawn dashed | `scale`, `unit`, `caption`, `open-label` (default "to be set") | `label`, `note`, `from`, `to`, `tag` |

**Composing scenes.** One scene says one thing. When the message is a relation
between two pictures, put them in a `deck-scene` (a separate module,
`dist/deck-scene.js`, loaded beside the scenes it composes):

```html
<script type="module" src="dist/deck-scene.js"></script>
<script type="module" src="dist/deck-scene-band.js"></script>

<deck-scene layout="row" link="arrow">
  <deck-scene-units total="50" columns="10">
    <deck-scene-item label="before" value="18" note="stayed a year"></deck-scene-item>
  </deck-scene-units>
  <deck-scene-units total="50" columns="10">
    <deck-scene-item label="after" value="36" emphasis note="stayed a year"></deck-scene-item>
  </deck-scene-units>
  <deck-scene-band label="Twice as many stay" note="at the same headcount" icon="target"></deck-scene-band>
</deck-scene>
```

| Tag | What it does | Attributes |
|-----|--------------|------------|
| `deck-scene` | Composes the scenes it contains: 2 or 3 side by side (`row`, the default) or 2 one above the other (`stack`), with an optional `deck-scene-band` closing under either. It redraws nothing: each scene keeps its own drawing and its own checks | `layout` (`row` or `stack`), `split` (the shares of a row, `2:1`, one positive number per scene, default equal), `link` (`arrow`, `vs`, `equals` or `plus`, drawn in each gutter of a row), `align` (`start`, `center`, `end` or `stretch`: where a shorter scene sits, default `center`), `stagger` (seconds between one scene's entrance and the next, default 0.45) |
| `deck-scene-band` | The sentence a composition answers to: one band on the inverse surface, an optional icon, a bold sentence of up to two lines and one line under it. The closing band of `deck-scene-steps`, as a scene of its own | `label` (the sentence), `note` (one line), `icon` (a `deck-icon` name) |

One scale: a unit is the same length in every region. A scene drawn in half a
row is told it has half the canvas to lay out in, so it wraps and fits for that
width and its text is the size of a scene drawn alone · a region is never a
shrunken copy. A region under 440 units wide is too narrow to say its piece and
is reported, not drawn small. The composition's height budget is the slide's:
the tallest scene of a row, or the scenes of a stack and the gaps between them,
plus the band. Only scenes and one `deck-scene-band` go inside; anything else,
a second band included, is hidden and reported. Put forward in one region only.

`deck-scene-item` draws nothing (`display: none`) · it carries `label`, `note`,
`icon` (a `deck-icon` name, closed set of 24), `tag`, `value`, `level`, `from`,
`to` and `emphasis`, and each scene reads the ones it draws. One emphasis per
scene: it is the item the title argues for.

```html
<script type="module" src="dist/deck-scene-cards.js"></script>

<deck-feature eyebrow="Protocols">
  <h1 slot="title">Only one protocol is a safe bet today</h1>
  <deck-scene-cards>
    <deck-scene-item icon="target" label="MCP" tag="safe bet" emphasis
      note="one connector serves ChatGPT, Claude and Copilot"></deck-scene-item>
    <deck-scene-item icon="cloud" label="UCP" tag="publish too"
      note="real volume, but American"></deck-scene-item>
    <deck-scene-item icon="ban" label="AP2" tag="too early"
      note="no production deployment found"></deck-scene-item>
  </deck-scene-cards>
  <deck-source>Protocol specifications, October 2026</deck-source>
</deck-feature>
```

**Motion.** A scene plays when its slide is entered (the engine's `applyStep(0)`
sets `playing`) and rests at its final state everywhere else: overview,
presenter preview, `rikiki render`, print, PDF and `prefers-reduced-motion`. Do
not wrap a scene in `data-step-block`; the motion is inside the drawing.

**Text that does not fit.** Each field is tried at its size, then once at 0.88
of it (a bar's figure keeps going down, a step at a time, to 70%). A text that
still does not fit is drawn anyway, named by item and field in the scene's
`data-scene-issues` attribute and in one console warning, and `rikiki check`
reports it as `SCENE_TEXT_TOO_LONG` with the width it needed (§12b). Shorten the
words rather than widening the scene. A no-break space keeps a figure and its
unit together.

### Diagrams · `deck-diagram`

An illustration written **without a coordinate**. `deck-diagram` holds marks (a
box, a text, dots, a bar, a link, a lane, a gate, a cursor, a meter, a queue)
inside groups, and each group names how its children are placed. The diagram
measures every text in the deck's font, places everything, routes the links, puts
each note beside what it points at, draws one SVG in theme tokens and plays its
motion when the slide is entered, then on each click a mark waits for. With
`dg-state`, each click is a picture of its own, and what two pictures share by
name moves from one place to the other. Where the eight scenes above are eight
fixed shapes, this is the grammar they are made of: a graph of services, a funnel,
a cycle, a grid of 400 cells with a note, lanes of traffic stopped by a switch, a
frise with a cursor, a gauge that fills and a monolith that comes apart are the
same marks arranged differently.

```html
<script type="module" src="dist/deck-diagram.js"></script>

<deck-diagram layout="layers" direction="right">
  <dg-box name="web" icon="user" label="Web"></dg-box>
  <dg-box name="gw" label="Gateway" note="one entry, one policy" emphasis></dg-box>
  <dg-box name="auth" icon="lock" label="Auth"></dg-box>
  <dg-box name="db" icon="database" label="Postgres"></dg-box>
  <dg-link from="web" to="gw"></dg-link>
  <dg-link from="gw" to="auth"></dg-link>
  <dg-link from="auth" to="db" label="SQL"></dg-link>
</deck-diagram>
```

**Marks** (data, not elements that draw · the diagram reads them):

| Mark | Draws | Attributes |
|------|-------|------------|
| `dg-box` | a labelled region: a card, a node, a step, a screen | `name`, `label`, `note`, `tag`, `icon`, `value` (a figure above the label), `paint`, `tone` (one word per click: `tone="normal danger"` turns it on the first click, once what rides into it has arrived), `size`, `emphasis` · in a story: `swap` (its label after its beat), `swap-icon`, `proof` (a check and its words, inside the box, on its beat) |
| `dg-text` | text with no surface · or, with `for="name"`, a note placed beside that mark | `name`, `label`, `note`, `for`, `side` (`top` `right` `bottom` `left`), `emphasis`, `tone` |
| `dg-dot` | a cell · `count="362"` makes 362 · in a story, one beat for them all, its cells in one wave of 0.6 s whatever the count | `name`, `count`, `emphasis`, `tone` |
| `dg-bar` | a bar as long as its `value` against the largest, label before it, tag after · on an `axis`, a point at its `value` or a stretch from `from` to `to` | `name`, `label`, `value`, `from`, `to`, `tag`, `emphasis`, `tone` (`ok` `warn` `danger` `muted` fill the bar in that tone: the step of a funnel that leaks) |
| `dg-link` | a line between two marks · `from` and `to` take names, several at once (`from="a b" to="c"`) · `flow="N"` sends N tokens along it (8 at most) | `name`, `from`, `to`, `label`, `route` (`straight` is one straight line, even in a graph the engine routes · `ortho`), `dashed`, `back`, `flow`, `speed` (`slow` `normal` `fast`) · in a story: `steady` (an established flow, `"3s"`), `turn` (a tone its tokens take on the way), `lever` (a lever at its start turns there on its beat) |
| `dg-group` | a container that places its children, with an optional surface and caption | `name`, `label`, `layout`, `direction`, `columns`, `align`, `gap`, `paint`, `tone`, `wrap`, `link` (`arrow` `line`: a row, a column or a ring chains its children, as on the root) |
| `dg-lane` | in `layout="lanes"`: a row that carries tokens · an icon in a disc, a label, a note, a track | `name`, `label`, `note`, `icon`, `flow` (tokens, default 3, 8 at most), `speed`, `tone` · in a story: `steady` (tokens pass that long before the first event, and until a gate on the lane closes) |
| `dg-gate` | in `layout="lanes"`: a bar standing across lanes · open, it lets tokens through; closed, they queue against it; shedding, one in two goes through and the others wait hollow · gates in series on one lane filter in cascade: a second shedding gate halves what the first let through | `name`, `label`, `over` (lane names, all by default), `at` (`start` `middle` `end`), `by` (the mark that drives it: the gate stands under it, a line comes down from it), `state` (`open` `closed` `shed`, one word per click from the slide's entry: `state="open closed"` closes on the first click · a gate with `step="2"` reads its list from the entry too, so write `state="open open open closed"` for open on click 2, closed on 3, `DG_STEP_WORDS_UNSEEN` says it) |
| `dg-cursor` | in `layout="axis"`: a line across the tracks at its `value`, travelling there from the start of the axis, its label past it | `name`, `label`, `value`, `tone` |
| `dg-meter` | a gauge: its label, its figure, and a track filled exactly as far as `value` goes against `max` · the fill grows on entry and from its old value on each click that changes it | `name`, `label`, `value` (one number per click: `value="40 62 85"`), `max` (default 100), `unit` (the figure reads `85 %`; without it `85 / 100`), `threshold` (a mark across the track), `tone` (one word per click: `tone="ok warn danger"`), `emphasis` |
| `dg-queue` | a row of `count` places (12 at most), `fill` of them taken from the right end, the one that leads out · places taken on a click pop in one after the other, places freed fade | `name`, `label`, `count`, `fill` (one whole number per click: `fill="0 4 8"`), `tone` (one word per click), `emphasis` |
| `dg-curve` | a series read as one shape (it grows, levels off, turns at a knee, crosses a line): its label and its last figure on one band, a plot from zero to the top of its scale, the values at equal steps joined by straight segments (never smoothed), the ground under them, traced from the first value to the last on entry · with a `threshold`, a dashed line and its figure, and a dot where the curve crosses it (in the accent when the curve is put forward) | `name`, `label`, `values` (2 to 12 numbers, the series: `values="120 140 210 610"`), `ticks` (the words under the plot, one per value or the first and the last), `max` (the top of the scale; a round number over the values without it), `unit`, `threshold`, `tone`, `emphasis` |
| `dg-state` | not a mark: a place whose content changes on a click · it holds marks (and groups) and stands from its `step` (the first of a place needs none) until the next state of the same place | `step`, `role` |
| `dg-terminal` | a terminal: a dark panel, its title in a bar, its lines in the deck's monospace · a line that starts with a prompt (`$ `, `> `, `❯ `) is typed a character at a time with its caret, the prompt in the accent; a line that starts with `✓` or `✗` comes in whole, its mark in the colour of its state; the last line is the one put forward, in its `tone` · never wraps | `name`, `label` (the title), `lines` (one line of the attribute per line typed, the indentation of the source dropped), `tone`, `emphasis` |
| `dg-table` | a panel of rows of real strings (a name, an id, an address), its icon in a disc and its label above them · in a story its rows are carried from another mark (`from`), one after the other, then change one after the other (`swap`), then the struck ones are struck · `✓` and `✗` at the head of a row are drawn in their state's colour | `name`, `label`, `icon`, `rows` (one row per line), `paint` (the surfaces that say their part, `pale` by default), `tone`, `strike` (row numbers from 1: a line through the row), `emphasis` · in a story: `from` (the table, or any mark, its rows are carried from · a struck row is not carried on), `swap` (the rows after its beat, one per line, as many as `rows`) |
| `dg-switch` | a switch: its label, a track with its knob, the word of its state · `on` green, `off` in the accent (the control engaged) · on a click, or on its beat in a story, the knob slides, the track turns, the word changes | `name`, `label`, `state` (`on` `off`, one word per click, before and after its beat in a story), `on` and `off` (the words of each state, `on` and `off` by default: `on="MARCHE" off="STOP"`), `emphasis` |
| `dg-status` | not a mark of its own place: the state of another mark, a disc beside it (✓ `ok` green, ✗ `fail` red, a clock `wait` in the accent) and a few words · placed like a note, with no line to it | `name`, `for` (the mark), `state` (one word, or two in a story: `state="wait fail"` turns on its beat, its words coming with it), `label` (a tag), `note`, `side` |
| `dg-timer` | a delay that runs: a ring that fills, a clock in it, the figure counting from 0 to its value beside it, its label under the figure | `name`, `label`, `value` (the delay: `value="5" unit="min"`), `unit`, `tone`, `emphasis` |
| `dg-band` | a band of time cut once: its label at the left, the normal time filled in its `tone` with a stroke per regular event, the void after the cut as long as it lasted (dashed, in the colour of the incident), the time after it stepped back · the word at the cut above it, a brace under the void with how long it lasted | `name`, `label`, `note`, `from`, `to` (the window, numbers: hours, days), `cut` (where it breaks), `until` (where the void ends, `to` by default), `tag` (the word at the cut: a date, a version), `brace` (the length of the void, in words), `tone`, `emphasis` · in a story: `steady` (the normal time grows for that long), and on its beat the cut, the void that grows, the brace |
| `dg-person` | people, one disc each, a caption above them · the last `absent` are hollow, dashed: missing | `name`, `label`, `count` (1 to 12), `absent` (how many are missing · two numbers in a story, before and after its beat: `absent="0 3"`), `tone` (`accent` puts them in the accent), `emphasis` |
| `dg-screen` | a page in a browser frame: a bar with three dots and its address, a heading, and grey lines that figure its text (how much there is, without a word) | `name`, `label` (the address), `note` (the heading of the page), `count` (figured lines, 1 to 10, 5 by default), `emphasis` |
| `dg-counter` | a large figure that counts, eased, from `from` to its `value`, its label under it · the grouping and the decimal sign of the value as written are kept | `name`, `label`, `value` (the figure: `15 000`, `2,5`), `from` (0 by default), `unit`, `tone`, `emphasis` |
| `dg-pie` | parts of a whole: a ring (a donut), its parts in proportion from the top, clockwise, the part brought forward in the accent and the others in shades of the ink, darkest first · a legend at its right, each part with its swatch, its words and its figure · the figure of the whole in its hole, its note under it · on its beat (or its entrance) the ring is swept part after part over a faint whole, each legend row coming with its part, the figure of the whole last | `name`, `label` (a title above), `slices` (2 to 6 parts, one per line, its words then its figure: `3 grands comptes 62`), `unit` (after each figure), `value` (the figure in the hole: `62 %`), `note` (under it), `focus` (the words of the part brought forward), `emphasis` |
| `dg-columns` | things compared side by side: columns on one baseline and one scale, rounded at the top · in one series every column says its figure above it when there is room (else a scale at the left says them); in two or three series a legend names them, each in a shade of the ink (the last series the darkest), a scale at the left, and only the column brought forward says its figures · the bar brought forward is the only one in the accent (in several series, the last series of its column), the others stepped back · a `threshold` is a dashed line across the plot, its figure at its right · on its beat (or its entrance) the columns grow one after the other from the baseline, each figure coming as its column reaches it | `name`, `label` (a title above), `columns` (2 to 12, one per line, its words then one figure per series: `T3 38 79`), `series` (1 to 3 names, one per line), `max` (the top of the scale; a round number over the figures without it), `unit`, `threshold`, `focus` (the words of the column brought forward), `emphasis` |
| `dg-waterfall` | how one total became the next: a first total standing on the baseline, steps up (in the sound colour) and down (in the incident colour) floating from the level the walk had reached, a closing total in the ink · a dotted line carries the level from one bar to the next · a total says its figure, a step only when it is brought forward or when every step has room · the step brought forward is the one in the accent · on its beat (or its entrance) the steps are taken one after the other, a step down falling from where the walk was | `name`, `label` (a title above), `steps` (2 to 11, one per line, its words then its figure: the first a total written with no sign, `Marge 2025 120`, then `Remises −18`, `Nouveaux clients +45`), `total` (the words of the closing total, whose figure is computed from the walk; with none, no closing bar), `unit`, `focus` (the words of the step brought forward), `emphasis` |
| `dg-panel` | in a composition (`compose` on the root): a sub-picture on a surface that says its part, its caption at its top, its marks laid out by its own layout and named in it (`panel.mark` from outside) | `name` (required), `label`, `layout`, `direction`, `columns`, `align`, `gap`, `paint` (`pale` by default), `tone`, `link`, `wrap` |
| `dg-camera` | not a mark: in a story, the frame the picture opens on and where it moves on its beat · its scale and margin computed | `name`, `focus` (a mark or a panel), `zoom-from` (`slide-id/mark`: opens on the frame the slide before showed that mark in, see *Motifs of a deck*), `to` (another, or `all`, the default), `beat`, `after`, `with`, `duration` |

Every mark also reads the **motion** words: `enter` (`fade` `rise` `pop` `draw`),
`after` (a `name`) and `step` (a click, 1 to 9) · see *Motion* below · and `role`,
the part it plays when the diagram is written as an intent (see *Written as an
intent* below). In a story (`play="enter"`, see *A story played on entry* below)
every mark also reads `beat`, `with`, `duration` and `dim`; in a composition
(`compose`, see *Several pictures in one* below) `entity`, the business object it stands
for across the panels. A meter and a
queue are linked and annotated like any mark (`name`, `link="arrow"`, `dg-text for=`),
and so are the marks that tell a story in their own words (`dg-terminal` to
`dg-counter`) and the charts (`dg-pie`, `dg-columns`, `dg-waterfall`), which are
placed with no coordinate like the others. In `slices`, `columns` and `steps` the
figures of a line are the numbers at its end, written without a space inside them
(`1240`, `72,5`, and in a waterfall `+12` or `−8`): the words before them may hold
numbers of their own (`3 grands comptes 62`, `Marge 2025 120`).

**Layouts** (on the root and on every `dg-group`, `layout="…"`):

| Layout | Places children | Notes |
|--------|-----------------|-------|
| `row` (default) | left to right, wrapping onto lines when they do not fit | `align` (`start` `center` `end` `stretch`), `gap` |
| `column` | top to bottom · a column of `dg-bar` is a chart in rows | |
| `grid` | `dg-dot` cells in a uniform grid of exactly `columns` columns (automatic by default); boxes in rows of `columns` | at most 400 cells |
| `layers` | a graph: ranks from the `dg-link` marks, ordered to reduce crossings, links routed between ranks | `direction="right"` or `"down"` · 12 boxes and 24 links at most · `back` on a link returns round the outside |
| `ring` | 3 to 8 children on a circle, first at the top, clockwise · a `dg-queue` or `dg-meter` in it stands in its middle (what the loop fills), or under the ring when the middle would make it taller than a slide | `link="arrow"` closes the loop |
| `lanes` | `dg-lane` rows one under the other on tracks that start and end together, `dg-gate` bars across them, every other child stacked at the right where the lanes run (an arrow at the end of each track) | a track keeps room for the longest queue before a gate and for the tokens past it · `gap` sets the space between lanes · the whole drawing, or in a column, the tracks run across the room; beside other marks in a row they take their natural length (640 units, more for gates in series), the same in every `dg-state` |
| `axis` | `dg-bar` marks on one scale from the smallest value to the largest: points share one line, their labels taking turns above and below; stretches (`from` `to`) take a track each, unless they lie end to end, each starting where the one before ends: then they are the parts of a whole, one thicker band cut into them; `dg-cursor` across them | `direction="down"` runs it top to bottom · labels never overlap: they move out a row |

`link="arrow"` (or `"line"`) on a row, a column or a ring, the root or a `dg-group`,
chains its children with a link each, so a sequence needs no `dg-link`. A `dg-link`
may join marks of two different groups: written on the root, it is routed between
them, straight down when one stands above the other. A link between two boxes of a
row with another between them goes round it, above (under when above is taken);
one that still runs under a mark that is not one of its ends (`route="straight"`)
is `DG_LINK_CROSSES`. A link's label sits above its line, else under it, else beside
a vertical run, on the first place clear of every mark, painted over the marks; a
row or a column widens its gaps for the labels between neighbours, and a label with
no free place is `DG_LABEL_BLOCKED` (`fix.holds`: the characters its line holds).
A note asked `side="top"` of a mark at the top of the drawing stands above it, the
drawing moved down to hold it. Figures printed from a number (a gauge's value and
maximum, a curve's last value and its line) take the decimal sign of the deck's
`lang`: `0.2` reads `0,2` in a French deck.

**Size.** A drawing that leaves most of its room empty is drawn larger, 1.5 times at
most. A drawing that spreads across its whole width (an axis, lanes, a graph whose
ranks spread) and is short is laid out narrower first, so its height sets how large
it is drawn: the same picture, larger, its height kept under 80 % of the room (a
title on two lines takes about 80 units). A graph whose links carry labels keeps its
width, so the labels keep the run they sit on. A gate's word goes under a gate that
stands on the last lanes only, so it never sits on the lane above; a cursor's word
goes just under the tracks, or just above them when a label is there and none
above, or under them moved aside to the nearest free place, else under every
label · and its line never runs into a label on the way (a cursor in a small part,
beside its neighbour's label, stops short of it).

**Motion.** Told in words, timed by the diagram. `enter` says how a mark comes
in (`draw` traces a line, grows a bar or a box, drops a gate, makes a cursor
travel; each kind has its default). `after="name"` starts it once everything of
that name has moved, its tokens included, so a chain of `after` is a sequence.
`step="N"` brings it on click N: the diagram raises its slide's `data-steps` to
the clicks it needs, and what follows a mark (`after`) comes on its click. Lanes
play a run of tokens when they appear and again on each click that changes a
gate on them; a gate drops again when its state changes. Tokens on a link with
`enter="draw"` trace the line on its `step`; on any other link the line is drawn
on entry and only the tokens wait for `step` and `after`. Each click moves for
2.8 s at most (under the 3 s of `ILL_MOTION_LONG`): a longer one is played
faster and reported as `DG_MOTION_BUDGET`; a scene that needs longer is a story
(below). There is no endless loop. In the
overview, presenter preview, print, PDF and a render without `--steps`, the
drawing shows its last click at rest; under `prefers-reduced-motion` each click
shows its picture with no movement. A layout keeps its place for what comes
later, so `rikiki check --steps` judges the balance of every click.

```html
<deck-diagram layout="column" align="start">
  <dg-group layout="row" gap="airy">
    <dg-box name="essai" icon="flag" label="essai réel" note="bascule STOP" paint="none"></dg-box>
    <dg-box name="db" icon="database" label="DB 2 · MARCHE" paint="outline"></dg-box>
    <dg-box name="lit" icon="code" label="is_active()" note="le seul code qui lit le STOP" paint="outline"></dg-box>
    <dg-link from="essai" to="db" label="écrit"></dg-link>
    <dg-link from="lit" to="db" label="lu"></dg-link>
  </dg-group>
  <dg-group layout="lanes" gap="tight">
    <dg-lane name="api" icon="cloud" label="API"></dg-lane>
    <dg-lane name="tache" icon="clock" label="tâche"></dg-lane>
    <dg-lane name="service" icon="database" label="service"></dg-lane>
    <dg-gate name="stop" by="lit" state="open closed"></dg-gate>
    <dg-box name="acme" icon="target" label="ACME" paint="outline"></dg-box>
    <dg-text for="stop" side="bottom" label="STOP · plus rien ne passe" step="1"></dg-text>
  </dg-group>
</deck-diagram>
```

On entry the tokens run through the open gate into ACME; on the click the gate
drops and the next tokens queue against it.

**A picture per click (`dg-state`).** Siblings that are `dg-state` hold the
content of one place on successive clicks: the state whose `step` was reached last
stands there, the others are not drawn. Marks outside the states are in every
picture. The diagram lays out each click's picture on its own, and on the click a
mark **with the same `name`** in both pictures (or the very mark written once,
outside the states) moves and resizes from its old place to its new one; its words,
when they changed, fade in as it moves. Matching is one to one, by name: a merge or
a split is marks leaving and one coming, never guessed. A click plays in three
phases that never overlap, so no line is seen crossing a moving box: what only the
old picture has fades out, its marks and its links, then what stays moves, then
what is new comes in and new links are traced (a link drawn the same in both
pictures simply stays). Every picture is centred in one
frame they share, so the drawing does not jump from click to click; a bar chart
that changes keeps one scale on every click. A click moves for 2.8 s at most;
over seven marks moving at once is `DG_MORPH_CROWD`. `applyStep(k)` lands on the
picture of click `k` whatever came before; at rest (overview, print, PDF, render)
the diagram shows the last picture; under reduced motion each click switches to
its picture with no movement. Inside a diagram with states, gates and tokens play
on entry; a click is a change of picture.

```html
<deck-diagram>
  <dg-state>
    <dg-group layout="column" gap="airy">
      <dg-group name="bloc" label="un seul déploiement" paint="outline" layout="row" gap="tight">
        <dg-box name="commandes" icon="document" label="Commandes"></dg-box>
        <dg-box name="paiement" icon="lock" label="Paiement"></dg-box>
        <dg-box name="comptes" icon="user" label="Comptes"></dg-box>
      </dg-group>
      <dg-box name="base" icon="database" label="une base pour tout"></dg-box>
      <dg-link from="bloc" to="base"></dg-link>
    </dg-group>
  </dg-state>
  <dg-state step="1">
    <dg-group layout="layers" direction="down">
      <dg-box name="passerelle" icon="cloud" label="Passerelle" emphasis></dg-box>
      <dg-box name="commandes" icon="document" label="Commandes"></dg-box>
      <dg-box name="paiement" icon="lock" label="Paiement"></dg-box>
      <dg-box name="comptes" icon="user" label="Comptes"></dg-box>
      <dg-link from="passerelle" to="commandes paiement comptes"></dg-link>
    </dg-group>
  </dg-state>
</deck-diagram>
```

On the click the frame and the shared base fade, the three services move from the
row of the monolith to the row under the gateway, then the gateway comes in and its
three links are traced.

A gauge that saturates and a queue that fills need no state · their value is one
word per click:

```html
<deck-diagram layout="row" link="arrow">
  <dg-box name="arrivees" icon="team" label="Arrivées" note="6 par heure"></dg-box>
  <dg-queue name="file" label="en attente" count="8" fill="0 4 8" tone="normal warn danger"></dg-queue>
  <dg-box name="revue" icon="search" label="Revue" note="2 par heure" emphasis></dg-box>
</deck-diagram>
<deck-diagram layout="column" align="stretch">
  <dg-meter name="disque" label="Disque · alerte à 80 %" value="40 62 85" unit="%" threshold="80" tone="ok warn danger"></dg-meter>
</deck-diagram>
```

A series that is the point · a value per step, a knee, a line crossed · is a curve.
It reads the values, never a coordinate, and is traced from the first to the last:

```html
<deck-diagram>
  <dg-curve name="latence" label="Latence selon la charge" values="120 125 130 140 160 210 330 610" max="800" unit="ms" threshold="300" ticks="10% 20% 30% 40% 50% 60% 70% 80%" emphasis></dg-curve>
</deck-diagram>
```

There is no lens mark: to zoom on a part, give the part a `name` and draw it again,
larger, in a second `dg-state` · on the click it moves and grows from its place in
the whole.

**A story played on entry (`play="enter"`).** Clicks cut a story into pictures; an
incident or a remedy is told in time. With `play="enter"` the diagram plays one scene
when its slide is entered, and the slide takes no click: the system runs (an
established flow), an event lands, it spreads, its effect shows, and the proof comes
last, in the target. A mark says **when** with `beat` (`steady` `event` `spread`
`effect` `proof`); **what** it does is its own attributes: a gate's `state="open
closed"` and a box's `tone="normal warn"` read as before and after the beat, `swap`
and `swap-icon` change a box's label and icon, `proof="…"` draws a check and its words
inside the box, `dim` pales the mark, a link's `flow` rides it. A mark with a beat and
nothing that changes comes in on its beat (a group brings its marks, the links and
notes that join a mark come in with it). One beat per mark; inside a beat, marks play
in source order, one after the other, `after="name"` waits for that mark to end,
`with="name"` starts with it (one beat, played together), `duration="2s"` gives a mark
its own time. `steady="3s"` on a `dg-lane` or a `dg-link` is the established flow:
tokens leave every 0.75 s for that long before the first event. A lane's flow runs
on until a gate on it closes, and only the tokens that reach the gate before it does
leave; its `flow` then queues against the gate and what lies past the gate pales. A
link's flow stops at the first event, at its own beat when it is cut (`dim`), or runs
on while a link it feeds carries the flow (a link with `steady`, a `beat` and no
`flow` starts on its beat); a link fed by another takes its tokens as they arrive.
`turn` gives a link's tokens a tone on the way; `lever` draws a lever at a link's
start that turns, on its beat, from the link of the same start that is cut, both
leaving from one pivot.

The story is written six to ten seconds long and **played at the pace of the room**:
`clamp(written / 6.5 s, 1, 2)` times faster (the normalisation of a talk's player),
never so fast that two beats come within half a second. Its `budget` on the root is
what it may last once played (`"10s"` by default, `"12s"` at most); past it the story
is played faster and `DG_MOTION_BUDGET` says so. Its tokens count: 12 a lane at most,
40 in all (`DG_TOKENS_MANY`). The script is deterministic, published on the drawing
as `data-story` (written and played length, rate, the established flow, each beat
with its time) and judged by `rikiki check` (`ILL_NO_STEADY_STATE`,
`ILL_STORY_NO_PROOF`, `ILL_FINAL_INCOMPLETE`, `ILL_BEAT_OVERLAP`, and the motion rules
against its budget). While it plays, Pause, Replay and Loop buttons show at the
drawing's corner when the pointer reaches it (never in print or under reduced
motion); the element's `seek(seconds)` holds every animation at one instant, for a
test or a capture. **The picture at rest is the end of the story**: overview, print,
PDF, `rikiki render` (which brings a story to its end before the picture) and reduced
motion show it, so it must tell the story alone. A story reads no click: a `step` is
dropped; with `dg-state` or an `intent`, `play` is dropped and the clicks play
(`DG_STORY_ATTR`, which also names a story attribute written on a diagram of clicks).

```html
<deck-diagram play="enter" layout="column" align="start">
  <dg-group layout="row" gap="airy">
    <dg-box name="essai" icon="flag" label="essai réel" note="mardi 14:02" paint="ok"></dg-box>
    <dg-box name="drapeau" icon="database" label="DB 2 · MARCHE" swap="DB 2 · STOP" swap-icon="ban" paint="pale" tone="normal warn" beat="event" after="ecrit"></dg-box>
    <dg-box name="lit" icon="code" label="is_active()" note="seul lecteur du STOP" paint="ink"></dg-box>
    <dg-link name="ecrit" from="essai" to="drapeau" label="écrit" flow="1" beat="event"></dg-link>
    <dg-link name="lu" from="drapeau" to="lit" label="lu" flow="1" beat="spread"></dg-link>
  </dg-group>
  <dg-group layout="lanes" gap="tight">
    <dg-lane name="api" icon="cloud" label="API" note="POST /devis" steady="3s"></dg-lane>
    <dg-lane name="tache" icon="clock" label="tâche" note="relance 15 min" steady="3s"></dg-lane>
    <dg-gate name="stop" by="lit" state="open closed" beat="spread" after="lu"></dg-gate>
    <dg-box name="acme" icon="target" label="ACME · prod" paint="pale" proof="0 devis créé" beat="proof"></dg-box>
  </dg-group>
</deck-diagram>
```

The traffic runs for three seconds through the open gate; the test writes STOP (the
box turns gold, its word and icon change), the one reader reads it, the gate drops,
the next tokens stop against it, what lies past it pales, and ACME shows "0 devis
créé". The same grammar tells a blue/green switch (a lever that turns, the traffic
following), an incident frise (stretches end to end, the gap growing for as long as
the time it stands for) or a race for a lock (`with` starts both, `turn` reddens the
loser's token, `dim` and `swap` say it does nothing).

**The marks that tell a story in their own words** act on their beat: a terminal types
its lines (a command a character at a time, a result whole), a table carries its rows
from another mark then changes them one by one then strikes, a switch turns, a status
turns (its words come with it), a timer fills its ring and counts its delay, a counter
counts, a band is cut and its void grows then is braced, people go missing one after
the other. With no beat they stand from the start as at rest; on clicks they come in
already done (a switch still turns on its click). The act of a mark of the `steady`
beat (a terminal typing what runs) keeps the system running until it ends; a band's
`steady` is its normal time growing. What only these marks say wrong is said:
`DG_MARK_EMPTY`, `DG_TYPED_WIDE`, `DG_ROWS_MISMATCH`, `DG_STATUS_NO_TARGET`,
`DG_BAND_NO_CUT`, `DG_TIMER_NO_VALUE` (table below). A terminal and its consequence:

```html
<deck-diagram play="enter" layout="row" link="arrow" gap="airy">
  <dg-terminal name="claude" label="claude · ~/rodz" beat="steady" lines="
    $ git push prod main
    ✓ tests : 312 passent
    ✓ envoyé en production
    Terminé. Autre chose ?"></dg-terminal>
  <dg-screen name="page" label="app.rodz.io/signaux" note="Signaux du jour" count="4"></dg-screen>
  <dg-person name="clients" label="clients en ligne" count="4" absent="0 3" beat="spread"></dg-person>
  <dg-status for="page" state="ok fail" label="14:02 · page blanche" note="erreur 500" side="bottom" beat="event"></dg-status>
  <dg-text for="page" side="top" label="Claude n'a pas vu la page" beat="proof"></dg-text>
</deck-diagram>
```

Six models of a talk are told this way, each with two of these marks at least: a
terminal and its consequence, a probe that fails, an incident frise, records through a
filter, an escalation with a timer, a switch with a lever.

**Several pictures in one: a composition of panels.** `compose` on the root lays out
sub-pictures under one story (or one series of clicks), each a `dg-panel` that holds its
marks and groups directly: `split` (a mechanism beside its track, 1.65 to 1),
`model-incident` (two views as wide as each other), `body-axis` (the body in a row, the
panel with `layout="axis"` at its foot across the room), `inset` (one panel as wide as
the room, a panel inside it) and `dashboard` (four widgets two by two). A panel reads
`name`, `label` (its caption), `layout` and the attributes of a group, and `paint`, the
part its surface plays (`pale` by default; on `ink` what has no surface of its own is
set in the light ink, and the tints of the parts are mixed over white). Panels of a row
are as tall as each other, what they hold is centred in them, a panel is never narrower
than the least it holds its marks in, and a note stays in the panel of its mark.

- **Names are local**: `name="lecteur"` in the panel `modele` is `modele.lecteur`; a
  reference written in the panel finds it by `lecteur`, from outside by the qualified
  name. A panel's own name is global.
- **Panels are joined, or refused** (`DG_PANEL_APART`, an error): the same business
  object in two panels says `entity="…"` on each mark (one or more words), or the panels
  share an axis · a `dg-meter`, `dg-curve`, `dg-timer` or `dg-counter` of the same `unit`
  over ranges that meet. A panel inside another one is joined to it.
- At the root stand panels and cameras only; `compose` and `intent` are exclusive
  (`DG_PANEL_INTENT`: the intent is neither drawn nor proved); a `layout` on the root is
  dropped and said. A panel's `beat` brings it in with what it holds, as one beat.

**A camera.** `dg-camera` draws nothing: the story opens framed on a mark or a panel
(`focus`), and on its `beat` (with `after`, `with`, `duration`) the camera moves to
another (`to`) or to the whole composition (`all`, by default); each later camera starts
where the one before ended. The camera computes its scale (as close as the frame allows,
2.6 times at most, never smaller than the whole) and its margin, stays inside the
picture, keeps the caption of the scope it shows whole and slides off the one around it.
A camera that ends on a detail goes back to the whole picture once the story is told:
print, PDF, the overview, reduced motion and the picture at rest show the whole
composition. A camera on a diagram of clicks is dropped (`DG_CAMERA_STORY`).

```html
<deck-diagram play="enter" compose="inset">
  <dg-panel name="prod" label="production · 25 000 contacts" paint="ink" layout="row" gap="airy">
    <dg-panel name="jeu" label="jeu de test · 3 sur 3" paint="ok" layout="column">
      <dg-table name="cas" paint="ok" beat="steady" rows="
        CEO
        DRH" swap="
        ✓ CEO
        ✓ DRH"></dg-table>
    </dg-panel>
    <dg-table name="reels" label="intitulés réels" icon="database" paint="pale" beat="spread" rows="
      CEO | fournisseur
      销售总监"></dg-table>
    <dg-box name="verdict" icon="spark" label="« CEO de lemlist ? »" paint="bad" beat="effect"></dg-box>
    <dg-link from="reels" to="verdict" flow="2" turn="danger" beat="effect" with="verdict"></dg-link>
  </dg-panel>
  <dg-camera name="recul" focus="jeu" to="all" beat="event"></dg-camera>
</deck-diagram>
```

**Motifs of a deck.** A talk ties its illustrations together, and three attributes
say how, without a coordinate:

- `acts="terminal · code · environnement · exploitation · client"` and `act="code"`
  on the root draw, above the picture, the strip of the act: the steps behind full,
  the step the slide is at in bold and circled by the accent, the steps ahead as rings,
  each named under its station. 2 to 7 steps separated by `·`, written the same on
  every slide of the act. The strip takes its height off the drawing's room, is never
  framed by a camera, and is not judged as an illustration (`svg[data-act]`, its words
  measured like any). `DG_VALUE_INVALID` for an `act` that is none of the steps, an
  `act` with no `acts`, a strip of one step or of eight.
- `pair="remedy-slide-id"` on an incident's root names the slide of its remedy, which
  comes after it and keeps at least half of the incident's named marks.
- `zoom-from="slide-id/mark"` (in a panel `slide-id/panel.mark`) on the first
  `dg-camera` of a story, instead of `focus`: when the deck arrives from that slide,
  the picture opens with the mark both slides draw where and as large as the slide
  before showed it (at most 4 times closer), the mark already there, then the camera
  moves on its beat; arrived any other way, it opens framed on its own mark. Reduced
  motion, print and PDF show the whole picture.

A diagram says these on its svg (`data-motif`: its named marks, its act, its pair,
its zoom-from), and `rikiki check` says what the deck declares wrong, always:
`ILL_PAIR_TARGET`, `ILL_PAIR_MARKS`, `ILL_ZOOM_FROM_TARGET`, `ILL_ACT_DRIFT` (see
*Illustration rules*). An incident and its remedy look alike by design: as a motif
that moves on, the pair is no `ILL_REPEATED_LOOK`.

**What is written, and what is not.** The author writes marks, names, labels,
figures and which layout. Positions, sizes, colours, spacing, type sizes, line
breaks, link routes and the order things appear in are computed. The
treatments that are the author's are a closed list: `paint` (`none` `outline`
`soft` `solid` `inverse`, or the part a surface plays: `pale` the context, `gold` the
control, `ink` the target, `ok` what is sound, `bad` the incident · each a panel with
more room inside and tighter corners, its icon in a disc of its state beside its
words, and its `tone` read as that state: `ok`, `warn` → gold, `danger` → bad, `muted`
→ pale; the disc says a state and is never counted as the thing put forward), `tone` (`normal` `muted` `accent` `ok` `warn` `danger`),
`size` (`small` is set as a note, `normal` as a label, `large` as a figure), `gap`
(`tight` `normal` `airy`), and `emphasis`, one mark put forward in the accent.
Two diagrams with the same structure differ by these, and two with different
layouts differ in shape.

**Bounds.** `bounds="800x500"` is the room the diagram is given, in drawing units
(default: the width of the scene and 600 high); `max-marks="12"` tightens the
ceiling of 500 marks (it cannot lift it; one that is no whole number of 1 or more
is `DG_VALUE_INVALID`, and the 500 hold). The diagram never removes a mark,
shortens a text or sets type below its scale · save the cells of a `dg-dot` past
that budget: a grid draws its first 400 (or `max-marks`) and `DG_BUDGET` says so. When the marks do not fit, it tries
tighter spacing, then another direction for a graph, and if nothing fits it
**draws them anyway** and reports `DG_NO_FIT` with `fix: { action: "remove-marks",
keep: N }`, the number of marks that would fit.

**The title costs height.** The 600 units are what a diagram plans for under a
title of **one line** (the slide clips past about 620): keep the title of an illustrated slide to about 36 characters
(fewer in wide letters, `m`, `w`, `q`), or it wraps and takes about 80 units the
drawing then lacks (`CONTENT_CLIPPED`, `SCENE_TOO_TALL`). Render the slide to see
it.

| Code | Severity | Means |
|------|----------|-------|
| `DG_NO_FIT` | error | the marks do not fit the room · drawn anyway past it · `fix.keep` is how many would fit |
| `DG_REF_UNKNOWN` | error | a `dg-link`, a `dg-text for=`, a `dg-status for=` or a `dg-table from=` names a mark that has no such `name` |
| `DG_NAME_DUPLICATE` | error | two marks share a `name` |
| `DG_CHILD_UNKNOWN` | error | a child that is not a mark is in the diagram · not drawn |
| `DG_VALUE_INVALID` | error | a `layout`, `paint`, `tone`, `size`, `gap`, `side`, `enter`, `speed`, `at`, `state`, `play`, `beat` or `turn` word outside its list, a `duration`, `steady` or `budget` that is not a duration from 0 to 12 s, a `step` that is not a click from 1 to 9, a `flow` that is not a whole number, or a bar's `value` / `from` / `to`, a cursor's `value`, a dot's `count`, a meter's `value` / `max` / `threshold`, a curve's `values` / `max` / `threshold`, a queue's `count` / `fill`, a timer's or a counter's `value`, a band's `from` / `to` / `cut` / `until` or a table's `strike` that is not a number (a box's `value` is a figure printed as written) · a switch's `state` other than `on` `off`, a status's other than `ok` `fail` `wait` |
| `DG_VALUE_RANGE` | error | a meter's `value` or `threshold` outside 0 to `max`, a curve's value or `threshold` under 0 or past its `max`, a queue's `count` outside 1 to 12 or its `fill` outside 0 to `count`, people's `count` outside 1 to 12 or `absent` outside 0 to `count`, a screen's `count` outside 1 to 10, a column's figure above the `max` written or a `threshold` outside 0 to it · drawn at the nearest bound, which is not what was written |
| `DG_CURVE_POINTS` | error | a curve with fewer than 2 or more than 12 values, or `ticks` that are neither one per value nor the first and the last |
| `DG_STATE_STEP` | error | two `dg-state` of one place stand from the same click · only the first is ever shown |
| `DG_BUDGET` | error | more than 500 marks (or `max-marks`), or more than 400 dots · a grid draws its first 400 dots (or `max-marks`), not the others |
| `DG_DEPTH` | error | groups nested more than three deep (a panel is a sub-picture: its groups count from it), or panels nested more than four deep |
| `DG_EMPTY` | error | a diagram with no mark |
| `DG_MARK_PLACE` | error | a `dg-lane` or a `dg-gate` outside a `layout="lanes"` group, a `dg-cursor` outside an `axis` · drawn as its label alone |
| `DG_GATE_LANE_UNKNOWN` | error | a gate's `over` names a lane its group does not have |
| `DG_TOKENS_MANY` | error | a `flow` over 8 · 8 are drawn · in a story, a lane or a link carrying more than 12 tokens (its established flow and its queue), or more than 40 in all |
| `DG_MOTION_CYCLE` | error | marks that wait for each other through `after` · they come in reading order |
| `DG_ATTR_UNKNOWN` | warning | an attribute the mark does not read · dropped |
| `DG_EMPHASIS_MANY` | warning | more than one mark has `emphasis` |
| `DG_MOTION_BUDGET` | warning | a click moves for more than 2.8 s · played faster to fit · `fix.use` says to put what can wait on a `step` · a story that would last past its `budget` at the pace of the room · played faster to fit, `fix.use` fewer beats or a shorter steady |
| `DG_STORY_ATTR` | warning | a story attribute (`beat`, `with`, `duration`, `swap`, `swap-icon`, `proof`, `dim`, `steady`, `turn`, `lever`) on a diagram that plays on clicks · dropped · or a `step` in a story, which has no click · or `play="enter"` with `dg-state` or an `intent`, whose clicks play instead |
| `DG_MORPH_CROWD` | warning | more than seven marks change place on one click of a diagram with states · the eye follows a few, the rest is a shuffle · split it over a state more |
| `DG_STEP_WORDS_UNSEEN` | warning | a mark that appears on click N (its `step`, or the `dg-state` that holds it) reads its per-click list (`state`, `value`, `fill`, `tone`) from the slide's entry, so its first words are never seen · `fix.write` is the list that shows them from click N (the first word repeated N times) |
| `DG_LINK_CROSSES` | warning | a link still runs under a mark that is not one of its ends (a `route="straight"` across a row) · the mark is painted over it · `fix.crosses` names the marks |
| `DG_LABEL_BLOCKED` | warning | a link's label finds no place beside its line clear of the marks and is drawn on one (`ILL_TEXT_OVER_SHAPE` then says which) · `fix.holds` is how many of its characters the line holds, `fix.or` a wider gap or a `dg-text` beside an end |
| `DG_MARK_EMPTY` | error | a `dg-terminal` with no `lines`, a `dg-table` with no `rows`, a `dg-counter` with no `value` · it says nothing |
| `DG_TYPED_WIDE` | error | a terminal line over 56 characters · a terminal never wraps, so it is drawn wider than a slide holds one · `fix.holds`, or split the line |
| `DG_ROWS_MISMATCH` | error | a table's `swap` that does not have one line per row, or a `strike` that names no row |
| `DG_STATUS_NO_TARGET` | error | a `dg-status` with no `for` · not drawn (a `for` that names no mark is `DG_REF_UNKNOWN`) |
| `DG_BAND_NO_CUT` | error | a `dg-band` whose `from < cut < until ≤ to` does not hold · without a cut it is a bar: a `dg-bar` on an axis says it |
| `DG_TIMER_NO_VALUE` | error | a `dg-timer` with no delay above 0 in its `value` |
| `DG_CHART_DATA` | error | a chart that does not read: a `dg-pie` of fewer than 2 or more than 6 parts, a part with no words, not one figure, or 0 · `dg-columns` of fewer than 2 or more than 12 columns, a column without one figure per series, more than 3 series · a `dg-waterfall` of fewer than 2 or more than 11 steps, a first step written with a sign, a walk that falls below 0 · a `focus` that names none of its parts, columns or steps · drawn as written · `fix.or` gathers the smallest parts as "Autres" (a figure above `max`, or a `threshold` outside it, is `DG_VALUE_RANGE`) |
| `DG_PANEL_APART` | error | panels of a composition that share no `entity` and no axis (one `unit` over ranges that meet) · two slides in one frame · `fix.use` says how to join them |
| `DG_PANEL_PLACE` | error | a panel with no `name`, the wrong number of panels for the `compose`, a `body-axis` with no axis panel, an `inset` with no panel inside, a mark at the root of a composition (not drawn), a `dg-panel` outside a composition (drawn as a group) · a warning for a `layout` on the root (dropped) or an `entity` outside a composition |
| `DG_PANEL_INTENT` | error | `intent` beside `compose` · the panels are drawn, the intent is neither drawn nor proved |
| `DG_CAMERA_TARGET` | error | a camera's `focus` or `to` names a mark with no place on the picture (a link, a note) · the whole picture is shown · a warning for a `focus` on a camera after the first, not read |
| `DG_CAMERA_ILLEGIBLE` | error | through one of the camera's frames the smallest text would be under the scale the back of the room reads |
| `DG_CAMERA_STORY` | warning | a `dg-camera` in a diagram that plays on clicks · dropped |

Names, references, `emphasis` and the budget are checked **per picture** in a
diagram with states: two states may show the same `name`, one picture never twice.

`rikiki check` reads these off the diagram, with the `fix` it gives, beside the
illustration rules (`ILL_*`) that judge the drawing as painted. The diagram draws
every mark under `data-mark` (its `name`, else its `label`) and `data-kind`, a note
under `data-for` too, so an `ILL_*` finding on it names the marks concerned and
the attribute to change, tried on the ink first (`fix.pulls`, `fix.try`).

**Written as an intent.** Instead of a layout, the root says what the picture
demonstrates (`intent`), and each mark the part it plays (`role`). The intent
chooses the layout, the treatment (the one thing put forward, and quieter
neighbours) and the motion (what comes in first, what waits for which click); the
author writes no layout, no coordinate, no duration. `npx rikiki intent
"<sentence>"` prints the skeleton of the closest intent, `npx rikiki intent <name>`
the skeleton of one, `npx rikiki intent --list` the sixteen intents of the grammar,
each with what it demonstrates and what it looks like. Each compiles to a structure
of its own, so two slides with different intents never look alike.

**Or filled from a recipe.** When the slide tells a story rather than a relation, `npx rikiki recipe "<sentence>"` prints the closest of
twelve recipes: `incident-band` (M15), `lanes-gate` (M22), `probe-stations` (M16),
`wiring` (M17), `switch-over` (M21), `race-lock` (M23), `filter-records` (M19),
`version-lanes` (M20), `escalation-runbook` (M24), `pulse-threshold` (M25),
`scope-rings` (M14), `data-replay` (M3). A recipe is a skeleton played on entry whose
`{{fields}}` are the facts of a brief and whose beats are the sequence of its model;
above it, the brief to fill, the sequence, what the check guarantees, when not to
use it and its pitfalls. Write the brief first (the real system, its normal pace, the
dated event, the exact cause, the consequence counted, the proof), then
`npx rikiki recipe <name> --brief > brief.json`, edit it, and
`npx rikiki recipe <name> --fill brief.json` prints the slide or refuses the brief
(exit 1) when a field is empty, generic, longer than its place holds, or when it
holds fewer than two precise values. `rikiki intent` exits `3` and names the closest
recipes when no intent fits a sentence that tells a story.

```html
<deck-diagram intent="bottleneck">
  <dg-box role="source" name="arrivals" icon="team" label="Arrivals" value="6 / h"></dg-box>
  <dg-queue role="queue" name="waiting" label="waiting"></dg-queue>
  <dg-box role="neck" name="review" icon="search" label="Review" value="2 / h"></dg-box>
  <dg-box role="sink" name="shipped" icon="check" label="Shipped"></dg-box>
</deck-diagram>
```

The rates in `value` set the picture: six tokens ride into the queue, two out of
the neck, the queue counts six places and fills four on the click (6 − 2), and the
neck is put forward. A bottleneck that says 40 and 12 keeps the proportion in
eight tokens at most.

| Intent | Demonstrates | Roles (marks · how many) | Compiles to |
|--------|--------------|--------------------------|-------------|
| `cause` | A brings about B, through a chain | `cause` box 1–3 · `via` box 0–3 · `effect` box, meter or queue 1–3 (put forward) | a row (a graph when a stage holds several), an arrow from each stage to the next traced in order on entry, each mark coming in as its arrow reaches it · your own `dg-link` between them replace the arrows it would draw |
| `barrier` | a rule stops what flows | `flow` lane 1–5 · `barrier` gate 1 (put forward by its colour) · `control` box 0–1 · `beyond` box 0–1 | a lanes group, four tokens per lane, the gate across all of them closing on the first click and standing under its `control`, the boxes around it outlined |
| `bottleneck` | one narrow point limits all that passes | `source` box 1–3, its rate in `value` · `queue` queue 1 · `neck` box 1, its rate in `value` (put forward) · `sink` box 1–2 | a row, tokens in proportion to the rates on each side of the neck on the first click, the queue filling with what does not get through |
| `accumulate` | a stock that rises (or drains) click after click | `stock` queue or meter 1, one value per click · `inflow` box 0–2 · `outflow` box 0–2 | a row, tokens riding in and out on the click the stock first changes |
| `transform` | the same parts, before and after | `before` state 1 · `after` state 1 | the after picture on the first click · parts named alike in both move |
| `feedback` | the output comes back as input | `stage` box 2–5, in order · `output` box 1 (put forward) | a ring, the arrows forward on entry, the one that brings the output back to the first stage traced on the first click with a token riding it |
| `scale` | one against many, an order of magnitude | `unit` dot 1 (put forward) · `crowd` dot 1, its `count` ten times the unit at least | one grid, the lit cell first, the crowd hollow, unfolding from it cell after cell |
| `contain` | A holds B holds C | `layer` box 2–4, from the outside in | frames inside frames (a layer's label is its caption, its note under it), outlined and soft in turn, coming in from the outside in, the innermost a mark put forward |
| `parallel` | several things at once | `branch` group 2–4, its steps inside in order · `join` box 0–1 (put forward) | outlined columns side by side, the steps of one rank coming in at one moment, the join last, every column's arrow traced into it |
| `propagate` | a change spreads, rank by rank | `origin` box 1 (put forward) · `reached` box 2–8 · your `dg-link` say who reaches whom (without them, all from the origin) | a graph to the right, everything on entry, then one rank per click: a token rides into it and its marks turn (`tone`, one word per click) |
| `threshold` | past a line, it tips over | `measure` meter 1, one value per click and its `threshold` (put forward) · `consequence` box 0–1 | the gauge above, what tips under it, outlined · on the click the value crosses the line, a token rides down once the gauge has filled, and the consequence turns |
| `tradeoff` | winning here costs there | `lever` box 1 (put forward) · `gain` meter 1, its value rising · `cost` meter 1, its value falling on the same click | the choice above, forking down into two gauges side by side, both moving on the one click, a token riding to each |
| `drift` | the gap widens with time | `reference` cursor 1, at what was planned · `measure` bar 2–5, one per period, its `value` the measured | an axis from the planned line, the gap of each period on a track of its own, traced one after the other (three on entry, then one a click), filled in ink (`tone="muted"`, their rails stepping back), the widest put forward in the accent · it says `balance="free"`, a drift leans by nature |
| `compare` | this one is larger | `subject` bar 1 (put forward) · `other` bar 1–5, in one unit | bars on one scale in the order written, the subject growing once the others have · `balance="free"` |
| `partition` | a whole split into parts that add up | `whole` box 0–1, its `value` the total · `share` bar 1 (put forward) · `part` bar 1–5 · each its `value` | the parts end to end on one band, from nothing to their sum, under the whole's caption |
| `merge` | several sources meet in one | `source` box 2–4, an amount in `value` if you say one · `into` box, meter or queue 1, their sum in `value` (put forward) | the sources in a row, straight arrows converging down into where they meet, every token riding at once on the first click, in proportion to the amounts · into a queue, the sources stand outlined in a column at its left and their lines join its tail, the end it is entered by |

**Composing.** `also` adds one or two secondary intents that share the picture. Only
three intents are ever secondaries, because only they have a region of their own:
`cause` above (the chain that drives the main one, its tokens riding on the first
click, the main one a click later), `accumulate` and `threshold` below (a stock, a
line crossed and what tips). A mark may play two roles (`role="queue stock"`,
`role="stock measure"`) and is drawn once. A secondary never puts anything forward.
A stock another intent draws (a merge's `into`, a bottleneck's `queue`, a
threshold's `measure`, a cause's `effect`) is fed by that intent's arrows: an
`inflow` or `outflow` of its own would not be drawn, and is `INT_ROLE_EXTRA`. A
cause drives a wave by its click, not by an arrow: the `effect` of the chain and
the `origin` of the wave are two marks (one mark playing both is `INT_ROLE_EXTRA`).
The chain of a cause that drives another intent still comes in from the cause on,
stage after stage.

A secondary is joined to the main intent by an arrow the intent draws: from the
chain's effect into what it drives (the origin of a wave, the gauge of a line, the
stock); from the part of the main intent that feeds a stock into it (the gate that
holds the flow back, the output of a loop, the queue of a bottleneck), its tokens
riding on the click the stock fills; from the gauge to what tips under it. A loop
keeps its stock in its middle. A barrier is joined through its gate's line (`by`).
A secondary no arrow joins to the main picture is `INT_COMPOSE_APART`.

| Main | Takes `also=` |
|------|---------------|
| `cause` | `accumulate`, `threshold` |
| `barrier` | `cause` (the gate stands under the chain's effect and closes on the second click), `accumulate` |
| `bottleneck` | `accumulate` (the queue is the stock) |
| `accumulate` | `cause`, `threshold` (the stock is the gauge whose line it crosses) |
| `threshold` | `cause`, `accumulate` |
| `feedback` | `accumulate` (the stock the loop feeds) |
| `propagate` | `cause` (what starts the wave · the wave a click later) |
| `merge` | `accumulate` (what they meet in is the stock) |
| `transform`, `scale`, `contain`, `parallel`, `tradeoff`, `drift`, `compare`, `partition` | nothing · a picture of their own: two shapes in one picture read as two pictures, split the slide |

Anything else is `INT_COMPOSE_INVALID`, and the secondary is dropped. The kill
switch, in a dozen lines:

```html
<deck-diagram intent="barrier" also="cause">
  <dg-box role="cause" name="essai" icon="flag" label="essai réel" note="bascule le STOP"></dg-box>
  <dg-box role="via" name="drapeau" icon="database" label="DB 2 · drapeau"></dg-box>
  <dg-box role="effect" name="lit" icon="code" label="is_active()" note="le seul code qui lit le STOP"></dg-box>
  <dg-link from="essai" to="drapeau" label="écrit"></dg-link>
  <dg-link from="drapeau" to="lit" label="lu"></dg-link>
  <dg-lane role="flow" name="api" icon="cloud" label="API"></dg-lane>
  <dg-lane role="flow" name="tache" icon="clock" label="tâche"></dg-lane>
  <dg-lane role="flow" name="service" icon="database" label="service"></dg-lane>
  <dg-gate role="barrier" name="stop" label="STOP"></dg-gate>
  <dg-box role="beyond" name="acme" icon="target" label="ACME"></dg-box>
</deck-diagram>
```

**Proof.** Once placed, the drawing is read back, on the layout and not on the
pixels, and every way it fails to demonstrate its intent is an `INT_*` finding
with its `measurement`, what was `expected`, the `items` and a `fix`. A defect of
meaning is an **error**: the illustration's verdict is `fail` whatever its score,
and its seventh facet, `meaning`, says by how much. The proof says the drawing
shows what was declared, not that the declaration is true of the world.

| Code | Severity | Means |
|------|----------|-------|
| `INT_ROLE_MISSING` · `INT_ROLE_EXTRA` | error | a role with fewer or more marks than its bounds · or a mark that would not be drawn: an inflow or outflow of a stock another intent draws, an origin that is also the effect of the cause |
| `INT_ROLE_NONE` · `INT_ROLE_UNKNOWN` · `INT_ROLE_KIND` | error | a mark with no role, a role no intent of the diagram has, a mark that cannot play it (a box as a lane) |
| `INT_FOCAL_MULTIPLE` · `INT_FOCAL_OFF_ROLE` | error | two marks put forward in one picture · an `emphasis` on a mark that is not the part the intent argues for |
| `INT_CAUSE_NO_ARROW` | error | no chain of arrows leads from a cause to an effect (your own links meet in the middle, or point back) |
| `INT_CAUSE_EFFECT_FIRST` | error | an effect comes in before its cause |
| `INT_BARRIER_NOT_ACROSS` | error | the gate does not stand across every `flow` lane |
| `INT_BARRIER_NEVER_CLOSES` | error | the gate's `state` is never `closed` nor `shed` |
| `INT_BOTTLENECK_NOT_NARROWEST` | error | the neck takes as much as arrives, a sink takes less than the neck, or as many tokens leave the neck as reach it |
| `INT_BOTTLENECK_NO_QUEUE` | error | the queue's last `fill` is not above its first |
| `INT_ACCUMULATE_NOT_MONOTONE` | error | the stock goes up then down, or never moves |
| `INT_TRANSFORM_NO_PAIR` · `INT_TRANSFORM_NO_CHANGE` | error | no part named alike before and after · both pictures the same |
| `INT_FEEDBACK_OPEN` | error | no chain of arrows from the output back to the first stage, or round to it · a chain, not a loop |
| `INT_SCALE_TOO_CLOSE` | error | the crowd is under ten times the unit, counted on the cells · compare them instead |
| `INT_CONTAIN_NOT_NESTED` | error | a layer drawn with no edge (`paint="none"`), or not holding the next one whole |
| `INT_PARALLEL_NOT_TOGETHER` · `INT_PARALLEL_JOIN_EARLY` | error | a branch starts on a later click or moment than another (a `step`, an `after`) · the join comes before a branch has finished |
| `INT_PROPAGATE_NOT_REACHED` · `INT_PROPAGATE_SKIPS` | error | a mark no arrow from the origin reaches, or that never turns · a mark that turns no later than what reaches it (a `tone` written on a far mark) |
| `INT_THRESHOLD_NEVER_CROSSED` · `INT_THRESHOLD_EARLY` | error | every value on one side of the line · the consequence turns or comes in before the line is crossed |
| `INT_TRADEOFF_ONE_SIDED` | error | on a click the gain does not rise while the cost falls (both one way, one alone), or nothing moves |
| `INT_DRIFT_NOT_WIDENING` | error | a gap that narrows on the way, or ends under twice its start |
| `INT_COMPARE_LIE` | error | a bar drawn more than 1.1 times longer or shorter than its value says · values too far apart for one scale (that is a `scale`) |
| `INT_PARTITION_NOT_WHOLE` | error | the parts do not add up to the whole's `value`, or do not lie end to end on one band |
| `INT_MERGE_APART` · `INT_MERGE_NOT_SUM` | error | a source with no arrow into where they meet · the sources' amounts do not add up to what they meet in |
| `INT_VALUE_MISSING` | error | a bottleneck's source or neck says no rate in `value`, a compared bar or a part says no number, a threshold's gauge has no `threshold` |
| `INT_INTENT_UNKNOWN` | error | not an intent · the diagram is drawn as written |
| `INT_COMPOSE_INVALID` · `INT_COMPOSE_MANY` | error | a secondary the main intent does not take · more than two |
| `INT_COMPOSE_APART` | error | a secondary that no arrow joins to the main picture (a stock fed by an inflow of its own beside a loop) · two pictures side by side |
| `INT_LAYOUT_FIXED` | warning | a `layout`, `direction`, `columns`, `link` or `align` on the root of an intent · dropped |
| `INT_ROLE_NO_INTENT` | warning | a `role` on a diagram with no `intent` · it does nothing |

`SCENE_TEXT_TOO_LONG` also applies: a word wider than the box it lives in names the
mark and the field. `deck-scene` accepts a `deck-diagram` as one of its regions.

**Tokens.** Every default routes to a `--rik-*` token, so a theme re-tints every
scene without scene CSS: `--deck-scene-card-bg`, `--deck-scene-card-stroke`,
`--deck-scene-emphasis-bg`, `--deck-scene-emphasis-text`, `--deck-scene-muted`,
`--deck-scene-tag`, `--deck-scene-icon`, `--deck-scene-line`; steps' band
`--deck-scene-band-bg`, `--deck-scene-band-text`, `--deck-scene-band-muted`,
`--deck-scene-band-icon`; bars' figures `--deck-scene-value`,
`--deck-scene-value-emphasis`; the matrix's emphasised row
`--deck-scene-row-emphasis-bg` (the band of every second row reuses
`--deck-scene-band-bg`); a diagram's surfaces that say a part
`--deck-scene-pale-bg` (the ink of text at 15 % over the page, seen on both themes),
`--deck-scene-gold-bg`, `--deck-scene-ok-bg`, `--deck-scene-bad-bg` (tints, so they
weigh nothing in the balance `check` measures).

---

## 21 · Comparison, chains, tables and density

Four knobs added to components that already existed, chosen over four new
elements that would have duplicated a vocabulary the project already has.

**A directed comparison** · `deck-split` takes `pivot` (a symbol or word between
the two columns) and `winner` (`left` or `right`, which rings that side in the
accent colour). A neutral split stays neutral: both are absent by default.

```html
<deck-split pivot="→" winner="right">
  <h1 slot="title">Before and after</h1>
  <deck-card slot="left"><h3>Before</h3><p>Four hours of manual review.</p></deck-card>
  <deck-card slot="right"><h3>After</h3><p>Twelve minutes, same coverage.</p></deck-card>
</deck-split>
```

**A chain across the width** · `deck-step-list direction="row"` lays the steps
side by side with a connector between them. `no-connectors` drops the rules.

**A table with a point of view** · `deck-csv` takes `highlight-rows` and
`highlight-cols` (1-based, space-separated) and `reveal`, which shows one body
row per step. Hidden rows keep their space, so the slide never jumps under the
audience. A revealing table publishes the step count it needs onto its slide.

The marked row is a dark band and the marked column takes colour and weight ·
one fill per table, never two overlapping tints. Both `deck-csv` and
`deck-table` follow the same rule, and both are measured: a fill that a room
cannot tell from the page fails the theme-contrast test. Knobs:
`--deck-csv-mark-bg`, `--deck-csv-mark-color`, `--deck-csv-mark-col-color`,
`--deck-csv-mark-col-on-mark`, `--deck-csv-header-bg`, `--deck-csv-header-rule`.

**A row of figures** · `deck-stat compact` drops the scale so three or four sit
together in a `deck-grid` and read as one family, instead of each claiming the
slide.

### Default density

`spread` and `fill` (§19) are per-slide, because density is a per-slide
judgement. When a whole deck wants a different default, set it once in the theme
rather than on every slide:

```css
:root { --rik-slide-spread: space-between; }
```

A per-slide `spread` still wins, and `spread="theme"` says "use the default"
explicitly.

---

## 22 · Recipes for things that are NOT components

Four requests deliberately answered by composition. Each is a layout problem,
not a missing element, and a component would freeze one arrangement.

**A checklist of what works and what does not**

```html
<deck-grid cols="2" gap="5">
  <deck-card color="green">
    <h3><deck-badge type="ok">Yes</deck-badge> Reviewed in CI</h3>
    <p>Every merge request, no exception.</p>
  </deck-card>
  <deck-card color="red">
    <h3><deck-badge type="bad">No</deck-badge> Reviewed on the branch</h3>
    <p>Only when someone remembers.</p>
  </deck-card>
</deck-grid>
```

**Several figures side by side**

```html
<deck-grid cols="3" gap="5">
  <deck-stat compact num="34">components</deck-stat>
  <deck-stat compact num="23 KB">gzip</deck-stat>
  <deck-stat compact num="3">engines</deck-stat>
</deck-grid>
```

**A pull quote inside a dense slide** · a `deck-punch` in one column of a split,
or a `deck-quote` (§20) when the words belong to someone else.

```html
<deck-split cols="2-1">
  <deck-md slot="left">The long explanation…</deck-md>
  <deck-punch slot="right" tone="accent" fit>The one line that matters.</deck-punch>
</deck-split>
```

**A single record, field by field** · one entity's fields read top to bottom,
each with the value and what backs it, rather than pasted sideways as a
rotated CSV. `deck-table` (§20) already carries this: `highlight-rows` marks
the field that carries the argument, `reveal` discloses one field per step,
and a `deck-source` underneath credits the record. No header-row emphasis is
needed · the field column sits at reading weight, the value column carries
the statement, and the marked row is the one dark band the table already
draws. Reach for this composition instead of a `deck-record` component
because a record is a table with one row per field, and `deck-table` already
has the emphasis and reveal a record needs; a dedicated component would only
duplicate `highlight-rows` and `reveal` under a new name.

```html
<deck-table highlight-rows="3" reveal>
  <table>
    <thead><tr><th>Field</th><th>Value</th><th>What makes it authoritative</th></tr></thead>
    <tbody>
      <tr><td>Incident</td><td>INC-4471</td><td>Assigned by the tracker on file</td></tr>
      <tr><td>Detected</td><td>2026-09-03 02:14 UTC</td><td>Pager timestamp, not a recollection</td></tr>
      <tr><td>Root cause</td><td>Connection pool exhaustion</td><td>Confirmed by the on-call engineer, not guessed</td></tr>
      <tr><td>Owner</td><td>Platform team</td><td>Assignment recorded in the same tracker</td></tr>
    </tbody>
  </table>
</deck-table>
<deck-source href="https://example.com/tracker/INC-4471">Incident tracker, INC-4471</deck-source>
```

---

## 23 · The slide budget

Two ways a slide fails a room, and what the suite does about each.

**Too full is a defect.** The engine never lets content overflow: every slide
shell and every cell carries `overflow: hidden`, so an over-filled slide
silently loses its last lines and nobody in the room knows.
The slide-budget suite walks every shipped deck slide by slide and fails
when a clipping box loses more than a few pixels of content.

**Too empty is a judgement.** A section title is meant to be sparse. The same
spec measures how much of the canvas each slide uses and attaches the report to
the run, without failing · the numbers are advice, and §19 is the answer.

## Presentation previews (0.7.2)

Overview prepares thumbnails incrementally while idle and keeps its grid for reopening. Content or theme changes invalidate the cache. Presenter previews retain their documents and mirror the current slide step, including annotations; the footer reports the current step. Cover layouts display slide numbers unless `no-counter` is set. Custom components can implement `applyStep(step)` to synchronize their reveal state.
