# Art direction · three story systems

Supersedes `redesign-plan.md`, `token-system.md` and `component-plan.md`. Written before the code, reviewed against the generic defaults, then built.

## Why the previous pass was rejected

- All three decks shared one skeleton: photo cover, then light-page slides built from the same pale cells, the same icon-over-heading-over-paragraph stack and the same title treatment. Changing the palette did not change the deck.
- Body text fell back to system fonts (Georgia, Arial, Courier New rendered as DejaVu and Liberation). Each deck had one real face and a borrowed one.
- Quidditch sat on cream paper with a serif display and a wine accent, the first generic cluster. ACME was navy engineering paper with Courier, the blueprint cliché. The refuge was mint cells with rounded corners, the SaaS card kit.
- `story-tokens.css` plus three near-identical `*-layout.css` files fought each other with `!important`, so no value had a single owner.

## Architecture

One file per deck, `art/<story>.css`, loaded after `rikiki/themes/rikiki.css`. The base theme keeps its reset and painting rules; the story file re-points the semantic `--rik-*` layer and the component `--deck-*` layer at `:root`, in that order, from a private `--<story>-*` palette. Light-DOM rules exist only where a component leaves the content to the author (slotted headings, the cover composition, image crops). No `!important`, no body classes, no selectors that outrank a component's own tokens.

Fonts are self-hosted OFL latin subsets in `art/fonts/`, each with its licence.

## Quidditch · the saddler's catalogue

Subject: a club committee buying equipment. Reference: the leather-and-brass catalogue of an old sporting outfitter, read at night in the clubhouse. The supplied photograph is a dark studio still life, so the deck is set in that darkness instead of on paper.

| role | value | note |
|---|---|---|
| page | `#220f13` claret night | sampled from the photograph's shadow |
| rule | `#5a2029` oxblood | quiet dividers |
| mass | `#fbf3e4` bone | the one filled thing, a printed card on a dark table |
| mark | `#e8c27a` brass | the ferrule on the broom · rules, numerals, icons |
| muted text | `#ece0cb` | reading text on the dark page, raised after review: every reading tone clears 9:1 |

Type: Bodoni Moda (optical size axis, 500 and italic) for statements, Jost for reading. A Didone against a geometric sans, the pairing of a 1930s outfitter's catalogue.

Layout: wide margins, titles left and high, content sitting low with air above it. Numerals are Bodoni and large. No card chrome: items are separated by space and, where two columns touch, a brass rule. Slow rhythm, one statement per slide.

Native evidence: `deck-photo`, `deck-bento` with a bone mass, three-column shortlist as `deck-point`s, `deck-graph` with a `deck-group` for the shared course, `deck-versus`, `deck-bar`, a photographic detail crop inside `deck-cell`, `deck-split` with `deck-step-list`.

## ACME · the cartoon storyboard

Subject: a coyote's capture plan in design review. Reference: the flat painted desert of 1950s theatrical cartoons and ACME's stencilled crates. The supplied painting gives the whole palette.

| role | value | note |
|---|---|---|
| page | `#f2e3b8` desert sky | the pale sky right of the machine, saturated yellow, not paper |
| mass | `#cf3e20` machine vermilion | the loud thing, with sky-coloured text |
| ink | `#191714` letterbox black | text, inklines, the secondary mass |
| mark | `#3f5a68` mesa-shadow slate | secondary text and small marks |
| ground | `#e59a62` desert floor | one decorative band only |

Type: Barlow Condensed ExtraBold for statements, set in poster capitals; Barlow for reading, a signage grotesque. Uppercase is reserved for the statements. A stencil face (Big Shoulders Stencil) was tried first and rejected in review: the cut bridges made headings hard to read at a glance.

Layout: tight margins, oversized statements, thick black inklines, square corners and a hard offset shadow under filled blocks, like a cel over its background. Dense and fast: a gag has a rhythm.

Native evidence: `deck-photo`, `deck-versus`, `deck-graph` as one left-to-right chain whose untested link is the vermilion node between two dashed "assumed" arrows, `deck-flow` revealed frame by frame, `deck-bento` crop of the suspended load, `deck-table` with a marked column, `deck-kpi-grid` with one vermilion STOP, `deck-feature-cards` with `deck-punch`.

> **Superseded for the refuge on 2026-09-23.** The grey tracing-paper treatment below was rejected. The deck now uses the lamplit wall behind the model as its page, the wolf's shadow as a dark "night" register, a pale pinned sheet for technical beats, brick for weak points, straw gold for agreements, and Fraunces with Archivo. See `art/three-pigs.css` and `visual-review-2026-09-23.md`.

## Three little pigs · the architect's model review (rejected)

Subject: a small practice presents a refuge to three clients. Reference: a model-shop review, tracing paper over a plan, graphite lines, one red pencil for what must change. The supplied photograph is the model under raking light with the wolf's shadow on the wall.

| role | value | note |
|---|---|---|
| page | `#efefeb` tracing paper | cool neutral, not cream |
| ink | `#1f1d1b` graphite | text and plan lines |
| mass | `#33261d` wolf-shadow umber | the one filled thing |
| mark | `#a8391f` red pencil | corrections and the single accent |
| balsa | `#e3c79a` | text on the umber mass, the model's material |

Type: Archivo at two widths. Expanded 125 and heavy for statements, like the lettering on an architectural plate; normal width for reading. One family, the width is the voice.

Layout: an orthogonal drawing grid. Titles low on the top band, 2px graphite frames where drawings sit, square corners, content aligned to one left edge. Measured, calm, precise.

Native evidence: `deck-photo`, `deck-versus`, three material crops of the model inside `deck-bento`, `deck-annotate`, `deck-tier-list` for priorities, `deck-timeline` revealed by stage, `deck-checklist`, closing `deck-bento`.

## Review of the plan against the generic defaults

- Cream plus serif plus wine was Quidditch's rejected look. Moved to the photograph's own darkness; the accent is brass, not a single acid colour on near-black, and the mass is a light bone card rather than more darkness.
- ACME's first idea was blueprint blue with a mono face. Rejected as the engineering cliché; replaced by the painting's sky, vermilion and stencil.
- The refuge first drifted towards brick red on cream, which collided with ACME's vermilion and with the cream cluster. Moved to cool tracing paper, graphite and a sparse red pencil; the loud surface is umber, not red.
- No tracked-out capital labels, no middle-dot meta strings, no numbered markers outside real sequences (the course, the programme, the approval steps), no icon-card triplets where a different component carries the idea better.
- Three grounds that cannot be confused in a thumbnail row: dark claret, saturated yellow, cool grey-white.
