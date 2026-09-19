![Rikiki](assets/header.webp)

# Rikiki

[![npm](https://img.shields.io/npm/v/rikiki-deck)](https://www.npmjs.com/package/rikiki-deck)
[![license](https://img.shields.io/npm/l/rikiki-deck)](LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-{{ prodDeps }}-brightgreen)](#the-contract)

**Slide decks written in HTML, by people who write code, that still open in five
years without a toolchain to resurrect.**

You write `<deck-cover>`, `<deck-feature>`, `<deck-code>`. You serve the folder
with any static HTTP server. That is the whole workflow. There is no build step
between you and your finished deck, no `node_modules` in your presentation, and
nothing to migrate when the next major lands.

- **{{ bundled }} elements in the default bundle**, and {{ separate }} more you
  load only when a slide needs one.
- **{{ initialLoadKb }} KB gzip** for a deck that has loaded everything it needs
  to render: engine, Lit, markdown. Measured, not estimated · see below.
- **Zero production dependencies.** `npm install rikiki-deck` pulls nothing.
- **{{ themeCount }} themes** ({{ themes }}), re-themed by editing CSS custom
  properties. No package to fork.
- **A CLI** that renders your deck to pictures, measures what is wrong with it,
  exports a PDF, or folds the whole thing into one file that works offline.

[Quickstart](#quickstart) · [The contract](#the-contract) · [Why you should not trust any of the above](#why-you-should-not-trust-any-of-the-above) · [The CLI](#the-cli) · [Contributing](CONTRIBUTING.md)

## What this is not

Presentation frameworks drifted. Reveal.js (2011) still speaks in global CSS
classes and imperative JS plugins. Slidev (2021) ships Vue, Vite, UnoCSS,
Shiki, Monaco and Mermaid · a quarter of a gigabyte of `node_modules` to render
twenty slides. Both made defensible choices for the people they serve. Neither
fits someone who wants to write a technical deck, give the talk, and reopen it
next year without archaeology.

So rikiki refuses things on purpose:

- **No consumer build step.** Not "a fast one". None.
- **No DSL.** No enhanced markdown, no `---` separators, no proprietary syntax.
  Slides are HTML, because HTML is what will still parse in 2036.
- **No plugin system** beyond one hook. A plugin architecture is a promise to
  maintain an API for other people's code, forever.
- **No embedded editor, no drawing tools, no SSR, no video recording, no
  multiplexing.** Those are real features. They are somebody else's.

If you want live-reloading MDX with a component marketplace, this is the wrong
tool and Slidev is very good. If you have ever reopened a two-year-old deck and
found a broken toolchain instead of a presentation, keep reading.

## Quickstart

```console
$ npx rikiki-deck init talk.html
rikiki · wrote talk.html · 1 KB
rikiki · runtime copied to ./rikiki/ · serve this folder over HTTP, ES modules do not load from file://
rikiki · next · edit talk.html · then `rikiki bundle talk.html` for one shareable file
```

Serve the folder with anything · `npx serve .` will do · and open `talk.html`.
Edit the HTML, reload, done. ES modules do not load from `file://`, which is
the only reason a server is involved at all.

A slide is an element with slots:

```html
<deck-feature eyebrow="Measured">
  <h1 slot="title">A slide states a message, not a topic</h1>
  <deck-callout type="info">
    Slots and attributes. No configuration object, no JSX.
  </deck-callout>
</deck-feature>
```

Ship it as a single file that works with no network at all:

```console
$ npx rikiki-deck bundle talk.html talk-offline.html
rikiki · wrote talk-offline.html · 170 KB
```

That file inlines the runtime, the CSS, the fonts and the images. It opens from
a USB stick, on a machine that has never heard of npm.

## The contract

**1 · Source is output, for the reader of your deck.** A deck folder contains
the whole application. No transpilation, no toolchain for the author to
maintain. The framework itself is written in TypeScript and compiled · that
build belongs to contributors, and the promise does not extend to them. It is
worth being precise about which half of a promise you are making.

**2 · Standards first, Lit second.** Custom Elements, Shadow DOM, ES Modules,
CSS Custom Properties · stable W3C specifications since 2018. Lit is used for
ergonomics, about 7 KB gzip of it. If Lit vanished tomorrow the components
would be rewritten on `customElements.define` and template strings, and your
decks would keep running.

**3 · Light by default.** The default bundle registers the {{ bundled }}
elements most decks use, {{ engineKb }} KB gzip of them. The other
{{ separate }} are one `<script>` tag each. Past about four of those,
`rikiki bundle` is smaller than any combination of them · that threshold is
measured and the figures are pinned by a test.

**4 · Themes are CSS, not packages.** Roughly a hundred custom properties.
Writing a third theme is copying `themes/rikiki.css` and changing colours.
Components expose their knobs as `--deck-*` properties that fall back to
semantic `--rik-*` tokens, so one declaration re-themes every instance.

## Why you should not trust any of the above

Every number in this file is a claim, and claims rot. Here is what is
mechanical rather than hoped for.

**The figures above were measured while this page was written.** This README is
generated from `README.template.md` by `scripts/build-readme.mjs`, which reads
the sizes off the built artifact and the component counts out of what
`src/index.ts` imports. There is no number here for a human to update, and CI
fails if the committed file no longer matches what the generator produces ·
the same treatment `dist/` and the bundled examples already get.

**Contrast is measured from the theme files.** Not sampled once and written
into a comment. `theme-contrast.test.mjs` parses both themes and fails on a
pair below the WCAG floor, which is how a red that reads fine on paper was
caught measuring 3.97:1 on a dark code surface.

**Every guard has been seen to fail.** A test nobody has watched go red is a
test that defends nothing. The architecture rules, the component contract and
the tree rules were each broken on purpose, one at a time, to check they bite.

**The render net loads every fixture deck in a real browser, on three
engines.** Chromium runs everything including print-to-PDF and accessibility;
Firefox and WebKit run the contract. A component that appears in no fixture is
measured by nothing, so a test refuses to let one exist.

**The published `dist/` is reproducible.** It is committed, which is the whole
zero-build promise, and that makes drift the obvious failure mode. A clean
clone by someone who is not the maintainer rebuilds it byte for byte, and CI
fails on any difference.

**It says no, too.** `e2e/ink.spec.ts` reports where the ink sits on a slide
and deliberately does not fail on it: the engine does not own vertical
distribution yet, so a threshold there would encode taste, and a test that
encodes taste gets worked around within a month. Two other checks were written,
measured and deleted · a `part=` rule that could not tell a missing wrapper
from a component that needs none, and a dead-property detector whose every
remaining finding turned out to be a false positive.

The reasoning behind the design lives in [`MANIFESTO.md`](./MANIFESTO.md) and
the decisions in [`docs/design/`](./docs/design/), including the ones that were
rejected and why.

## The CLI

`npx rikiki-deck <command>`. It needs Node {{ node }}; your deck does not.

| Command | What it does |
|---|---|
{{ cliTable }}

`check` is the one worth trying first. It opens the deck in a real browser and
reports overflow, unreadable contrast, missing sources and slides whose title
names a topic instead of stating a message.

## Contributing

Sources are organised by **family** · what a component serves, not how big it
is: `engine/`, `layout/`, `structure/`, `text/`, `data/`, `media/`, plus
`core/` for the navigation domain. One axis, held by tests.

```bash
git clone https://github.com/ChariereFiedler/rikiki.git
cd rikiki/rikiki && npm ci
npm test                                   # the consistency suite
npm run new:component -- text deck-thing   # scaffolds a conforming component
```

The generator writes a component that already passes every guard, and a test
runs the generator and checks its output against those guards, so the template
cannot quietly stop being right.

[`CONTRIBUTING.md`](./CONTRIBUTING.md) for the workflow ·
[`ROADMAP.md`](./ROADMAP.md) for what is next ·
[`SECURITY.md`](./SECURITY.md) to report a vulnerability ·
[`docs/llms/rikiki-reference.md`](./rikiki/docs/llms/rikiki-reference.md) for
the full element reference, which is also what an agent reads.

## The name

*Rikiki* is French for "teeny", the word you use for something almost comically
small. It was meant as a working title until the engine stopped growing, and
then the engine stopped growing.

This page documents rikiki v{{ version }} · the badge above tracks what is
published, and `npm run bump` keeps the two from disagreeing.

MIT licensed. Built by [Cédric Chariere Fiedler](https://github.com/ChariereFiedler).
