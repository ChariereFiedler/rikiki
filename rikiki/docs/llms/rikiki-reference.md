# Rikiki · LLM reference

This reference documents rikiki v0.7.1.

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
```

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
| `SLIDE_DENSE` | warning | nothing is cut yet, but there is no room left |
| `SLIDE_TOP_HEAVY` | warning | measured on the pixels · the ink sits in the top with a dead band under it |
| `TALK_SHORTER_THAN_ANNOUNCED` | warning | the notes carry far less speech than the cover announces |
| `TEXT_TOO_SMALL` | warning | below the readable floor once the canvas is scaled |
| `UNKNOWN_ATTRIBUTE` | warning | an attribute the element neither reads nor styles on · the value is dropped |
| `DUPLICATE_SLIDE_ID` | warning | two slides answer to the same name |
| `EXTERNAL_DEPENDENCY` | warning | the deck fetches from the network at runtime |
| `GRAPH_NODE_OUT_OF_BOUNDS` | error | a `deck-node` is painted outside its `deck-graph` canvas · move it inward with `at`, shorten its note, or constrain it with `width` |
| `GRAPH_EDGE_CROSSES_NODE` | warning | the line a `deck-edge` actually paints, bends and stroke width included, runs over a node it does not connect · move the obstructing node, or route the edge around it |
| `GRAPH_NODE_OVERLAPS_NODE` | error | two `deck-node` of the same `deck-graph` are painted on top of each other · one of them is unreadable |

The report also carries `notChecked`, which names what was **not** looked at:
revealed steps, accessibility, wording and facts, other viewports, text inside
a diagram, and the size of a component's own chrome. Silence about a check that
never ran would read as a clean bill.

Two things it will not do: call a slide bad for having empty space, and claim a
deck is accessible. Space is a choice, and a handful of measurements is not an
accessibility audit.

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
server**, not a double-click: `python3 -m http.server`, `npx serve`, anything.
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
