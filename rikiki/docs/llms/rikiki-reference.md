# Rikiki · LLM reference

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

**2D navigation** activates automatically when the deck has **2+ chapters and at
least one chapter has multiple slides**. Chapters are bounded by `<deck-section>`
markers. In 2D mode: `←`/`→` move between chapters, `↑`/`↓` move within a chapter
(both fall back to linear motion at the edges).

**Mouse navigation** is on by default (since 0.3.0): left click advances
(Shift+click goes back), the scroll wheel navigates with a trackpad-friendly
debounce, discreet chevrons sit bottom-right (2D-aware), and mouse
back/forward buttons map to back/advance. Interactive elements (`a`,
`button`, inputs, `[contenteditable]`) never trigger navigation; add
`data-no-advance` to opt any element out. Configure with the `mouse-nav`
attribute on `<deck-root>`:

| Value | Meaning |
|-------|---------|
| *(absent)* | Everything on · the default |
| `mouse-nav="none"` | Keyboard-only deck (pre-0.3 behavior) |
| `mouse-nav="wheel arrows"` | Granular subset of `click`, `wheel`, `arrows`, `aux` |

Chevron styling tokens: `--deck-root-nav-color`, `--deck-root-nav-bg`,
`--deck-root-nav-opacity`.

**Hash format** (deep-linking):

| Form | Meaning |
|------|---------|
| `#3` | slide 3 (1-based) |
| `#3.2` | slide 3, step 2 |
| `#2.3` | chapter 2, slide 3 (2D nav only) |
| `#2.3s1` | chapter 2, slide 3, step 1 (2D nav only) |

The 2D forms only apply when 2D navigation is active; otherwise `#a.b` is read as
`slide.step`.

---

## 4 · Layouts (slide-level containers)

Direct children of `<deck-root>`. Each is one slide.

| Tag | Purpose | Key attributes | Slots |
|-----|---------|----------------|-------|
| `deck-cover` | Opening slide, dark, with brand + meta | `brand` (split on " · "), `brand-src` (logo URL), `speaker`, `duration`, `audience` | default `<h1>`, `.sub`/`p[slot=sub]` |
| `deck-section` | Chapter divider (also a chapter boundary for 2D nav) | `num` | default `<h1>` (may use `<em>`) |
| `deck-feature` | Headline + lead + one focal block | `eyebrow` | `title` (`<h1>`), `lead`, default (focal block, e.g. `deck-code`) |
| `deck-split` | Two or three columns side by side | `eyebrow`, `cols` (`1-1`/`1-2`/`2-1`/`3`), `gap` (1..6), `col-gap` (1..6) | `title`; `left`/`right` (2-col) or `a`/`b`/`c` (3-col) |
| `deck-feature-cards` | Hero focal block + two detail cards under it | `eyebrow` | `title`, `lead`, default (hero block), `left`, `right` |
| `deck-photo` | Full-bleed image slide, content on overlay | `src` (required), `position`, `darken` (0..1), `align` (top/center/bottom), `text-align` (left/center/right) | default `<h1>`, `.sub` |
| `deck-takeaway` | Centered punchline, dark | `kicker` | default (e.g. `p.display`, `p.caption`, a `deck-callout`) |

---

## 5 · Molecules (composed containers)

