# ADR 001 · A navigation domain for the deck engine

**Status**: accepted · 2026-09-07
**Scope**: `rikiki/src/runtime/deck-root.ts` (1459 lines) and what comes out of it.

## Context

`deck-root.ts` carries, in one class: the slide/step model, the chapter model,
the hash router, keyboard input, mouse/wheel/swipe input, autoplay, zoom and pan,
overlay lifecycle, plugin lifecycle, and the rendering. Every navigation rule is
expressed as a sequence of DOM mutations, so none of it can be tested without a
browser, and a rule cannot be read in one place.

The cost is not hypothetical. `_back()` decides "go to the previous slide" and
"land on its last step" as **two** statements: `_goTo(idx)` then
`this.step = this._maxSteps()`. When a plugin owns navigation and defers it (a
View Transition), the second statement runs against the old slide and the
deferred navigation then resets the step to 0. The bug is a direct consequence
of the decision living in the mutation, not in a model.

The v1.0 audit asked for a navigation model testable without a browser. This ADR
says how, following the DDD layering already used on granit-golem: dependencies
point inward, the domain knows nothing of the DOM, business rules live in the
model and the outer layers only adapt.

## Decision

Introduce one bounded context, **deck navigation**, in `rikiki/src/domain/`.

### Domain · pure, DOM-free, no framework

| Concept | Kind | Carries |
|---|---|---|
| `DeckPosition` | value object | `{ slide, step }` · where the deck is |
| `Chapter` | value object | `{ start, length }` · a run of slides under one section |
| `DeckOutline` | value object | slide count + chapters · the shape of the deck |
| `NavigationPolicy` | value object | `{ loop, twoD }` · the author's navigation choices |
| navigation verbs | domain service | `advance`, `back`, `goToSlide`, `goToCoords`, `clamp`, `coordsOf` |

Step counts are **injected** as `stepsOf: (slide) => number` rather than stored.
The engine derives them from the DOM and from plugin hooks, which the domain must
not know about; a function parameter keeps the model pure and lets a test say
"slide 2 has 3 steps" in one line.

Every verb returns a **complete** `DeckPosition`, or `null` for "this does
nothing". That is the fix for the class of bug above: the caller applies one
whole position, so there is no window in which slide and step disagree.

**Invariants** the model guarantees at all times:

1. `0 <= slide < slideCount` (or the position is `null` on an empty deck)
2. `0 <= step <= stepsOf(slide)`
3. `advance` from the last step of the last slide is `null`, unless `loop`
4. `back` into a previous slide lands on that slide's **last** step, atomically
5. `goToCoords` on a coordinate that no longer exists clamps to the nearest
   valid slide rather than snapping to 0

### Application · orchestration and ports

Thin, because a deck is not a server. A navigation use case reads the current
outline, asks the domain for the next position, and applies it through ports:
`SlidesPort` (what is on screen), `LocationPort` (the URL hash), `ClockPort`
(autoplay). Ports are declared here, implemented outside.

### Infrastructure · adapters

The DOM, the URL, timers, keyboard and pointer events. This is the only layer
that knows Lit, `location`, `window` or `setInterval`.

### Edge · `deck-root`

Parses attributes, wires events to use cases, renders. No navigation rule.

## Dependency direction

```
edge (deck-root)  ->  application  ->  domain
infrastructure    ->  application  ->  domain
```

Nothing points outward. `rikiki/src/domain/**` must not import from `lit`,
`../runtime/`, `../infrastructure/`, or reference `document`, `window` or
`location`. This is enforced by a test, not by discipline
(`scripts/architecture.test.mjs`).

## Rejected alternatives

- **Split `deck-root.ts` into files by feature, keep the DOM coupling.** Gives
  smaller files and the same untestable rules. The audit asked for a model that
  runs without a browser; file surgery does not produce one.
- **Put the model in the existing `src/shared/`.** `shared/` is a bag of pure
  helpers with no boundary; adding the engine's core rules to it would make the
  boundary impossible to enforce and impossible to name.
- **Rewrite `deck-root` in one pass.** The engine has 235 browser tests behind
  it and a published API. A single-pass rewrite spends that safety net all at
  once. The gates below spend it one step at a time.
- **Make the domain read step counts itself.** It would need the DOM and the
  plugin registry, which is precisely the dependency this ADR removes.

## Gates

Each gate is a stopping point. It is passed only when **every** check below is
green; a red check is fixed before the next gate starts, never carried.

| Gate | Delivers | Passes when |
|---|---|---|
| **A** | domain model + pure tests | domain has zero DOM/framework import; verbs cover the five invariants; architecture guard green |
| **B** | `deck-root` delegates every navigation decision | full suite green on Chromium, Firefox, WebKit; no public API change; `dist` rebuilt and committed |
| **C** | hash router behind a port | deep-link rules testable without a browser; embedded-deck URL contract preserved |
| **D** | input adapters (keyboard, pointer, autoplay) behind ports | input rules testable without a browser; `mouse-nav` and embed scoping preserved |
| **E** | `deck-root` is an edge component | architecture guard covers every layer; the navigation rules no longer appear in the edge |

### Outcome

All five passed, 2026-09-07. What moved, and what it bought:

| Layer | Modules | Tests, no browser |
|---|---|---|
| domain | outline, navigation verbs, deep-link grammar, zoom/pan arithmetic | 99 |
| application | deep-link use case, keymap, mouse-nav | 66 |
| infrastructure | the URL adapter | via the use case |

Two defects fell out of the move rather than being hunted:

- Going back across a `data-morph` pair landed on step 0 instead of the slide's
  last step. Two statements decided one thing; the morph deferred the first.
  Reproduced (`0.0` before, `0.3` after) and pinned in `e2e/navigation.spec.ts`.
- A 2D deck wrote a deep link it could not read back: `#3.1` written for
  "slide 3, step 1", parsed as "chapter 3, slide 1". One grammar, both ways.

The guard in `scripts/architecture.test.mjs` now checks the domain, the
application layer, the adapters **and** the edge, and each of its rules has been
verified to fail when the property it defends is broken.

Common bar for every gate: `biome`, `tsc --noEmit`, `vitest run`,
`playwright test` on the three engines, no `dist` drift, and no change to the
public API (custom elements, attributes, events, CSS parts and tokens).

## Consequences

- Navigation rules become readable in one file and testable in milliseconds.
- The deferred back-navigation bug is fixed by construction, not by a patch.
- One more directory layer to learn, and two indirections between an event and
  a DOM mutation. Accepted: the rules were previously unreadable and untestable.