| Tag | Purpose | Key attributes | Slots / children |
|-----|---------|----------------|------------------|
| `deck-callout` | Highlighted note box | `type` (`info`/`warn`/`danger`/`ok`) | default (text / `deck-md`) |
| `deck-card` | Tinted card | `color` (`yellow`/`orange`/`green`/`red`), `center`, `compact` | default (`<h3>` + body) |
| `deck-md` | Render Markdown (GFM) | · | default = raw Markdown text |
| `deck-mermaid` | Render a Mermaid diagram (loads Mermaid from CDN) | `compact` | default = Mermaid source |
| `deck-stat` | Big-number visual | `num`, `tone` (`yellow`/`orange`/`green`/`red`/`purple`/`lime`/`cyan`) | `claim` (`<h3>`), default = body line |
| `deck-metric-list` | Wraps `deck-metric` rows | · | `deck-metric` children |
| `deck-metric` | One metric row | `severity` (`bad`/`warn`/`ok`/`info`), `value` | default = label |
| `deck-tier-list` | Tier ladder | · | `deck-tier`, `deck-tier-arrow` children |
| `deck-tier` | One tier row | `name`, `desc`, `speed`, `severity` (`muted`/`warn`/`ok`/`hot`), `hot` | · |
| `deck-tier-arrow` | Separator note between tiers | · | default = text |
| `deck-step-list` | Numbered step ladder | · | `deck-step` children |
| `deck-step` | One step row | `n`, `note` | default = label |
| `deck-shortcut-list` | Two-column shortcut grid | `gap` (1..6) | `deck-shortcut` children |
| `deck-shortcut` | One keyboard-shortcut row | `keys` (space-separated), `label`, `note` | default = note |
| `deck-kbd` | Inline key chip | · | default = key text |
| `deck-stack` | Flex stack helper | `gap` (1..6), `direction` (`row`/`column`), `align` (`start`/`center`/`end`/`stretch`), `justify` (`start`/`center`/`end`/`between`/`around`) | children |
| `deck-grid` | CSS grid helper | `cols` (1..12 or template), `rows`, `gap` (1..6 or CSS), `align`, `justify`, `fill` | children |

---

## 6 · Atoms (primitives)

| Tag | Purpose | Key attributes | Slots |
|-----|---------|----------------|-------|
| `deck-badge` | Small status badge | `type` (`bad`/`ok`/`info`/`warn`/`neutral`) | default = text |
| `deck-kicker` | Uppercase eyebrow label | `on-dark` | default = text |
| `deck-punch` | Short punchy line | `tone` (`default`/`warn`/`danger`/`ok`/`info`/`muted`/`accent`), `size` (`lead`/`big`/`mega`/`stat`/`display`), `weight` (`700`/`800`/`900`), `align` (`left`/`center`/`right`) | default = text |
| `deck-code` | Syntax-highlighted code | `lang`, `hero`, `nested`, `step-groups` | default = code text |

### deck-code details

- `lang` · drives highlighting: `js` / `ts` / `json` (default), `html` / `xml` /
  `svg`, `css` / `scss` / `less`.
- `hero` · centers the block vertically as the slide's focal element.
- `nested` · lighter border, no shadow (for use inside a `deck-card`).
- `step-groups` · a JSON array attribute that turns the snippet into a stepped
  reveal; the number of groups becomes the slide's step count (see §7).

Highlighting is done client-side with a built-in highlighter (no build step). An
opt-in Shiki plugin (`installShiki()` from `dist/shiki.js`) can upgrade
highlighting if desired.

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

`src/plugins/click-stages.ts` adds Slidev-style `v-click`-style reveals. It is
**opt-in** · not part of the core bundle. Install it after rikiki loads:

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
| `data-click-auto="800"` | **No click consumed** · reveals 800 ms after the previous stage (or slide activation). Consecutive autos chain — one click can drive a whole choreography |
| `data-click-stagger="80"` | On a container · **one** click reveals its children in a cascade, 80 ms apart |
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
incoming one) — bare attributes would put them on two sequential clicks.

The plugin patches `deck-root` so its step counter accounts for `[data-click]`
elements, and stepping toggles their visibility. Going back cancels pending
auto/stagger timers. Deep links and back-navigation settle instantly (no
replayed delays). It respects `prefers-reduced-motion`. When a `data-morph`
navigation runs, the deck-wide `transition="…"` animation is skipped for that
navigation so the two don't fight.

---

## 8 · Presenter mode

Press **`P`** to open a speaker window. It mirrors the current slide and the
next slide (rendered live via the rikiki bundle), shows a timer/clock, and
displays the speaker notes for the current slide.

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

> The single-file export step (`bundle.mjs`, §11) only rewrites paths that use
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

## 13 · Authoring rules for LLMs

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
